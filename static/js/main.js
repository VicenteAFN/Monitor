/**
 * Monitor de Água - JavaScript Principal
 * Arquivo com funções auxiliares e utilitários
 */

// Utilitários para formatação
const Utils = {
    /**
     * Formata um número para exibição com casas decimais
     */
    formatNumber: function(number, decimals = 1) {
        return parseFloat(number).toFixed(decimals);
    },
    
    /**
     * Formata uma data para exibição em português
     */
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Formata uma data para exibição curta (apenas hora)
     */
    formatTime: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Determina a cor baseada no nível de água
     */
    getLevelColor: function(percentage) {
        if (percentage >= 70) return 'success';
        if (percentage >= 30) return 'warning';
        return 'danger';
    },
    
    /**
     * Determina o status textual baseado no nível
     */
    getLevelStatus: function(percentage) {
        if (percentage >= 70) return 'Nível Alto';
        if (percentage >= 30) return 'Nível Normal';
        return 'Nível Baixo';
    }
};

// Funções de notificação
const Notifications = {
    /**
     * Mostra uma notificação toast
     */
    show: function(message, type = 'info') {
        // Cria elemento de toast se não existir
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1050';
            document.body.appendChild(toastContainer);
        }
        
        // Cria o toast
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Inicializa e mostra o toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove o toast após ser ocultado
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    }
};

// Funções de validação
const Validation = {
    /**
     * Valida se um valor é um número positivo
     */
    isPositiveNumber: function(value) {
        return !isNaN(value) && parseFloat(value) > 0;
    },
    
    /**
     * Valida se um valor está dentro de um intervalo
     */
    isInRange: function(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    },
    
    /**
     * Valida configurações do tanque
     */
    validateTankSettings: function(settings) {
        const errors = [];
        
        if (!this.isPositiveNumber(settings.tank_height)) {
            errors.push('Altura da caixa deve ser um número positivo');
        }
        
        if (!this.isPositiveNumber(settings.tank_width)) {
            errors.push('Largura da caixa deve ser um número positivo');
        }
        
        if (!this.isPositiveNumber(settings.tank_length)) {
            errors.push('Comprimento da caixa deve ser um número positivo');
        }
        
        if (!this.isPositiveNumber(settings.dead_zone)) {
            errors.push('Zona morta deve ser um número positivo');
        }
        
        if (!this.isPositiveNumber(settings.total_volume)) {
            errors.push('Volume total deve ser um número positivo');
        }
        
        if (!this.isInRange(settings.low_alert_threshold, 0, 100)) {
            errors.push('Alerta de nível baixo deve estar entre 0 e 100');
        }
        
        if (!this.isInRange(settings.high_alert_threshold, 0, 100)) {
            errors.push('Alerta de nível alto deve estar entre 0 e 100');
        }
        
        if (settings.low_alert_threshold >= settings.high_alert_threshold) {
            errors.push('Alerta de nível baixo deve ser menor que o alerta de nível alto');
        }
        
        return errors;
    }
};

// Funções de armazenamento local
const Storage = {
    /**
     * Salva dados no localStorage
     */
    set: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            return false;
        }
    },
    
    /**
     * Recupera dados do localStorage
     */
    get: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Remove dados do localStorage
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
            return false;
        }
    }
};

// Funções de API
const API = {
    /**
     * Faz uma requisição GET
     */
    get: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição GET:', error);
            throw error;
        }
    },
    
    /**
     * Faz uma requisição POST
     */
    post: async function(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição POST:', error);
            throw error;
        }
    }
};

// Funções de animação
const Animation = {
    /**
     * Anima um elemento com fade-in
     */
    fadeIn: function(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            
            element.style.opacity = Math.min(progress / duration, 1);
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    /**
     * Anima um elemento com fade-out
     */
    fadeOut: function(element, duration = 300) {
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            
            element.style.opacity = Math.max(1 - (progress / duration), 0);
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    },
    
    /**
     * Anima o preenchimento do tanque
     */
    animateTank: function(targetPercentage, duration = 1000) {
        const waterFill = document.getElementById('water-fill');
        if (!waterFill) return;
        
        const startPercentage = parseFloat(waterFill.style.height) || 0;
        const difference = targetPercentage - startPercentage;
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            
            const currentPercentage = startPercentage + (difference * progress);
            waterFill.style.height = currentPercentage + '%';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }
};

// Inicialização global
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa tooltips do Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializa popovers do Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Adiciona classe fade-in aos cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
});

// Exporta funções para uso global
window.Utils = Utils;
window.Notifications = Notifications;
window.Validation = Validation;
window.Storage = Storage;
window.API = API;
window.Animation = Animation;



// Função para carregar histórico e exibir gráfico
async function loadHistory() {
    try {
        const response = await API.get("/api/history");
        const data = response.reverse(); // Inverte para ter os dados mais antigos primeiro
        console.log("Dados recebidos da API /api/history:", data);

        const ctx = document.getElementById("historyChart").getContext("2d");
        console.log("Contexto do gráfico (ctx):", ctx);

        // Prepara dados para o gráfico
        const chartData = data.map(item => ({
            x: new Date(item.timestamp),
            level: item.level_percentage,
            volume: item.volume_liters
        }));
        console.log("Dados formatados para o gráfico (chartData):", chartData);

        if (historyChart) {
            historyChart.destroy();
        }
        console.log("Inicializando novo Chart com os dados:", chartData);
        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Nível (%)',
                    data: chartData.map(item => ({ x: item.x, y: item.level })),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    yAxisID: 'y'
                }, {
                    label: 'Volume (L)',
                    data: chartData.map(item => ({ x: item.x, y: item.volume })),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            tooltipFormat: 'DD/MM/YYYY HH:mm'
                        },
                        title: {
                            display: true,
                            text: 'Data'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Nível (%)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Volume (L)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }
}

// Exporta funções para uso global
window.Utils = Utils;
window.Notifications = Notifications;
window.Validation = Validation;
window.Storage = Storage;
window.API = API;
window.Animation = Animation;
window.loadHistory = loadHistory;





// Função para atualizar o dashboard com os dados mais recentes





// Função para atualizar o dashboard com os dados mais recentes
async function updateDashboard() {
    try {
        const data = await API.get("/api/latest");
        if (data) {
            // Atualiza os elementos do dashboard
            document.getElementById("water-level").innerText = Utils.formatNumber(data.level_percentage, 1) + "%";
            document.getElementById("volume").innerText = Utils.formatNumber(data.volume_liters, 0) + " L";
            document.getElementById("distance").innerText = Utils.formatNumber(data.distance_cm, 1) + " cm";
            document.getElementById("last-update").innerText = Utils.formatDate(data.timestamp);

            // Atualiza o status
            const statusElement = document.getElementById("system-status");
            if (data.status === "online") {
                statusElement.querySelector("span").innerText = "Online";
                statusElement.classList.remove("text-danger");
                statusElement.classList.add("text-success");
            } else {
                statusElement.querySelector("span").innerText = "Offline";
                statusElement.classList.remove("text-success");
                statusElement.classList.add("text-danger");
            }

            // Anima o tanque
            Animation.animateTank(data.level_percentage);

            // Atualiza o status do nível
            const levelStatus = document.getElementById("level-status");
            if (data.level_percentage >= 70) {
                levelStatus.textContent = "Nível Alto";
                levelStatus.className = "text-success";
            } else if (data.level_percentage >= 30) {
                levelStatus.textContent = "Nível Normal";
                levelStatus.className = "text-warning";
            } else {
                levelStatus.textContent = "Nível Baixo";
                levelStatus.className = "text-danger";
            }

            // Atualiza a cor do tanque
            const waterFill = document.getElementById("water-fill");
            if (data.level_percentage >= 70) {
                waterFill.style.backgroundColor = "#28a745";
            } else if (data.level_percentage >= 30) {
                waterFill.style.backgroundColor = "#ffc107";
            } else {
                waterFill.style.backgroundColor = "#dc3545";
            }

            // Atualiza as dimensões do tanque
            const settings = await API.get("/api/settings");
            document.getElementById("volume-total").innerText = `de ${Utils.formatNumber(settings.total_volume, 0)} L total`;
            document.getElementById("tank-info").innerText = `Reservatório de ${Utils.formatNumber(settings.total_volume, 0)}L`;
            document.getElementById("tank-dimensions").innerText = `${Utils.formatNumber(settings.tank_height, 0)}cm × ${Utils.formatNumber(settings.tank_width, 0)}cm × ${Utils.formatNumber(settings.tank_length, 0)}cm`;

            // Atualiza alertas
            updateAlerts(data.level_percentage, settings.low_alert_threshold, settings.high_alert_threshold);
        }
    } catch (error) {
        console.error("Erro ao atualizar o dashboard:", error);
    }
}

// Função para atualizar alertas
function updateAlerts(level_percentage, low_threshold, high_threshold) {
    const alertsContainer = document.getElementById("alerts-container");
    alertsContainer.innerHTML = ""; // Limpa alertas existentes

    if (level_percentage <= low_threshold) {
        alertsContainer.innerHTML += `
            <div class="text-danger mb-1">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>Nível de água muito baixo!
            </div>
        `;
    } else if (level_percentage >= high_threshold) {
        alertsContainer.innerHTML += `
            <div class="text-info mb-1">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>Nível de água muito alto!
            </div>
        `;
    }

    if (alertsContainer.innerHTML === "") {
        alertsContainer.innerHTML = `
            <div class="text-success">
                <i class="bi bi-check-circle me-2"></i>Nenhum alerta
            </div>
        `;
    }
}

// Atualiza o dashboard a cada 5 segundos
setInterval(updateDashboard, 5000);

// Carrega os dados iniciais
document.addEventListener("DOMContentLoaded", function() {
    updateDashboard();
    loadHistory();
});


