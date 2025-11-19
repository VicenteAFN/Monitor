#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor de Água - Aplicação Flask com Múltiplos Reservatórios
Suporte para múltiplos tanques de água com identificação por tank_id
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import json
import sqlite3
import os
from datetime import datetime, timedelta
import hashlib

app = Flask(__name__)
app.secret_key = 'water-monitor-multi-secret-key-2024'
CORS(app)

# Configurações padrão para múltiplos tanques
DEFAULT_SETTINGS = {
    'tanks': {
        'tank1': {
            'name': 'Reservatório 1',
            'tank_height': 100,
            'tank_width': 100,
            'tank_length': 100,
            'dead_zone': 5,
            'total_volume': 1000,
            'low_alert_threshold': 20,
            'high_alert_threshold': 90,
            'enabled': True
        },
        'tank2': {
            'name': 'Reservatório 2',
            'tank_height': 120,
            'tank_width': 80,
            'tank_length': 80,
            'dead_zone': 5,
            'total_volume': 800,
            'low_alert_threshold': 20,
            'high_alert_threshold': 90,
            'enabled': True
        }
    }
}

# Dados em memória para demonstração (por tanque)
water_data = {
    'tank1': [],
    'tank2': []
}

current_data = {
    'tank1': {
        'tank_id': 'tank1',
        'level_percentage': 0,
        'volume_liters': 0,
        'distance_cm': 0,
        'status': 'offline',
        'timestamp': None
    },
    'tank2': {
        'tank_id': 'tank2',
        'level_percentage': 0,
        'volume_liters': 0,
        'distance_cm': 0,
        'status': 'offline',
        'timestamp': None
    }
}

def init_database():
    """Inicializa o banco de dados SQLite com suporte a múltiplos tanques"""
    conn = sqlite3.connect('water_monitor_multi.db')
    cursor = conn.cursor()
    
    # Tabela para histórico de dados com tank_id
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
    
    # Tabela para consumo diário com tank_id
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS daily_consumption (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tank_id TEXT NOT NULL,
            date TEXT NOT NULL,
            consumption_liters REAL NOT NULL,
            max_level REAL NOT NULL,
            min_level REAL NOT NULL,
            avg_level REAL NOT NULL,
            UNIQUE(tank_id, date)
        )
    ''')
    
    conn.commit()
    conn.close()

def load_settings():
    """Carrega configurações do arquivo JSON"""
    try:
        with open('settings_multi.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return DEFAULT_SETTINGS

def save_settings(settings):
    """Salva configurações no arquivo JSON"""
    with open('settings_multi.json', 'w') as f:
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

def calculate_tank_data(tank_id, distance_cm, status='online'):
    """Calcula dados do tanque baseado na distância"""
    settings = load_settings()
    
    if tank_id not in settings['tanks']:
        raise ValueError(f"Tank ID {tank_id} não encontrado nas configurações")
    
    tank_config = settings['tanks'][tank_id]
    tank_height = tank_config['tank_height']
    dead_zone = tank_config['dead_zone']
    total_volume = tank_config['total_volume']

    water_height = tank_height - distance_cm - dead_zone
    if water_height < 0: 
        water_height = 0

    level_percentage = (water_height / (tank_height - dead_zone)) * 100
    if level_percentage > 100: 
        level_percentage = 100
    if level_percentage < 0: 
        level_percentage = 0

    volume_liters = (level_percentage / 100) * total_volume

    return {
        'tank_id': tank_id,
        'distance_cm': distance_cm,
        'level_percentage': level_percentage,
        'volume_liters': volume_liters,
        'status': status,
        'timestamp': datetime.now().isoformat()
    }

@app.route('/')
def index():
    """Página principal"""
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('index_multi.html')

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
    """Recebe dados do sensor ESP32 com tank_id"""
    global current_data, water_data
    
    try:
        data = request.get_json()
        
        # Tank ID é obrigatório
        tank_id = data.get('tank_id', 'tank1')  # Default para tank1 se não especificado
        distance_cm = float(data.get('distance_cm', 0))
        status = data.get('status', 'online')

        # Calcula dados do tanque
        tank_data = calculate_tank_data(tank_id, distance_cm, status)
        
        # Atualiza dados atuais
        current_data[tank_id] = tank_data
        
        # Adiciona ao histórico em memória
        if tank_id not in water_data:
            water_data[tank_id] = []
        
        water_data[tank_id].append(tank_data.copy())
        
        # Limita histórico em memória
        if len(water_data[tank_id]) > 1000:
            water_data[tank_id].pop(0)

        # Salva no banco de dados
        save_to_database(tank_data)

        return jsonify({"status": "success", "message": f"Dados recebidos para {tank_id}"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

def save_to_database(data):
    """Salva dados no banco de dados"""
    conn = sqlite3.connect('water_monitor_multi.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO water_history (tank_id, timestamp, distance_cm, level_percentage, volume_liters, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['tank_id'], data['timestamp'], data['distance_cm'], data['level_percentage'], 
          data['volume_liters'], data['status']))
    
    conn.commit()
    conn.close()

@app.route('/api/latest')
def get_latest_data():
    """Retorna os dados mais recentes de todos os tanques"""
    return jsonify(current_data)

@app.route('/api/latest/<tank_id>')
def get_latest_tank_data(tank_id):
    """Retorna os dados mais recentes de um tanque específico"""
    if tank_id in current_data:
        return jsonify(current_data[tank_id])
    else:
        return jsonify({"error": "Tank ID não encontrado"}), 404

@app.route('/api/data')
def get_all_data():
    """Retorna todos os dados em memória de todos os tanques"""
    return jsonify(water_data)

@app.route('/api/data/<tank_id>')
def get_tank_data(tank_id):
    """Retorna todos os dados em memória de um tanque específico"""
    if tank_id in water_data:
        return jsonify(water_data[tank_id])
    else:
        return jsonify({"error": "Tank ID não encontrado"}), 404

@app.route('/api/history')
def get_history():
    """Retorna histórico dos últimos N dias de todos os tanques"""
    days = request.args.get('days', 7, type=int)
    tank_id = request.args.get('tank_id', None)
    
    conn = sqlite3.connect('water_monitor_multi.db')
    cursor = conn.cursor()
    
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    if tank_id:
        # Histórico de um tanque específico
        cursor.execute('''
            SELECT tank_id, timestamp, distance_cm, level_percentage, volume_liters, status
            FROM water_history
            WHERE tank_id = ? AND timestamp >= ?
            ORDER BY timestamp DESC
            LIMIT 100
        ''', (tank_id, start_date))
    else:
        # Histórico de todos os tanques
        cursor.execute('''
            SELECT tank_id, timestamp, distance_cm, level_percentage, volume_liters, status
            FROM water_history
            WHERE timestamp >= ?
            ORDER BY timestamp DESC
            LIMIT 200
        ''', (start_date,))
    
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            'tank_id': row[0],
            'timestamp': row[1],
            'distance_cm': row[2],
            'level_percentage': row[3],
            'volume_liters': row[4],
            'status': row[5]
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
    total_data_count = sum(len(data) for data in water_data.values())
    
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat(),
        'total_data_count': total_data_count,
        'tanks_status': {
            tank_id: {
                'status': current_data[tank_id]['status'],
                'last_update': current_data[tank_id]['timestamp'],
                'data_count': len(water_data[tank_id])
            }
            for tank_id in current_data.keys()
        }
    })

if __name__ == '__main__':
    init_database()
    
    print("=== Monitor de Água - Sistema com Múltiplos Reservatórios ===")
    print("Usuário padrão: admin")
    print("Senha padrão: admin123")
    print("Tanques suportados: tank1, tank2")
    print("===========================================================")
    
    app.run(host='0.0.0.0', port=5000, debug=True)

