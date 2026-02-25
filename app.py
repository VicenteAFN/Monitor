import os
from datetime import datetime, timedelta
import json
import logging
import sqlite3
from collections import deque

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g
from flask_cors import CORS

# Configuração de Logs para o Render
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', 'condominio-colina-dos-cedros-2024')

# CORS configurado para aceitar requisições de qualquer origem
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# CONFIGURAÇÕES FIXAS DO RESERVATÓRIO PRINCIPAL (40.000L)
TANK_CONFIG = {
    'name': 'Reservatório Principal',
    'tank_height': 1000,  # Altura total do tanque em cm (do sensor ao fundo)
    'tank_width': 200,   # Largura do tanque em cm
    'tank_length': 200,  # Comprimento do tanque em cm
    'sensor_offset': 30, # Distância do sensor à superfície da água quando o tanque está 100% cheio (em cm)
    'empty_distance': 1000, # Distância do sensor ao fundo do tanque quando 0% cheio (em cm)
    'low_alert_threshold': 20, # % de nível para alerta baixo
    'high_alert_threshold': 100 # % de nível para alerta alto (para transbordamento)
}

# O volume total em litros é fixo em 40.000L, conforme especificado.
TANK_CONFIG['total_volume'] = 40000 # Litros

# FILTRO DE MÉDIA MÓVEL
# Usamos um deque para armazenar as últimas 5 leituras de distância
last_readings = deque(maxlen=5)

# Estado atual em memória (apenas para o Reservatório Principal)
current_data = {
    'tank_id': 'tank1',
    'level_percentage': 0,
    'volume_liters': 0,
    'distance_cm': 0,
    'status': 'offline',
    'timestamp': None
}

def init_database():
    try:
        conn = sqlite3.connect('water_monitor.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS water_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tank_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                distance_cm REAL NOT NULL,
                level_percentage REAL NOT NULL,
                volume_liters REAL NOT NULL,
                status TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()
        logger.info("Banco de dados inicializado com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")

def calculate_data(distance_from_sensor_cm, status='online', tank_id='tank1'):
    # Fórmulas fornecidas:
    # P(%) = (1000 - d) / 970 * 100
    # V_agua = (1000 - d) / 970 * 40000

    full_at_cm = TANK_CONFIG['sensor_offset'] # 30 cm
    empty_at_cm = TANK_CONFIG['empty_distance'] # 1000 cm
    total_volume = TANK_CONFIG['total_volume'] # 40000 L

    # Calcula a faixa de distância útil
    distance_range = float(empty_at_cm - full_at_cm) # 970 cm

    # Calcula a porcentagem
    if distance_range <= 0:
        percentage = 0
    else:
        percentage = ((empty_at_cm - distance_from_sensor_cm) / distance_range) * 100

    # Calcula o volume em litros
    liters = (percentage / 100) * total_volume

    # Garante que os valores não sejam negativos
    if percentage < 0:
        percentage = 0
    if liters < 0:
        liters = 0

    return {
        'tank_id': 'tank1',
        'distance_cm': round(distance_from_sensor_cm, 2),
        'level_percentage': round(percentage, 2),
        'volume_liters': round(liters, 2),
        'status': status,
        'timestamp': datetime.now().isoformat()
    }

@app.route('/')
def index():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == 'admin' and password == 'admin123':
            session['user'] = 'admin'
            logger.info("Login realizado com sucesso.")
            return redirect(url_for('index'))
        logger.warning(f"Tentativa de login falhou para o usuário: {username}")
        return render_template('login.html', error='Credenciais inválidas')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/api/water-level', methods=['POST'])
def receive_data():
    global current_data
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "JSON não fornecido"}), 400
            
        dist = float(data.get('distance_cm', 0))
        status = data.get('status', 'online')
        
        # Adiciona a nova leitura ao deque
        last_readings.append(dist)
        
        # Calcula a média das últimas leituras
        smoothed_dist = sum(last_readings) / len(last_readings)
        
        # Garante que o tank_id seja sempre 'tank1' para processamento
        incoming_tank_id = data.get("tank_id", "tank1")
        if incoming_tank_id not in ['tank1', 'tanque1']:
            logger.warning(f"Dados recebidos para tank_id desconhecido: {incoming_tank_id}. Ignorando.")
            return jsonify({"status": "error", "message": "Tank ID desconhecido"}), 400

        current_data = calculate_data(smoothed_dist, status, 'tank1') # Usa a distância suavizada
        
        conn = sqlite3.connect('water_monitor.db')
        c = conn.cursor()
        c.execute('INSERT INTO water_history (tank_id, timestamp, distance_cm, level_percentage, volume_liters, status) VALUES (?,?,?,?,?,?)',
                  (current_data['tank_id'], current_data['timestamp'], current_data['distance_cm'], 
                   current_data['level_percentage'], current_data['volume_liters'], current_data['status']))
        conn.commit()
        conn.close()
        
        logger.info(f"Dados recebidos para {current_data['tank_id']}: {dist}cm -> {current_data['volume_liters']}L (suavizado: {smoothed_dist}cm)")
        return jsonify({"status": "success", "tank": current_data['tank_id'], "volume": current_data['volume_liters']})
    except Exception as e:
        logger.error(f"Erro ao receber dados: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/latest')
@app.route('/api/latest/tank1')
def get_latest():
    return jsonify(current_data)

@app.route('/api/history')
def get_history():
    try:
        conn = sqlite3.connect('water_monitor.db')
        c = conn.cursor()
        c.execute('SELECT timestamp, level_percentage, volume_liters FROM water_history WHERE tank_id="tank1" ORDER BY timestamp DESC LIMIT 50')
        rows = c.fetchall()
        conn.close()
        return jsonify([{'timestamp': r[0], 'level_percentage': r[1], 'volume_liters': r[2]} for r in rows])
    except Exception as e:
        logger.error(f"Erro ao buscar histórico: {e}")
        return jsonify([])

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

# A função init_database() será chamada antes da primeira requisição
@app.before_request
def before_request_func():
    if not hasattr(g, 'db_initialized'):
        init_database()
        g.db_initialized = True
