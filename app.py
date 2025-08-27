import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

PORT = int(os.environ.get("PORT", 5000))

app = Flask(__name__, static_folder='dist', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'water-monitor-secret-key-2025')
CORS(app, supports_credentials=True)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

DATA = []
USERS_FILE = 'users.json'
SETTINGS_FILE = 'settings.json'
DATABASE_FILE = 'water_monitor.db'

DEFAULT_SETTINGS = {
    'tank_height': 100.0,
    'tank_width': 100.0,
    'tank_length': 100.0,
    'dead_zone': 5.0,
    'tank_volume': 1000.0,
    'low_alert': 20,
    'high_alert': 90
}

class User(UserMixin):
    def __init__(self, id, username, password_hash):
        self.id = id
        self.username = username
        self.password_hash = password_hash

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

@login_manager.user_loader
def load_user(user_id):
    users = load_users()
    if user_id in users:
        data = users[user_id]
        return User(user_id, data['username'], data['password_hash'])
    return None

# Inicialização
init_database()
if not load_users():
    save_users({'admin': {
        'username': 'admin',
        'password_hash': generate_password_hash('admin123')
    }})

# Rotas para SPA
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# --- Suas rotas de API continuam aqui (login, logout, receive_level, histórico, etc.) ---

if __name__ == '__main__':
    if not os.path.exists('dist'):
        print("⚠️ Pasta 'dist' não encontrada. Rode 'npm run build' para gerar o front-end.")
    print("🚀 Rodando localmente...")
    app.run(host='0.0.0.0', port=PORT)
