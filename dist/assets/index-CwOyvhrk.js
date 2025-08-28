/*
======================================================
   Monitor de Consumo de Água - Script Principal
   Arquivo: index-CwOyvhrk.js
   Função: Controla a interface web e atualiza gráficos
======================================================
*/

// ==========================
// Variáveis globais
// ==========================
const apiUrl = "/api/dados"; // Endpoint para buscar dados do servidor Flask
const historicoUrl = "/api/historico"; // Endpoint para histórico
let chart = null; // Gráfico principal

// ==========================
// Função: Buscar último dado
// ==========================
async function fetchUltimoDado() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Atualiza valores na tela
    document.getElementById("nivel-agua").innerText = data.nivel + " cm";
    document.getElementById("timestamp").innerText = data.timestamp;
  } catch (error) {
    console.error("Erro ao buscar último dado:", error);
  }
}

// ==========================
// Função: Buscar histórico
// ==========================
async function fetchHistorico() {
  try {
    const response = await fetch(historicoUrl);
    const historico = await response.json();

    // Prepara dados para o gráfico
    const labels = historico.map(d => d.timestamp);
    const valores = historico.map(d => d.nivel);

    renderChart(labels, valores);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
  }
}

// ==========================
// Função: Renderizar gráfico
// ==========================
function renderChart(labels, data) {
  const ctx = document.getElementById("grafico").getContext("2d");

  if (chart) {
    chart.destroy(); // Destroi gráfico antigo antes de redesenhar
  }

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Nível da Água (cm)",
        data: data,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#2563eb"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#111827"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#374151" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#374151" }
        }
      }
    }
  });
}

// ==========================
// Atualização automática
// ==========================
function iniciarAtualizacaoAutomatica() {
  fetchUltimoDado();
  fetchHistorico();

  // Atualiza a cada 10 segundos
  setInterval(() => {
    fetchUltimoDado();
    fetchHistorico();
  }, 10000);
}

// ==========================
// Inicialização
// ==========================
window.addEventListener("load", () => {
  iniciarAtualizacaoAutomatica();
});
