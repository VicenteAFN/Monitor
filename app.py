from flask import Flask, jsonify
from datetime import datetime
import random

app = Flask(__name__)

# Configurações do tanque
TANK_SETTINGS = {
    "name": "Caixa Principal",
    "tank_height": 200,      # cm
    "tank_width": 100,       # cm
    "tank_length": 150,      # cm
    "total_volume": 40000,    # litros
    "dead_zone": 10,         # cm
    "low_alert_threshold": 30,   # %
    "high_alert_threshold": 70   # %
}

# Última medição simulada
latest_data = {
    "timestamp": datetime.now().isoformat(),
    "level_percentage": 50,
    "volume_liters": 1500,
    "distance_cm": 100,
    "status": "online"
}

# Histórico de medições simuladas
history_data = [
    {
        "timestamp": (datetime.now()).isoformat(),
        "level_percentage": random.randint(0,100),
        "volume_liters": random.randint(0, int(TANK_SETTINGS['total_volume']))
    } for _ in range(20)
]

@app.route('/api/latest')
def api_latest():
    return jsonify({**latest_data, "settings": TANK_SETTINGS})

@app.route('/api/history')
def api_history():
    return jsonify(history_data)

@app.route('/api/settings')
def api_settings():
    return jsonify(TANK_SETTINGS)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
