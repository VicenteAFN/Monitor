#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monitor de Água - Versão ULTRA-COMPATÍVEL (Tanque Único 40.000L)
Otimizado para o Render com detecção automática de porta e logs.
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import json
import sqlite3
import os
import sys
from datetime import datetime, timedelta
import hashlib
import logging

# Configuração de Logs para o Render
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'water-monitor-ultra-2024')

# CORS configurado para aceitar requisições do Render
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# CONFIGURAÇÕES FORÇADAS (40.000L)
TANK_CONFIG = {
    'name': 'Reservatório Principal',
    'tank_height': 1000,   # 10 metros
    'tank_width': 200,     # 2 metros
    'tank_length': 200,    # 2 metros
    'dead_zone': 10,       # 10 cm
    'total_volume': 40000  # 40.000 Litros
}

# Estado atual em memória
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

def calculate_data(distance_cm, status='online', tank_id='tank1'):
    h = TANK_CONFIG['tank_height']
    dz = TANK_CONFIG['dead_zone']
    vol = TANK_CONFIG['total_volume']

    water_height = h - distance_cm - dz
    if water_height < 0: water_height = 0
    
    percentage = (water_height / (h - dz)) * 100
    if percentage > 100: percentage = 100
    if percentage < 0: percentage = 0

    liters = (percentage / 100) * vol

    return {
        'tank_id': 'tank1',
        'distance_cm': round(distance_cm, 2),
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
        
                incoming_tank_id = data.get('tank_id', 'tank1')
        # Mapeia 'tanque1' para 'tank1' para consistência interna
        tank_id_to_process = 'tank1' if incoming_tank_id == 'tanque1' else incoming_tank_id
        
        current_data = calculate_data(dist, status, tank_id_to_process)
        
        conn = sqlite3.connect('water_monitor.db')
        c = conn.cursor()
        c.execute('INSERT INTO water_history (tank_id, timestamp, distance_cm, level_percentage, volume_liters, status) VALUES (?,?,?,?,?,?)',
                  (current_data['tank_id'], current_data['timestamp'], current_data['distance_cm'], 
                   current_data['level_percentage'], current_data['volume_liters'], current_data['status']))
        conn.commit()
        conn.close()
        
        logger.info(f"Dados recebidos: {dist}cm -> {current_data['volume_liters']}L")
        return jsonify({"status": "success", "tank": "tank1", "volume": current_data['volume_liters']})
    except Exception as e:
        logger.error(f"Erro ao receber dados: {e}")
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/latest')
@app.route('/api/latest/tank1')
def get_latest():
    return jsonify(current_data)

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    return jsonify({
        'tanks': {
            'tank1': TANK_CONFIG
        }
    })

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

if __name__ == '__main__':
    init_database()
    # Detecção de porta para o Render
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Iniciando servidor na porta {port}...")
    app.run(host='0.0.0.0', port=port)
