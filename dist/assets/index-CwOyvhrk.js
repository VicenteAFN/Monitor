// Arquivo reorganizado e indentado do bundle React (index-CwOyvhrk.js)
// Observação: este arquivo foi gerado pelo build (provavelmente Vite/React).
// O código original JSX foi transformado em JavaScript ofuscado/minificado.
// Aqui está a versão expandida, indentada e comentada para facilitar a edição.

// ============================================================================
// IMPORTAÇÕES DE REACT E OUTRAS BIBLIOTECAS
// ============================================================================
import React from "react";
import ReactDOM from "react-dom/client";

// ============================================================================
// COMPONENTES PRINCIPAIS
// ============================================================================
// A aplicação principal é montada dentro do <div id="root"></div> no index.html

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      {/* Cabeçalho */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-blue-600">
          {/* TEXTO EDITÁVEL: Título principal */}
          Monitor de Água - Dashboard
        </h1>
        <p className="text-gray-600">
          {/* TEXTO EDITÁVEL: Subtítulo */}
          Acompanhe em tempo real o nível de água do reservatório.
        </p>
      </header>

      {/* Área de dados principais */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        <section className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">
            {/* TEXTO EDITÁVEL */}
            Nível Atual
          </h2>
          <p className="text-4xl font-bold text-blue-700">
            {/* Aqui o valor será atualizado pelo JS */}
            75 cm
          </p>
        </section>

        <section className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">
            {/* TEXTO EDITÁVEL */}
            Histórico de Consumo
          </h2>
          <div id="chart-area">
            {/* Gráfico renderizado via biblioteca JS (ex.: Chart.js ou Recharts) */}
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="mt-8 text-sm text-gray-500">
        {/* TEXTO EDITÁVEL */}
        &copy; 2025 Monitor de Água. Todos os direitos reservados.
      </footer>
    </div>
  );
}

// ============================================================================
// RENDERIZAÇÃO DA APLICAÇÃO
// ============================================================================
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
