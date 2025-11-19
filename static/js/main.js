/**
 * Monitor de Água - JavaScript Principal (Versão Atualizada E Corrigida)
 */

// Histórico do gráfico
let historyChart = null;

// Valores padrão do tanque
const defaultSettings = {
    tank_name: "Reservatório Principal",
    tank_height: 1000,
    tank_width: 200,
    tank_length: 200,
    total_volume: 40000,
    dead_zone: 0,
    low_alert_threshold: 20,
    high_alert_threshold: 100
};

// Utilitários para formatação
const Utils = {
    formatNumber: (number, decimals = 1) => parseFloat(number || 0).toFixed(decimals),
    formatDate: (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    getLevelColor: (percentage) => {
        if (percentage >= 70) return 'success';
        if (percentage >= 30) return 'warning';
        return 'danger';
    },
    getLevelStatus: (percentage) => {
        if (percentage >= 70) return 'Nível Alto';
        if (percentage >= 30) return 'Nível Normal';
        return 'Nível Baixo';
    }
};

// Notificações
const Notifications = {
    show: (message, type = 'info') => {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1050';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    }
};

// Validação
const Validation = {
    isPositiveNumber: (value) => !isNaN(value) && parseFloat(value) > 0,
    isInRange: (value, min, max) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    },
    validateTankSettings: function(settings) {
        const errors = [];
        if (!this.isPositiveNumber(settings.tank_height)) errors.push('Altura deve ser positiva');
        if (!this.isPositiveNumber(settings.tank_width)) errors.push('Largura deve ser positiva');
        if (!this.isPositiveNumber(settings.tank_length)) errors.push('Comprimento deve ser positivo');
        if (!this.isPositiveNumber(settings.dead_zone)) errors.push('Zona morta deve ser positiva');
        if (!this.isPositiveNumber(settings.total_volume)) errors.push('Volume total deve ser positivo');
        if (!this.isInRange(settings.low_alert_threshold, 0, 100)) errors.push('Alerta baixo inválido');
        if (!this.isInRange(settings.high_alert_threshold, 0, 100)) errors.push('Alerta alto inválido');
        if (settings.low_alert_threshold >= settings.high_alert_threshold) errors.push('Limites invertidos');
        return errors;
    }
};

// LocalStorage
const Storage = {
    set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch(e){ console.error(e); return false; } },
    get: (key, defaultValue = null) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; } catch(e){ console.error(e); return defaultValue; } },
    remove: (key) => { try { localStorage.removeItem(key); return true; } catch(e){ console.error(e); return false; } }
};

// API
const API = {
    get: async (url) => { 
        try { const response = await fetch(url); if(!response.ok) throw new Error(`HTTP ${response.status}`); return await response.json(); } 
        catch(e){ console.error(e); throw e; } 
    },
    post: async (url, data) => {
        try {
            const response = await fetch(url, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
            if(!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch(e){ console.error(e); throw e; }
    }
};

// Animações
const Animation = {
    fadeIn: (el, duration = 300) => { if(!el) return; el.style.opacity='0'; el.style.display='block'; let start=null; const animate=(ts)=>{ if(!start) start=ts; const prog=Math.min((ts-start)/duration,1); el.style.opacity=prog; if(prog<1) requestAnimationFrame(animate); }; requestAnimationFrame(animate); },
    fadeOut: (el, duration = 300) => { if(!el) return; let start=null; const animate=(ts)=>{ if(!start) start=ts; const prog=Math.min((ts-start)/duration,1); el.style.opacity=1-prog; if(prog<1) requestAnimationFrame(animate); else el.style.display='none'; }; requestAnimationFrame(animate); }
};

// FUNÇÃO CORRIGIDA!!!
function updateTank1(data = {}, settings = {}) {

    // mescla configurações
    const s = Object.assign({}, defaultSettings, settings);

    // pega nome atual do HTML
    const nameEl = document.getElementById("tank1-name");
    const htmlName = nameEl ? nameEl.textContent.trim() : defaultSettings.tank_name;

    // monta dados preservando o nome manual
    const d = {
        level_percentage: data.level_percentage ?? 0,
        volume_liters: data.volume_liters ?? 0,
        distance_cm: data.distance_cm ?? 0,
        tank_name: data.tank_name || htmlName   // <- ESSENCIAL
    };

    // Nível %
    const levelEl = document.getElementById("tank1-level");
    if(levelEl) levelEl.textContent = Utils.formatNumber(d.level_percentage,1) + "%";

    // Status do nível
    const statusEl = document.getElementById("tank1-level-status");
    if(statusEl){
        statusEl.textContent = Utils.getLevelStatus(d.level_percentage);
        statusEl.className = "text-" + Utils.getLevelColor(d.level_percentage);
    }

    // Volume
    const volumeEl = document.getElementById("tank1-volume");
    if(volumeEl) volumeEl.textContent = Utils.formatNumber(d.volume_liters,0) + " L";

    // Total
    const totalEl = document.getElementById("tank1-total");
    if(totalEl) totalEl.textContent = Utils.formatNumber(s.total_volume,0) + " L";

    // Distância do sensor
    const distEl = document.getElementById("tank1-distance");
    if(distEl) distEl.textContent = Utils.formatNumber(d.distance_cm,1) + " cm";

    // Dimensões
    const dimEl = document.getElementById("tank1-dimensions");
    if(dimEl) dimEl.textContent =
        `${Utils.formatNumber(s.tank_height,0)}cm × ${Utils.formatNumber(s.tank_width,0)}cm × ${Utils.formatNumber(s.tank_length,0)}cm`;

    // Nome do tanque (agora respeita seu HTML)
    if(nameEl) nameEl.textContent = d.tank_name;

    // Água visual
    const waterEl = document.getElementById("tank1-water");
    if(waterEl){
        waterEl.style.height = d.level_percentage + "%";
        waterEl.style.backgroundColor =
            d.level_percentage >= 70 ? "#28a745" :
            d.level_percentage >= 30 ? "#ffc107" :
            "#dc3545";
    }
}

// Histórico + gráfico
async function loadHistory() {
    try {
        const data = (await API.get("/api/history")).reverse();
        const ctxEl = document.getElementById("historyChart");
        if(!ctxEl) return;

        const chartData = data.map(i => ({
            x: new Date(i.timestamp),
            level: i.level_percentage,
            volume: i.volume_liters
        }));

        if(historyChart) historyChart.destroy();

        historyChart = new Chart(ctxEl.getContext("2d"), {
            type:'line',
            data:{ datasets:[
                { label:'Nível (%)', data: chartData.map(i=>({x:i.x,y:i.level})), borderColor:'#007bff', backgroundColor:'rgba(0,123,255,0.1)', yAxisID:'y' },
                { label:'Volume (L)', data: chartData.map(i=>({x:i.x,y:i.volume})), borderColor:'#28a745', backgroundColor:'rgba(40,167,69,0.1)', yAxisID:'y1' }
            ] },
            options:{
                responsive:true,
                scales:{
                    x:{ type:'time', time:{ unit:'hour' }, title:{ display:true, text:'Data' } },
                    y:{ min:0, max:100, title:{display:true,text:'Nível (%)'} },
                    y1:{ position:'right', title:{display:true,text:'Volume (L)'}, grid:{ drawOnChartArea:false } }
                }
            }
        });
    } catch(e){ console.error("Erro ao carregar histórico:", e); }
}

// Alertas
function updateAlerts(level, low, high) {
    const container = document.getElementById("alerts-container");
    if(!container) return;
    container.innerHTML='';
    if(level<=low) container.innerHTML=`<div class="text-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>Nível muito baixo</div>`;
    else if(level>=high) container.innerHTML=`<div class="text-info"><i class="bi bi-exclamation-triangle-fill me-2"></i>Nível muito alto</div>`;
    else container.innerHTML=`<div class="text-success"><i class="bi bi-check-circle me-2"></i>Nível normal</div>`;
}

// Atualização do dashboard
async function updateDashboard() {
    try {
        const data = await API.get("/api/latest") || {};
        const settings = await API.get("/api/settings") || defaultSettings;

        updateTank1(data, settings);

        safeSetText("last-update", Utils.formatDate(data.timestamp));

        const systemStatus = document.getElementById("system-status");
        if(systemStatus && systemStatus.querySelector("span")){
            const span = systemStatus.querySelector("span");
            span.textContent = data.status==="online"?"Online":"Offline";
            span.className = data.status==="online"?"text-success":"text-danger";
        }

        updateAlerts(data.level_percentage || 0, settings.low_alert_threshold, settings.high_alert_threshold);

    } catch(e){ console.error("Erro ao atualizar dashboard:", e); }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    loadHistory();

    const tooltipList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipList.map(el => new bootstrap.Tooltip(el));

    const popoverList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverList.map(el => new bootstrap.Popover(el));

    document.querySelectorAll('.card').forEach((card,index)=> {
        setTimeout(()=>card.classList.add('fade-in'), index*100);
    });
});

// Atualiza a cada 5s
setInterval(updateDashboard, 5000);

// Exporta globais
window.Utils = Utils;
window.Notifications = Notifications;
window.Validation = Validation;
window.Storage = Storage;
window.API = API;
window.Animation = Animation;
window.loadHistory = loadHistory;
window.updateDashboard = updateDashboard;
window.updateTank1 = updateTank1;
