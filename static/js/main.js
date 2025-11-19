async function updateDashboard() {
    try {
        const data = await API.get("/api/latest");
        if (!data) return;

        const settings = data.settings || {};

        // Exibe dados do sensor
        safeSetText("water-level", Utils.formatNumber(data.level_percentage, 1) + '%');
        safeSetText("volume", Utils.formatNumber(data.volume_liters, 0) + ' L');
        safeSetText("distance", Utils.formatNumber(data.distance_cm, 1) + ' cm');
        safeSetText("last-update", Utils.formatDate(data.timestamp));

        // Status do sistema
        const statusEl = document.getElementById("system-status");
        if (statusEl && statusEl.querySelector("span")) {
            const span = statusEl.querySelector("span");
            span.textContent = data.status === "online" ? "Online" : "Offline";
            span.className = data.status === "online" ? "text-success" : "text-danger";
        }

        // Nível do tanque
        const levelStatus = document.getElementById("level-status");
        if (levelStatus) {
            const lvl = data.level_percentage || 0;
            levelStatus.textContent = Utils.getLevelStatus(lvl);
            levelStatus.className = "text-" + Utils.getLevelColor(lvl);
        }

        // Animação do tanque
        Animation.animateTank(data.level_percentage);
        const waterFill = document.getElementById("water-fill");
        if (waterFill) {
            const lvl = data.level_percentage || 0;
            waterFill.style.backgroundColor = lvl >= 70 ? "#28a745" : (lvl >= 30 ? "#ffc107" : "#dc3545");
        }

        // Informações do tanque
        if (settings) {
            safeSetText("tank-name", settings.name || "Tanque");
            safeSetText("volume-total", `de ${Utils.formatNumber(settings.total_volume, 0)} L total`);
            safeSetText("tank-info", `Reservatório de ${Utils.formatNumber(settings.total_volume, 0)} L`);
            safeSetText("tank-dimensions", `${Utils.formatNumber(settings.tank_height, 0)}cm × ${Utils.formatNumber(settings.tank_width, 0)}cm × ${Utils.formatNumber(settings.tank_length, 0)}cm`);

            // Atualiza alertas
            updateAlerts(data.level_percentage, settings.low_alert_threshold, settings.high_alert_threshold);
        }

    } catch (e) {
        console.error("Erro ao atualizar dashboard:", e);
    }
}
