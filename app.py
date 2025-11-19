from flask import Flask, request, jsonify, render_template
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ----------------------------
# CONFIGURAÇÃO DO RESERVATÓRIO
# ----------------------------
TANK1_NAME = "Reservatório Principal"
TANK1_HEIGHT = 1000  # cm
TANK1_WIDTH = 200    # cm
TANK1_LENGTH = 200   # cm
TANK1_CAPACITY = (TANK1_HEIGHT * TANK1_WIDTH * TANK1_LENGTH) / 1000  # litros


# ----------------------------
# ARMAZENAMENTO DA ÚLTIMA LEITURA
# ----------------------------
last_reading = {
    "distance": None,
    "timestamp": None
}

# ----------------------------
# ROTA PRINCIPAL
# ----------------------------
@app.route("/")
def index():
    return render_template(
        "index_multi.html",
        tank1_name=TANK1_NAME,
        tank1_height=TANK1_HEIGHT,
        tank1_width=TANK1_WIDTH,
        tank1_length=TANK1_LENGTH,
        tank1_capacity=TANK1_CAPACITY
    )


# ----------------------------
# RECEBER DADOS DO ESP32 (LoRa → WiFi → Flask)
# ----------------------------
@app.route("/api/water-level", methods=["POST"])
def receive_water_level():
    global last_reading

    data = request.get_json()
    if not data or "distance" not in data:
        return jsonify({"error": "Formato inválido"}), 400

    last_reading["distance"] = float(data["distance"])
    last_reading["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print(f"[NOVO DADO] Distância recebida: {last_reading['distance']} cm")

    return jsonify({"status": "OK"}), 200


# ----------------------------
# FORNECER ÚLTIMA LEITURA PARA O FRONTEND
# ----------------------------
@app.route("/api/last-reading", methods=["GET"])
def get_last_reading():
    if last_reading["distance"] is None:
        return jsonify({"distance": None})

    return jsonify(last_reading)


# ----------------------------
# RODAR LOCALMENTE
# ----------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
