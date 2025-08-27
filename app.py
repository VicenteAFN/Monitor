import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

# === Configurações iniciais ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", 5000))

USERS_FILE = os.path.join(BASE_DIR, 'users.json')
SETTINGS_FILE = os.path.join(BASE_DIR, 'settings.json')
DATABASE_FILE = os.path.join(BASE_DIR, 'water_monitor.db')

app = Flask(__name__, static_folder='dist', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'water-monitor-secret-key-2025')
CORS(app, supports_credentials=True)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

DATA = []
DEFAULT_SETTINGS = {
    'tank_height': 100.0,
    'tank_width': 100.0,
    'tank_length': 100.0,
    'dead_zone': 5.0,
    'tank_volume': 1000.0,
    'low_alert': 20,
    'high_alert': 90
}

# === Classe de usuário ===
class User(UserMixin):
    def __init__(self, id, username, password_hash):
        self.id = id
        self.username = username
        self.password_hash = password_hash

# === Funções utilitárias ===
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    return DEFAULT_SETTINGS.copy()

def save_settings(settings):
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings, f)

def init_database():
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS water_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            distance_cm REAL,
            level_percentage REAL,
            volume_liters REAL,
            status TEXT,
            date TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_consumption (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            consumption_liters REAL DEFAULT 0,
            max_level REAL DEFAULT 0,
            min_level REAL DEFAULT 0,
            avg_level REAL DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# === Configuração Flask-Login ===
@login_manager.user_loader
def load_user(user_id):
    users = load_users()
    if user_id in users:
        u = users[user_id]
        return User(user_id, u['username'], u['password_hash'])
    return None

# === Inicialização ===
init_database()
users = load_users()
if not users:
    default_username = os.environ.get('DEFAULT_USER', 'admin')
    default_pass = os.environ.get('DEFAULT_PASS', 'admin123')
    users['admin'] = {
        'username': default_username,
        'password_hash': generate_password_hash(default_pass)
    }
    save_users(users)
    print(f"[INFO] Usuário padrão criado: {default_username} / {default_pass}")

# === Rotas Front-end ===
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# === Rotas API ===
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username e password são obrigatórios'}), 400
    users = load_users()
    user_id = next((uid for uid, u in users.items() if u['username'] == username), None)
    if user_id and check_password_hash(users[user_id]['password_hash'], password):
        login_user(User(user_id, username, users[user_id]['password_hash']), remember=True)
        return jsonify({'success': True, 'message': 'Login realizado', 'user': {'id': user_id, 'username': username}})
    return jsonify({'error': 'Credenciais inválidas'}), 401

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logout realizado'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username e password são obrigatórios'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Senha deve ter pelo menos 6 caracteres'}), 400
    users = load_users()
    if any(u['username'] == username for u in users.values()):
        return jsonify({'error': 'Usuário já existe'}), 400
    uid = f"user_{len(users) + 1}"
    users[uid] = {'username': username, 'password_hash': generate_password_hash(password)}
    save_users(users)
    return jsonify({'success': True, 'message': 'Usuário criado', 'user': {'id': uid, 'username': username}})

@app.route('/api/user', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({'id': current_user.id, 'username': current_user.username})

@app.route('/api/water-level', methods=['POST'])
def receive_level():
    obj = request.get_json() if request.is_json else None
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    date = datetime.now().strftime("%Y-%m-%d")
    DATA.append({"timestamp": timestamp, "raw": obj})
    if len(DATA) > 100:
        DATA.pop(0)
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO water_history 
        (timestamp, distance_cm, level_percentage, volume_liters, status, date)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        timestamp,
        obj.get("distance_cm", 0),
        obj.get("level_percentage", 0),
        obj.get("volume_liters", 0),
        obj.get("status", "unknown"),
        date
    ))
    conn.commit()
    conn.close()
    update_daily_consumption(date)
    return jsonify({"status": "ok", "timestamp": timestamp})

@app.route('/api/data', methods=['GET'])
@login_required
def get_data():
    return jsonify({"data": DATA})

@app.route('/api/latest', methods=['GET'])
@login_required
def get_latest():
    return jsonify({"data": DATA[-1] if DATA else None})

@app.route('/api/history', methods=['GET'])
@login_required
def get_history():
    days = request.args.get('days', 7, type=int)
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute(f'''
        SELECT timestamp, distance_cm, level_percentage, volume_liters, status
        FROM water_history
        WHERE date >= date('now', '-{days} days')
        ORDER BY timestamp DESC
        LIMIT 1000
    ''')
    rows = cursor.fetchall()
    conn.close()
    return jsonify({"history": [
        {'timestamp': r[0], 'distance_cm': r[1], 'level_percentage': r[2], 'volume_liters': r[3], 'status': r[4]}
        for r in rows
    ]})

@app.route('/api/daily-consumption', methods=['GET'])
@login_required
def get_daily_consumption():
    days = request.args.get('days', 30, type=int)
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    cursor.execute(f'''
        SELECT date, consumption_liters, max_level, min_level, avg_level
        FROM daily_consumption
        WHERE date >= date('now', '-{days} days')
        ORDER BY date DESC
    ''')
    rows = cursor.fetchall()
