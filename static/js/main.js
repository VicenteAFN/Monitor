// Modern JavaScript for Water Monitoring System

let chart = null;
const API_BASE = window.location.origin;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema iniciado');
    updateData();
    setInterval(updateData, 5000); // Atualizar a cada 5 segundos
});

async function updateData() {
    try {
        const response = await fetch(`${API_BASE}/api/latest`);
        const data = await response.json();

        if (data && data.level_percentage !== undefined) {
            updateUI(data);
            updateChart();
        }
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        updateStatus(false);
    }
}

function updateUI(data) {
    // Update tank visualization
    const percentage = data.level_percentage || 0;
    const tankWater = document.getElementById('tank-water');
    if (tankWater) {
        tankWater.style.height = percentage + '%';
    }

    // Update displays
    const percentageDisplay = document.getElementById('percentage-display');
    if (percentageDisplay) {
        percentageDisplay.textContent = Math.round(percentage);
    }

    const volumeDisplay = document.getElementById('volume-display');
    if (volumeDisplay) {
        volumeDisplay.textContent = Math.round(data.volume_liters || 0).toLocaleString('pt-BR');
    }

    const distanceDisplay = document.getElementById('distance-display');
    if (distanceDisplay) {
        distanceDisplay.textContent = (data.distance_cm || 0).toFixed(1);
    }

    const tankLabel = document.getElementById('tank-label');
    if (tankLabel) {
        tankLabel.textContent = Math.round(percentage) + '%';
    }

    // Update status
    const statusText = data.status === 'online' ? 'Sistema Online' : 'Sistema Offline';
    const statusTextElement = document.getElementById('status-text');
    if (statusTextElement) {
        statusTextElement.textContent = statusText;
    }

    const systemStatus = document.getElementById('system-status');
    if (systemStatus) {
        systemStatus.textContent = data.status === 'online' ? 'Online' : 'Offline';
    }

    // Update alert
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
        if (data.alert_low) {
            alertBox.classList.add('active');
        } else {
            alertBox.classList.remove('active');
        }
    }

    // Update timestamp
    if (data.timestamp) {
        const date = new Date(data.timestamp);
        const formatted = date.toLocaleString('pt-BR');
        const timestampElement = document.getElementById('timestamp');
        if (timestampElement) {
            timestampElement.textContent = `Última atualização: ${formatted}`;
        }
    }

    updateStatus(true);
}

function updateStatus(online) {
    const statusDot = document.querySelector('.status-dot');
    if (statusDot) {
        if (online) {
            statusDot.style.background = 'var(--success-color)';
        } else {
            statusDot.style.background = 'var(--danger-color)';
        }
    }
}

async function updateChart() {
    try {
        const response = await fetch(`${API_BASE}/api/history`);
        const history = await response.json();

        if (!history || history.length === 0) return;

        const labels = history.map(h => h.timestamp).reverse();
        const percentages = history.map(h => h.level_percentage).reverse();
        const volumes = history.map(h => h.volume_liters).reverse();

        const ctx = document.getElementById('history-chart');
        if (!ctx) return;

        const ctxContext = ctx.getContext('2d');

        if (chart) {
            chart.data.labels = labels;
            chart.data.datasets[0].data = percentages;
            chart.data.datasets[1].data = volumes;
            chart.update();
        } else {
            chart = new Chart(ctxContext, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Nível (%)',
                            data: percentages,
                            borderColor: '#0066cc',
                            backgroundColor: 'rgba(0, 102, 204, 0.1)',
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y',
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#0066cc',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2
                        },
                        {
                            label: 'Volume (L)',
                            data: volumes,
                            borderColor: '#00d4ff',
                            backgroundColor: 'rgba(0, 212, 255, 0.1)',
                            tension: 0.4,
                            fill: false,
                            yAxisID: 'y1',
                            borderWidth: 2,
                            pointRadius: 3,
                            pointBackgroundColor: '#00d4ff',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: '#b0b8c1',
                                font: { size: 12, weight: '600' },
                                padding: 20
                            }
                        },
                        filler: {
                            propagate: true
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Nível (%)',
                                color: '#b0b8c1',
                                font: { size: 12, weight: '600' }
                            },
                            ticks: {
                                color: '#b0b8c1',
                                font: { size: 11 }
                            },
                            grid: {
                                color: 'rgba(42, 49, 66, 0.5)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Volume (L)',
                                color: '#b0b8c1',
                                font: { size: 12, weight: '600' }
                            },
                            ticks: {
                                color: '#b0b8c1',
                                font: { size: 11 }
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        },
                        x: {
                            ticks: {
                                color: '#b0b8c1',
                                font: { size: 11 }
                            },
                            grid: {
                                color: 'rgba(42, 49, 66, 0.5)'
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar gráfico:', error);
    }
}
