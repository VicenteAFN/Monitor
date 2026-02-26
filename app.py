import os
from datetime import datetime
import logging
import sqlite3
import pytz

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g
from flask_cors import CORS

# ==============================
# CONFIGURAÇÃO DE LOGS
# ==============================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SECRET_KEY", "condominio-colina-dos-cedros-2024")

CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# ==============================
# CONFIGURAÇÃO DO TANQUE
# ==============================
TANK_CONFIG = {
    "name": "Reservatório Principal",
    "tank_height": 1000,
    "tank_width": 200,
    "tank_length": 200,
    "sensor_offset": 30,
    "empty_distance": 1000,
    "low_alert_threshold": 20,
    "high_alert_threshold": 100,
    "total_volume": 40000
}

# ==============================
# VARIÁVEIS GLOBAIS
# ==============================
nivel_filtrado = None
ALPHA = 0.08
alerta_ativo = False

current_data = {
    "tank_id": "tank1",
    "level_percentage": 0,
    "volume_liters": 0,
    "distance_cm": 0,
    "status": "offline",
    "timestamp": None,
    "alert_low": False
}

# ==============================
# BANCO DE DADOS
# ==============================
def init_database():
    db_path = os.path.join("/tmp/", "water_monitor.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tank_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            distance_cm REAL NOT NULL,
            level_percentage REAL NOT NULL,
            volume_liters REAL NOT NULL,
            status TEXT NOT NULL,
            alert_low BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)

    conn.commit()
    conn.close()
    logger.info("Banco de dados inicializado com sucesso.")


# ==============================
# CÁLCULO DE DADOS
# ==============================
def calculate_data(distance_from_sensor_cm, status="online", tank_id="tank1"):

    empty_at_cm = TANK_CONFIG["empty_distance"]
    total_volume = TANK_CONFIG["total_volume"]

    if distance_from_sensor_cm <= 35:
        percentage = 100.0
    elif distance_from_sensor_cm >= empty_at_cm:
        percentage = 0.0
    else:
        percentage = ((empty_at_cm - distance_from_sensor_cm) / (empty_at_cm - 35)) * 100

    liters = (percentage / 100) * total_volume

    if percentage < 0:
        percentage = 0
    if liters < 0:
        liters = 0

    brasiliatime = pytz.timezone("America/Sao_Paulo")
    timestamp_br = datetime.now(brasiliatime).isoformat()

    return {
        "tank_id": tank_id,
        "distance_cm": round(distance_from_sensor_cm, 2),
        "level_percentage": round(percentage, 2),
        "volume_liters": round(liters, 2),
        "status": status,
        "timestamp": timestamp_br
    }


# ==============================
# ROTAS WEB
# ==============================
@app.route("/")
def index():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", tank_name=TANK_CONFIG["name"])


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == "admin" and password == "admin123":
            session["user"] = "admin"
            logger.info("Login realizado com sucesso.")
            return redirect(url_for("index"))

        logger.warning(f"Tentativa de login falhou para o usuário: {username}")
        return render_template("login.html", error="Credenciais inválidas")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))


# ==============================
# API RECEBIMENTO
# ==============================
@app.route("/api/water-level", methods=["POST"])
def receive_data():
    global current_data, nivel_filtrado, alerta_ativo

    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "JSON não fornecido"}), 400

        dist_raw = float(data.get("distance_cm", 0))
        status = data.get("status", "online")

        if dist_raw < 10 or dist_raw > 1100:
            logger.warning(f"Leitura absurda ignorada: {dist_raw} cm")
            return jsonify({"status": "ignored"}), 200

        if nivel_filtrado is None:
            nivel_filtrado = dist_raw
        else:
            nivel_filtrado = ALPHA * dist_raw + (1 - ALPHA) * nivel_filtrado

        calculated_values = calculate_data(nivel_filtrado, status, "tank1")
        current_data.update(calculated_values)

        if alerta_ativo:
            if current_data["level_percentage"] > 23:
                alerta_ativo = False
        else:
            if current_data["level_percentage"] < 20:
                alerta_ativo = True

        current_data["alert_low"] = alerta_ativo

        db_path = os.path.join("/tmp/", "water_monitor.db")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()

        c.execute("""
            INSERT INTO water_history 
            (tank_id, timestamp, distance_cm, level_percentage, volume_liters, status, alert_low)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            current_data["tank_id"],
            current_data["timestamp"],
            current_data["distance_cm"],
            current_data["level_percentage"],
            current_data["volume_liters"],
            current_data["status"],
            current_data["alert_low"]
        ))

        conn.commit()
        conn.close()

        logger.info(
            f"Dados recebidos: {dist_raw}cm -> "
            f"{current_data['volume_liters']}L "
            f"(%: {current_data['level_percentage']}%)"
        )

        return jsonify({"status": "success", "data": current_data})

    except Exception as e:
        logger.error(f"Erro ao receber dados: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400


@app.route("/api/latest")
def get_latest():
    return jsonify(current_data)


@app.route("/api/history")
def get_history():
    try:
        db_path = os.path.join("/tmp/", "water_monitor.db")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()

        c.execute("""
            SELECT timestamp, level_percentage, volume_liters, alert_low
            FROM water_history
            ORDER BY timestamp DESC
            LIMIT 50
        """)

        rows = c.fetchall()
        conn.close()

        history_data = []
        for r in rows:
            history_data.append({
                "timestamp": r[0],
                "level_percentage": r[1],
                "volume_liters": r[2],
                "alert_low": bool(r[3])
            })

        return jsonify(history_data)

    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        return jsonify([])


@app.route("/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now(pytz.timezone("America/Sao_Paulo")).isoformat()
    })


@app.before_request
def before_request_func():
    if not hasattr(g, "db_initialized"):
        init_database()
        g.db_initialized = True


# ==============================
# RENDER COMPATIBILITY
# ==============================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)