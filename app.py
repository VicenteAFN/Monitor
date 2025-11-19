from flask import Flask, request, jsonify, render_template
from datetime import datetime

app = Flask(__name__)

# Variável global para armazenar o último valor recebido
last_data = {
    "distance": None,
    "timestamp": None
}

@app.route("/")
def index():
    # Envia dados atuais para o HTML
    return render_template("index.html", 
                           distance=last_data["distance"],
                           timestamp=last_data["timestamp"])

@app.route("/api/water-level", methods=["POST"])
def receive_water_level():
    global last_data
    
    try:
        data = request.get_json()

        if not data or "distance" not in data:
            return jsonify({"error": "JSON inválido. Envie {'distance': valor}"}), 400

        # Salva
        last_data["distance"] = data["distance"]
        last_data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        print(f"📥 Recebido do LoRa: {data['distance']} cm")

        return jsonify({"status": "ok", "received": data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/last-data", methods=["GET"])
def get_last_data():
    return jsonify(last_data), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)
