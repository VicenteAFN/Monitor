/**
 * Monitor de Água - JavaScript Principal (Condomínio Colina dos Cedros)
 * Lógica de frontend para o Reservatório Principal com design moderno.
 */

// Utilitários para formatação
const Utils = {
    formatNumber: function(number, decimals = 1) {
        return parseFloat(number).toFixed(decimals);
    },
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString("pt-BR", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    }
};

// Funções de API
const API = {
    get: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Erro na requisição GET para " + url + ":", error);
            throw error;
        }
    },
    post: async function(url, data) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Erro na requisição POST para " + url + ":", error);
            throw error;
        }
    }
};

// Variável global para o gráfico
let tank1ChartInstance;

// Função para carregar histórico e exibir gráfico
async function loadHistory() {
    try {
        const response = await API.get("/api/history?tank_id=tank1");
        const data = response.reverse(); // Inverte para ter os dados mais antigos primeiro

        const ctx = document.getElementById("tank1Chart").getContext("2d");

        const chartData = data.map(item => ({
            x: new Date(item.timestamp),
            level: item.level_percentage,
            volume: item.volume_liters
        }));

        if (tank1ChartInstance) {
            tank1ChartInstance.destroy();
        }
        tank1ChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [{
                    label: "Nível (%)",
                    data: chartData.map(item => ({ x: item.x, y: item.level })),
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.1)",
                    yAxisID: "y"
                }, {
                    label: "Volume (L)",
                    data: chartData.map(item => ({ x: item.x, y: item.volume })),
                    borderColor: "#28a745",
                    backgroundColor: "rgba(40, 167, 69, 0.1)",
                    yAxisID: "y1"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "hour",
                            tooltipFormat: "dd/MM/yyyy HH:mm:ss"
                        },
                        title: {
                            display: true,
                            text: "Data"
                        }
                    },
                    y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        min: 0,
                        max: 120, // Pode ir acima de 100% para mostrar transbordo
                        title: {
                            display: true,
                            text: "Nível (%)"
                        }
                    },
                    y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        title: {
                            display: true,
                            text: "Volume (L)"
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }
}

// Função para atualizar o dashboard com os dados mais recentes
async function updateDashboard() {
    console.log("Iniciando updateDashboard...");
    try {
        console.log("Buscando dados de /api/latest/tank1...");
        const data = await API.get("/api/latest/tank1");
        console.log("Dados recebidos de /api/latest/tank1:", data);
        console.log("Buscando configurações de /api/settings...");
        const settings = await API.get("/api/settings");
        console.log("Configurações recebidas de /api/settings:", settings);
        const tank1Settings = settings.tanks.tank1;

        if (data) {
            console.log("Atualizando elementos do dashboard com dados:", data);
            // Atualiza os elementos do dashboard
            document.getElementById("tank1-level-text").innerText = Utils.formatNumber(data.level_percentage, 1) + "%";
            document.getElementById("tank1-volume").innerText = Utils.formatNumber(data.volume_liters, 0) + " L";
            document.getElementById("tank1-distance").innerText = Utils.formatNumber(data.distance_cm, 1) + " cm";
            document.getElementById("tank1-timestamp").innerText = Utils.formatDate(data.timestamp);

            // Atualiza o status do indicador
            const statusIndicator = document.getElementById("tank1-status-indicator");
            const statusText = document.getElementById("tank1-status-text");
            if (data.status === "online") {
                statusText.innerText = "Online";
                statusIndicator.classList.remove("status-offline");
                statusIndicator.classList.add("status-online");
            } else {
                statusText.innerText = "Offline";
                statusIndicator.classList.remove("status-online");
                statusIndicator.classList.add("status-offline");
            }

            // Anima o tanque
            const waterFill = document.getElementById("tank1-water");
            let displayPercentage = Math.min(Math.max(data.level_percentage, 0), 100); // Limita para exibição visual
            waterFill.style.height = displayPercentage + "%";

            // Atualiza a cor do tanque e alertas
            updateAlerts(data.level_percentage, tank1Settings.low_alert_threshold, tank1Settings.high_alert_threshold);
        }
    } catch (error) {
        console.error("Erro ao atualizar o dashboard:", error);
        console.log("Tentando definir status como offline devido a erro.");
        // Se houver erro, define o status como offline
        const statusIndicator = document.getElementById("tank1-status-indicator");
        const statusText = document.getElementById("tank1-status-text");
        statusText.innerText = "Offline";
        statusIndicator.classList.remove("status-online");
        statusIndicator.classList.add("status-offline");
        document.getElementById("tank1-alert").innerHTML = `<span class="alert-error">Erro de conexão com o servidor.</span>`;
    }
}

// Função para atualizar alertas
function updateAlerts(level_percentage, low_threshold, high_threshold) {
    const alertElement = document.getElementById("tank1-alert");
    alertElement.className = "alert-message"; // Reseta classes

    if (level_percentage < low_threshold) {
        alertElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Nível de água muito baixo! (${Utils.formatNumber(level_percentage, 1)}%)`;
        alertElement.classList.add("alert-low");
    } else if (level_percentage > high_threshold) {
        alertElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> **ATENÇÃO!** Nível de água acima de 100%! (${Utils.formatNumber(level_percentage, 1)}%)`;
        alertElement.classList.add("alert-high");
    } else {
        alertElement.innerHTML = `<i class="fas fa-check-circle"></i> Nível normal.`;
        alertElement.classList.add("alert-normal");
    }
}

// Função para carregar configurações e preencher o formulário
async function loadSettingsForm() {
    try {
        console.log("Buscando configurações de /api/settings...");
        const settings = await API.get("/api/settings");
        console.log("Configurações recebidas de /api/settings:", settings);
        const tank1Settings = settings.tanks.tank1;

        document.getElementById("tank1_name").value = tank1Settings.name;
        document.getElementById("tank1_height").value = tank1Settings.tank_height;
        document.getElementById("tank1_width").value = tank1Settings.tank_width;
        document.getElementById("tank1_length").value = tank1Settings.tank_length;
        document.getElementById("tank1_sensor_at_100_percent_cm").value = tank1Settings.sensor_at_100_percent_cm;
        document.getElementById("tank1_sensor_at_0_percent_cm").value = tank1Settings.sensor_at_0_percent_cm;
        document.getElementById("tank1_total_volume").value = tank1Settings.total_volume;
        document.getElementById("tank1_low_alert_threshold").value = tank1Settings.low_alert_threshold;
        document.getElementById("tank1_high_alert_threshold").value = tank1Settings.high_alert_threshold;

    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }
}

// Função para salvar configurações (apenas thresholds são editáveis)
async function saveSettings(event) {
    event.preventDefault();
    const settingsMessage = document.getElementById("settingsMessage");
    settingsMessage.innerText = "";
    settingsMessage.className = "message";

    const lowAlert = parseFloat(document.getElementById("tank1_low_alert_threshold").value);
    const highAlert = parseFloat(document.getElementById("tank1_high_alert_threshold").value);

    if (isNaN(lowAlert) || lowAlert < 0 || lowAlert > 100 || isNaN(highAlert) || highAlert < 0 || highAlert > 100) {
        settingsMessage.className = "message error";
        settingsMessage.innerText = "Os limites de alerta devem ser números entre 0 e 100.";
        return;
    }
    if (lowAlert >= highAlert) {
        settingsMessage.className = "message error";
        settingsMessage.innerText = "O alerta de nível baixo deve ser menor que o alerta de nível alto.";
        return;
    }

    try {
        const currentSettings = await API.get("/api/settings");
        currentSettings.tanks.tank1.low_alert_threshold = lowAlert;
        currentSettings.tanks.tank1.high_alert_threshold = highAlert;
        
        const response = await API.post("/api/settings", currentSettings);
        if (response.status === "success") {
            settingsMessage.className = "message success";
            settingsMessage.innerText = "Configurações salvas com sucesso!";
            updateDashboard(); // Atualiza o dashboard com as novas configurações
        } else {
            settingsMessage.className = "message error";
            settingsMessage.innerText = "Erro ao salvar configurações.";
        }
    } catch (error) {
        console.error("Erro ao salvar configurações:", error);
        settingsMessage.className = "message error";
        settingsMessage.innerText = "Erro de comunicação com o servidor.";
    }
}

// Event Listeners para navegação por abas
    document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM completamente carregado.");
    const navItems = document.querySelectorAll(".main-nav .nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    navItems.forEach(item => {
        item.addEventListener("click", function(event) {
            event.preventDefault();

            navItems.forEach(nav => nav.classList.remove("active"));
            tabContents.forEach(tab => tab.classList.remove("active"));

            this.classList.add("active");
            const targetId = this.getAttribute("data-tab");
            document.getElementById(targetId).classList.add("active");

            if (targetId === "history") {
                loadHistory();
            } else if (targetId === "settings") {
                loadSettingsForm();
            }
        });
    });

    // Event listener para o formulário de configurações
    const settingsForm = document.getElementById("settingsForm");
    if (settingsForm) {
        settingsForm.addEventListener("submit", saveSettings);
    }

    // Carrega os dados iniciais e atualiza o dashboard a cada 5 segundos
    updateDashboard();
    setInterval(updateDashboard, 5000);
    console.log("Intervalo de atualização do dashboard configurado para 5 segundos.");
});
