from flask import Flask, request, jsonify, render_template
from datetime import datetime

app = Flask(__name__)

# Histórico em memória (para testes)
history = []

# Configurações do tanque
tank_settings = {
    "tank_name": "Reservatório Principal",
    "tank_height": 1000,   # cm
    "tank_width": 200,     # cm
    "tank_length": 200,    # cm
    "total_volume": 40000, # litros
    "dead_zone": 0,
    "low_alert_threshold": 20,
    "high_alert_threshold": 100
}

# Status do sistema
system_status = "offline"

# ===========================
# Rotas do front-end
# ===========================
@app.route('/')
def index():
    return render_template('index_multi.html')

# ===========================
# API: Receber leitura
# ===========================
@app.route('/api/water-level', methods=['POST'])
def receive_data():
    global system_status
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400

    # Campos esperados: level_percentage, volume_liters, distance_cm, status
    entry = {
        "timestamp": datetime.now().isoformat(),
        "level_percentage": float(data.get("level_percentage", 0)),
        "volume_liters": float(data.get("volume_liters", 0)),
        "distance_cm": float(data.get("distance_cm", 0)),
        "status": data.get("status", "offline")
    }

    history.append(entry)
    system_status = entry["status"]
    return jsonify({"message": "Recebido com sucesso"}), 200

# ===========================
# API: Última leitura
# ===========================
@app.route('/api/latest', methods=['GET'])
def latest_reading():
    if not history:
        return jsonify({
            "timestamp": None,
            "level_percentage": 0,
            "volume_liters": 0,
            "distance_cm": 0,
            "status": "offline"
        })
    return jsonify(history[-1])

# ===========================
# API: Histórico completo
# ===========================
@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(history)

# ===========================
# API: Configurações do tanque
# ===========================
@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify(tank_settings)

@app.route('/api/settings', methods=['POST'])
def update_settings():
    global tank_settings
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dados inválidos"}), 400
    tank_settings.update(data)
    return jsonify({"message": "Configurações atualizadas"}), 200

# ===========================
# Rodar o servidor
# ===========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
