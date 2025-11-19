/**
 * Monitor de Água - JavaScript Principal (Versão Segura)
 */

// Histórico do gráfico
let historyChart = null;

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
    formatTime: (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
        if (!this.isPositiveNumber(settings.tank_height)) errors.push('Altura da caixa deve ser um número positivo');
        if (!this.isPositiveNumber(settings.tank_width)) errors.push('Largura da caixa deve ser um número positivo');
        if (!this.isPositiveNumber(settings.tank_length)) errors.push('Comprimento da caixa deve ser um número positivo');
        if (!this.isPositiveNumber(settings.dead_zone)) errors.push('Zona morta deve ser um número positivo');
        if (!this.isPositiveNumber(settings.total_volume)) errors.push('Volume total deve ser um número positivo');
        if (!this.isInRange(settings.low_alert_threshold, 0, 100)) errors.push('Alerta de nível baixo deve estar entre 0 e 100');
        if (!this.isInRange(settings.high_alert_threshold, 0, 100)) errors.push('Alerta de nível alto deve estar entre 0 e 100');
        if (settings.low_alert_threshold >= settings.high_alert_threshold) errors.push('Alerta de nível baixo deve ser menor que o alerta de nível alto');
        return errors;
    }
};

// LocalStorage
const Storage = {
    set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch(e){console.error(e); return false; } },
    get: (key, defaultValue = null) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; } catch(e){console.error(e); return defaultValue; } },
    remove: (key) => { try { localStorage.removeItem(key); return true; } catch(e){console.error(e); return false; } }
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
    fadeOut: (el, duration = 300) => { if(!el) return; let start=null; const animate=(ts)=>{ if(!start) start=ts; const prog=Math.min((ts-start)/duration,1); el.style.opacity=1-prog; if(prog<1) requestAnimationFrame(animate); else el.style.display='none'; }; requestAnimationFrame(animate); },
    animateTank: (target, duration=1000) => {
        const waterFill = document.getElementById("water-fill");
        if(!waterFill) return;
        const start = parseFloat(waterFill.style.height) || 0;
        const diff = target - start;
        let tsStart=null;
        const animate = (ts)=>{ if(!tsStart) tsStart=ts; const prog=Math.min((ts-tsStart)/duration,1); waterFill.style.height=(start + diff*prog)+'%'; if(prog<1) requestAnimationFrame(animate); };
        requestAnimationFrame(animate);
    }
};

// Função segura para atualizar texto
function safeSetText(id, value) {
    const el = document.getElementById(id);
    if(el) el.textContent = value;
}

// Carrega histórico e exibe gráfico
async function loadHistory() {
    try {
        const data = (await API.get("/api/history")).reverse();
        const ctxEl = document.getElementById("historyChart");
        if(!ctxEl) return;
        const chartData = data.map(i => ({ x: new Date(i.timestamp), level: i.level_percentage, volume: i.volume_liters }));
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
                    x:{ type:'time', time:{ unit:'hour', tooltipFormat:'dd/MM/yyyy HH:mm' }, title:{ display:true, text:'Data' } },
                    y:{ type:'linear', display:true, position:'left', min:0, max:100, title:{display:true,text:'Nível (%)'} },
                    y1:{ type:'linear', display:true, position:'right', title:{display:true,text:'Volume (L)'}, grid:{ drawOnChartArea:false } }
                }
            }
        });
    } catch(e){ console.error("Erro ao carregar histórico:", e); }
}

// Atualiza alertas
function updateAlerts(level, low, high) {
    const container = document.getElementById("alerts-container");
    if(!container) return;
    container.innerHTML='';
    if(level<=low) container.innerHTML=`<div class="text-danger mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Nível de água muito baixo!</div>`;
    else if(level>=high) container.innerHTML=`<div class="text-info mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Nível de água muito alto!</div>`;
    else container.innerHTML=`<div class="text-success"><i class="bi bi-check-circle me-2"></i>Nenhum alerta</div>`;
}

// Atualiza dashboard
async function updateDashboard() {
    try {
        const data = await API.get("/api/latest");
        if(!data) return;

        safeSetText("water-level", Utils.formatNumber(data.level_percentage,1)+'%');
        safeSetText("volume", Utils.formatNumber(data.volume_liters,0)+' L');
        safeSetText("distance", Utils.formatNumber(data.distance_cm,1)+' cm');
        safeSetText("last-update", Utils.formatDate(data.timestamp));

        // Status
        const statusEl = document.getElementById("system-status");
        if(statusEl && statusEl.querySelector("span")) {
            const span=statusEl.querySelector("span");
            span.textContent = data.status==="online"?"Online":"Offline";
            span.className = data.status==="online"?"text-success":"text-danger";
        }

        // Nível do tanque
        const levelStatus = document.getElementById("level-status");
        if(levelStatus){
            const lvl = data.level_percentage || 0;
            levelStatus.textContent = Utils.getLevelStatus(lvl);
            levelStatus.className = "text-"+Utils.getLevelColor(lvl);
        }

        const waterFill = document.getElementById("water-fill");
        if(waterFill){
            Animation.animateTank(data.level_percentage);
            const lvl = data.level_percentage || 0;
            waterFill.style.backgroundColor = lvl>=70?"#28a745":(lvl>=30?"#ffc107":"#dc3545");
        }

        // Dimensões e volume
        const settings = await API.get("/api/settings");
        if(settings){
            safeSetText("volume-total", `de ${Utils.formatNumber(settings.total_volume,0)} L total`);
            safeSetText("tank-info", `Reservatório de ${Utils.formatNumber(settings.total_volume,0)}L`);
            safeSetText("tank-dimensions", `${Utils.formatNumber(settings.tank_height,0)}cm × ${Utils.formatNumber(settings.tank_width,0)}cm × ${Utils.formatNumber(settings.tank_length,0)}cm`);

            updateAlerts(data.level_percentage, settings.low_alert_threshold, settings.high_alert_threshold);
        }
    } catch(e){ console.error("Erro ao atualizar dashboard:", e); }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard();
    loadHistory();

    // Tooltips e popovers
    const tooltipList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipList.map(el => new bootstrap.Tooltip(el));
    const popoverList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverList.map(el => new bootstrap.Popover(el));

    // Fade-in cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card,index)=>setTimeout(()=>card.classList.add('fade-in'), index*100));
});

// Atualiza a cada 5 segundos
setInterval(updateDashboard, 5000);

// Exporta global
window.Utils = Utils;
window.Notifications = Notifications;
window.Validation = Validation;
window.Storage = Storage;
window.API = API;
window.Animation = Animation;
window.loadHistory = loadHistory;
window.updateDashboard = updateDashboard;
