from flask import Flask, render_template, jsonify
from datetime import datetime
import random

app = Flask(__name__)

# Simulação de dados do tanque
TANK_SETTINGS = {
    "tank_name": "Reservatório Principal",
    "tank_height": 1000,   # cm
    "tank_width": 200,     # cm
    "tank_length": 200,    # cm
    "total_volume": 40000, # litros
    "dead_zone": 0,
    "low_alert_threshold": 20,
    "high_alert_threshold": 100
}

# Histórico de medições (simulação)
history_data = []

def simulate_tank_reading():
    """Simula leitura do sensor do tanque"""
    distance_cm = random.uniform(0, TANK_SETTINGS["tank_height"])
    level_percentage = max(0, min(100, 100 - ((distance_cm - TANK_SETTINGS["dead_zone"]) / TANK_SETTINGS["tank_height"] * 100)))
    volume_liters = TANK_SETTINGS["total_volume"] * (level_percentage / 100)
    return {
        "distance_cm": round(distance_cm, 2),
        "level_percentage": round(level_percentage, 2),
        "volume_liters": round(volume_liters, 2),
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

# Página principal multi-tanque
@app.route("/")
def index_multi():
    return render_template("index_multi.html")

# Última leitura
@app.route("/api/latest")
def api_latest():
    reading = simulate_tank_reading()
    # Armazena histórico
    history_data.append(reading)
    # Mantém apenas os últimos 500 registros
    if len(history_data) > 500:
        history_data.pop(0)
    return jsonify(reading)

# Histórico de leituras
@app.route("/api/history")
def api_history():
    return jsonify(history_data)

# Configurações do tanque
@app.route("/api/settings")
def api_settings():
    return jsonify(TANK_SETTINGS)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
