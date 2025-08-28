// ===== CONFIG =====
const ENDPOINTS = {
  ultimo: '/api/latest',       // returns {"data": {...}} or 401 if not logged in
  historico: '/api/history'    // returns {"history":[...]} and may require login
};
const REFRESH_MS = 5000;
const OFFLINE_AFTER_MS = 30000;

// ===== ELEMENTS =====
const els = {
  percent: document.getElementById('percent'),
  volume: document.getElementById('volume'),
  nivel: document.getElementById('nivel'),
  distancia: document.getElementById('distancia'),
  capacidade: document.getElementById('capacidade'),
  status: document.getElementById('status'),
  alerta: document.getElementById('alerta'),
  updated: document.getElementById('updated'),
  connDot: document.getElementById('conn-dot'),
  connText: document.getElementById('conn-text'),
  water: document.getElementById('water'),
  wave: document.getElementById('wave')
};

// ===== LOGIN UI (criado dinamicamente) =====
let authToken = null; // Flask-Login uses cookies, so we don't use token; we'll rely on cookie set by /api/login
function showLoginOverlay(message){
  if(document.getElementById('login-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';
  overlay.innerHTML = `
    <div style="background:#fff;padding:20px;border-radius:12px;min-width:320px;box-shadow:0 10px 30px rgba(0,0,0,.2)">
      <h3 style="margin:0 0 8px">Login necessário</h3>
      <p style="margin:0 0 12px;color:#444">${message||'Faça login para que o site consiga acessar as APIs.'}</p>
      <input id="login-user" placeholder="Usuário" style="width:100%;padding:10px;margin-bottom:8px;border-radius:8px;border:1px solid #ddd"/>
      <input id="login-pass" type="password" placeholder="Senha" style="width:100%;padding:10px;margin-bottom:12px;border-radius:8px;border:1px solid #ddd"/>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="login-cancel" style="padding:8px 12px;border-radius:8px;border:0;background:#eee">Cancelar</button>
        <button id="login-ok" style="padding:8px 12px;border-radius:8px;border:0;background:#4f46e5;color:white">Login</button>
      </div>
      <p style="font-size:12px;color:#666;margin-top:8px">Se você usa o usuário padrão, experimente <code>admin</code> / <code>admin123</code> (se não foi alterado).</p>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('login-cancel').onclick = ()=> overlay.remove();
  document.getElementById('login-ok').onclick = async ()=> {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    try{
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        credentials: 'include',
        body: JSON.stringify({username: u, password: p})
      });
      if(r.ok){
        overlay.remove();
        // after login, re-run an immediate fetch
        await carregarAtual();
        await carregarHistorico();
      }else{
        const txt = await r.json().catch(()=>({error:'Falha'}));
        showLoginOverlay(txt.error || 'Credenciais inválidas. Tente novamente.');
      }
    }catch(err){
      showLoginOverlay('Erro ao conectar: ' + err.message);
    }
  };
}

// ===== CHART =====
let chart;
const ctx = document.getElementById('chart').getContext('2d');
function initChart() {
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Nível da Água (%)', data: [], fill: true, tension: 0.3, pointRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { min:0, max:100, ticks:{callback:v=>v+'%'} } }
    }
  });
}

// ===== HELPERS =====
function fmtPercent(v){ return (v ?? 0).toFixed(0) + '%'; }
function fmtCm(v){ return (v ?? 0).toFixed(1) + ' cm'; }
function fmtL(v){ return (v ?? 0).toFixed(1); }
function setOnline(isOnline){ els.connDot.style.background = isOnline ? 'var(--good)' : 'var(--bad)'; els.connText.textContent = isOnline ? 'Conectado' : 'Offline'; }
function updateTank(percent){
  const clamped = Math.max(0, Math.min(100, percent || 0));
  const tankTop = 20; const tankHeight = 200;
  const height = (clamped/100) * tankHeight;
  const y = tankTop + (tankHeight - height);
  els.water.setAttribute('y', y);
  els.water.setAttribute('height', height);
  const waveY = y + 5;
  els.wave.setAttribute('d', `M 30 ${waveY} Q 55 ${waveY-10}, 80 ${waveY} T 130 ${waveY} V 220 H 30 Z`);
}

// ===== FETCH =====
async function fetchJson(url){
  const res = await fetch(url, {cache:'no-store', credentials: 'include'});
  if(res.status === 401){ // not authenticated
    throw {status:401};
  }
  if(!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

async function carregarAtual(){
  try{
    const payload = await fetchJson(ENDPOINTS.ultimo);
    const data = payload.data ?? payload; // app.py returns {"data": ...}
    const percent = data.level_percentage ?? data.percent ?? data.nivel_percent ?? 0;
    const volume = data.volume_liters ?? data.volume ?? 0;
    const nivel = data.level_percentage ? (data.level_percentage/100 * (data.distance_cm ? data.distance_cm : 100)) : data.nivel_cm ?? 0;
    const distancia = data.distance_cm ?? data.distancia_cm ?? 0;
    const capacidade = data.tank_volume ?? data.capacidade_litros ?? 0;
    const status = data.status ?? 'Nível Normal';
    const alerta = data.alerta ?? 'Nenhum alerta';
    const updated = data.timestamp ?? new Date().toLocaleTimeString();

    els.percent.textContent = fmtPercent(percent);
    els.volume.textContent = fmtL(volume);
    els.nivel.textContent = fmtCm(nivel);
    els.distancia.textContent = fmtCm(distancia);
    els.capacidade.textContent = fmtL(capacidade);
    els.status.textContent = status;
    els.alerta.textContent = alerta;
    els.updated.textContent = updated;
    updateTank(percent);
    setOnline(true);
    return updated;
  }catch(e){
    if(e && e.status === 401){
      // Ask for login
      showLoginOverlay('Sessão expirada ou login necessário. Insira suas credenciais.');
    }else{
      console.error('carregarAtual erro', e);
    }
    throw e;
  }
}

async function carregarHistorico(){
  try{
    const q = ENDPOINTS.historico + '?days=1';
    const payload = await fetchJson(q);
    const hist = payload.history ?? payload;
    const labels = [], values = [];
    (Array.isArray(hist)?hist:[]).forEach(r=>{
      const p = r.level_percentage ?? r.level_percent ?? r.percent ?? r.nivel_percent ?? 0;
      const t = r.timestamp ?? r.ts ?? r.hora ?? '';
      labels.push(t);
      values.push(p);
    });
    chart.data.labels = labels.slice(-50);
    chart.data.datasets[0].data = values.slice(-50);
    chart.update();
  }catch(e){
    if(e && e.status === 401){ showLoginOverlay('Login necessário para obter histórico.'); }
    else console.error('carregarHistorico erro', e);
    throw e;
  }
}

// ===== LOOP =====
function loop(){
  let lastOkAt = Date.now();
  const tick = async ()=>{
    try{
      await carregarAtual();
      await carregarHistorico();
      lastOkAt = Date.now();
    }catch(err){ /* already handled */ }
    finally{
      const offline = (Date.now() - lastOkAt) > OFFLINE_AFTER_MS;
      setOnline(!offline);
      setTimeout(tick, REFRESH_MS);
    }
  };
  tick();
}

// START
initChart();
loop();
