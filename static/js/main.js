document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.main-nav .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    // Activate default tab (Dashboard) and hide others
    document.getElementById('dashboard').classList.add('active');
    document.querySelector('.main-nav .nav-item[data-tab="dashboard"]').classList.add('active');

    navItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            const targetTab = this.dataset.tab;

            // Remove active class from all nav items and add to clicked one
            navItems.forEach(link => link.classList.remove('active'));
            this.classList.add('active');

            // Hide all tab contents and show the target one
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            // If switching to history tab, fetch history data
            if (targetTab === 'history') {
                fetchHistoryData();
            }
        });
    });

    const tank1WaterFill = document.getElementById('tank1-water-fill');
    const tank1LevelPercentage = document.getElementById('tank1-level-percentage');
    const tank1LevelText = document.getElementById('tank1-level-text');
    const tank1VolumeLiters = document.getElementById('tank1-volume-liters');
    const tank1DistanceCm = document.getElementById('tank1-distance-cm');
    const tank1Timestamp = document.getElementById('tank1-timestamp');
    const tank1Alert = document.getElementById('tank1-alert');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    let tank1Chart;

    function updateDashboard(data) {
        console.log('Dados recebidos para atualização do dashboard:', data);

        // Check if data is valid and contains tank1 information
        if (data && data.tank_id === 'tank1') {
            const percentage = parseFloat(data.level_percentage);
            const volume = parseFloat(data.volume_liters);
            const distance = parseFloat(data.distance_cm);
            const timestamp = data.timestamp;
            const status = data.status;

            // Update tank visual
            tank1WaterFill.style.height = `${Math.min(100, Math.max(0, percentage))}%`;
            tank1LevelPercentage.textContent = `${percentage.toFixed(1)}%`;
            tank1LevelText.textContent = `${percentage.toFixed(1)}%`;
            tank1VolumeLiters.textContent = `${volume.toFixed(2)} L`;
            tank1DistanceCm.textContent = `${distance.toFixed(2)} cm`;
            tank1Timestamp.textContent = moment(timestamp).format('DD/MM/YYYY HH:mm:ss');

            // Color and alert logic
            if (percentage < 20) {
                tank1WaterFill.style.backgroundColor = '#dc3545'; // Red
                tank1Alert.className = 'alert-message alert-low';
                tank1Alert.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Nível muito baixo! Abastecer!';
            } else if (percentage > 100) {
                tank1WaterFill.style.backgroundColor = '#ffc107'; // Yellow
                tank1Alert.className = 'alert-message alert-high';
                tank1Alert.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Nível acima de 100%! Possível transbordamento ou sensor descalibrado.';
            } else {
                tank1WaterFill.style.backgroundColor = '#007bff'; // Blue
                tank1Alert.className = 'alert-message';
                tank1Alert.innerHTML = '';
            }

            // Update online/offline status
            if (status === 'online') {
                statusIndicator.classList.remove('status-offline');
                statusIndicator.classList.add('status-online');
                statusText.textContent = 'Online';
            } else {
                statusIndicator.classList.remove('status-online');
                statusIndicator.classList.add('status-offline');
                statusText.textContent = 'Offline';
            }
        } else {
            console.warn('Dados inválidos ou sem tank_id=tank1 para atualização do dashboard.');
            // If data is invalid, set status to offline and show error
            statusIndicator.classList.remove('status-online');
            statusIndicator.classList.add('status-offline');
            statusText.textContent = 'Offline';
            if (document.getElementById('tank1-alert')) {
                document.getElementById('tank1-alert').className = 'alert-message alert-error';
                document.getElementById('tank1-alert').innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro de conexão ou dados. Verifique o sensor.';
            }
        }
    }

    async function fetchLatestData() {
        console.log('Buscando dados mais recentes...');
        try {
            const response = await fetch('/api/latest');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Dados mais recentes recebidos:', data);
            updateDashboard(data);
        } catch (error) {
            console.error('Erro ao buscar dados mais recentes:', error);
            // In case of error, ensure status is offline and show error message
            statusIndicator.classList.remove('status-online');
            statusIndicator.classList.add('status-offline');
            statusText.textContent = 'Offline';
            if (document.getElementById('tank1-alert')) {
                document.getElementById('tank1-alert').className = 'alert-message alert-error';
                document.getElementById('tank1-alert').innerHTML = '<i class="fas fa-exclamation-circle"></i> Erro de conexão ou dados. Verifique o sensor.';
            }
        }
    }

    async function fetchHistoryData() {
        console.log('Buscando dados históricos...');
        try {
            const response = await fetch('/api/history');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const historyData = await response.json();
            console.log('Dados históricos recebidos:', historyData);
            updateChart(historyData);
        } catch (error) {
            console.error('Erro ao buscar dados históricos:', error);
        }
    }

    function updateChart(data) {
        const labels = data.map(item => moment(item.timestamp).format('HH:mm'));
        const percentages = data.map(item => item.level_percentage);

        if (tank1Chart) {
            tank1Chart.destroy();
        }

        const ctx = document.getElementById('tank1Chart').getContext('2d');
        tank1Chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nível (%)',
                    data: percentages,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            tooltipFormat: 'HH:mm:ss'
                        },
                        title: {
                            display: true,
                            text: 'Hora'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nível (%)'
                        },
                        max: 100
                    }
                }
            }
        });
    }

    // Initial data load and periodic updates
    fetchLatestData();
    fetchHistoryData();
    setInterval(fetchLatestData, 5000); // Update every 5 seconds
});
