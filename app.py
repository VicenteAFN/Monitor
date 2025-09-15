#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor de Água - Aplicação Flask Simples
Sem necessidade de build, apenas HTML, CSS e JavaScript puro
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import json
import sqlite3
import os
from datetime import datetime, timedelta
import hashlib

app = Flask(__name__)
app.secret_key = 'water-monitor-secret-key-2024'
CORS(app)

# Configurações padrão
DEFAULT_SETTINGS = {
    'tank_height': 100,
    'tank_width': 100,
    'tank_length': 100,
    'dead_zone': 5,
    'total_volume': 1000,
    'low_alert_threshold': 20,
    'high_alert_threshold': 90
}

# Dados em memória para demonstração
water_data = []
current_data = {
    'level_percentage': 0,
    'volume_liters': 0,
    'distance_cm': 0,
    'status': 'offline',
    'timestamp': None
}

def init_database():
    """Inicializa o banco de dados SQLite"""
    conn = sqlite3.connect('water_monitor.db')
    cursor = conn.cursor()
    
    # Tabela para histórico de dados
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS water_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            distance_cm REAL NOT NULL,
            level_percentage REAL NOT NULL,
            volume_liters REAL NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    
    # Tabela para consumo diário
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_consumption (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            consumption_liters REAL NOT NULL,
            max_level REAL NOT NULL,
            min_level REAL NOT NULL,
            avg_level REAL NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def load_settings():
    """Carrega configurações do arquivo JSON"""
    try:
        with open('settings.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return DEFAULT_SETTINGS

def save_settings(settings):
    """Salva configurações no arquivo JSON"""
    with open('settings.json', 'w') as f:
        json.dump(settings, f, indent=2)

def load_users():
    """Carrega usuários do arquivo JSON"""
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Usuário padrão
        default_users = {
            'admin': {
                'password': hashlib.sha256('admin123'.encode()).hexdigest(),
                'role': 'admin'
            }
        }
        with open('users.json', 'w') as f:
            json.dump(default_users, f, indent=2)
        return default_users

def check_auth(username, password):
    """Verifica autenticação do usuário"""
    users = load_users()
    if username in users:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        return users[username]['password'] == password_hash
    return False

@app.route('/')
def index():
    """Página principal"""
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if check_auth(username, password):
            session['user'] = username
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Credenciais inválidas')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout do usuário"""
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/api/water-level', methods=['POST'])
def receive_water_level():
    """Recebe dados do sensor ESP32"""
    global current_data
    
    try:
        data = request.get_json()
        
        settings = load_settings()
        tank_height = settings['tank_height']
        dead_zone = settings['dead_zone']
        total_volume = settings['total_volume']

        distance_cm = float(data.get('distance_cm', 0))
        water_height = tank_height - distance_cm - dead_zone
        if water_height < 0: water_height = 0

        level_percentage = (water_height / (tank_height - dead_zone)) * 100
        if level_percentage > 100: level_percentage = 100
        if level_percentage < 0: level_percentage = 0

        volume_liters = (level_percentage / 100) * total_volume

        current_data = {
            'distance_cm': distance_cm,
            'level_percentage': level_percentage,
            'volume_liters': volume_liters,
            'status': data.get('status', 'online'),
            'timestamp': datetime.now().isoformat()
        }

        water_data.append(current_data.copy())

        if len(water_data) > 1000:
            water_data.pop(0)

        save_to_database(current_data)

        return jsonify({"status": "success", "message": "Dados recebidos"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

def save_to_database(data):
    """Salva dados no banco de dados"""
    conn = sqlite3.connect('water_monitor.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO water_history (timestamp, distance_cm, level_percentage, volume_liters, status)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['timestamp'], data['distance_cm'], data['level_percentage'], 
          data['volume_liters'], data['status']))
    
    conn.commit()
    conn.close()

@app.route('/api/latest')
def get_latest_data():
    """Retorna os dados mais recentes"""
    return jsonify(current_data)

@app.route('/api/data')
def get_all_data():
    """Retorna todos os dados em memória"""
    return jsonify(water_data)

@app.route('/api/history')
def get_history():
    """Retorna histórico dos últimos N dias"""
    days = request.args.get('days', 7, type=int)
    
    conn = sqlite3.connect('water_monitor.db')
    cursor = conn.cursor()
    
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    cursor.execute('''
        SELECT timestamp, distance_cm, level_percentage, volume_liters, status
        FROM water_history
        WHERE timestamp >= ?
        ORDER BY timestamp DESC
        LIMIT 100
    ''', (start_date,))
    
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            'timestamp': row[0],
            'distance_cm': row[1],
            'level_percentage': row[2],
            'volume_liters': row[3],
            'status': row[4]
        })
    
    return jsonify(history)

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    """Gerencia configurações do sistema"""
    if 'user' not in session:
        return jsonify({'error': 'Não autorizado'}), 401
    
    if request.method == 'POST':
        settings = request.get_json()
        save_settings(settings)
        return jsonify({'status': 'success', 'message': 'Configurações salvas'})
    
    return jsonify(load_settings())

@app.route('/api/status')
def get_status():
    """Status do sistema"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'data_count': len(water_data)
    })

if __name__ == '__main__':
    init_database()
    
    print("=== Monitor de Água - Sistema Simples ===")
    print("Usuário padrão: admin")
    print("Senha padrão: admin123")
    print("=========================================")
    
    app.run(host='0.0.0.0', port=5000, debug=True)


