/* ========================================================
   HIS - Diet & Nutrition Management Interactivity Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    console.log("Dietary profile log monitors initialized.");

    // Restriction workflow modifier popup simulator
    const modifyBtn = document.querySelector('.btn-modify-restrictions');
    if (modifyBtn) {
        modifyBtn.addEventListener('click', function() {
            alert("Redirecting to Diet & Restriction Master Configurator engine pipeline.");
        });
    }

    // Toggle log items inspector print logic
    const exportBtn = document.querySelector('.btn-action-top');
    if (exportBtn && exportBtn.innerText.includes("Export PDF")) {
        exportBtn.addEventListener('click', function() {
            console.log("Compiling metabolic ingestion records stream matrix into application container layout target.");
            alert("Nutritional log archive export task requested successfully.");
        });
    }

    setupAddRecordModal({
        map: {
            time: v => `<span class="d-block font-weight-bold text-dark">${v}</span>`,
            date: v => `<small class="text-muted font-monospace fs-10">${v}</small>`,
            intake: v => `<span class="text-dark">${v || '—'}</span>`,
            kcal: v => `<span class="font-weight-medium text-dark">${v || '0'}</span>`,
            sodium: v => `<span class="text-dark">${v || '0'}</span>`,
            sugar: v => `<span class="text-dark">${v || '0'}</span>`
        },
        statusClass: {
            'Optimal': 'bg-soft-success-bright text-success-dark',
            'Warn: Sodium': 'bg-soft-warning text-warning-dark',
            'Warn: Sugar': 'bg-soft-warning text-warning-dark'
        }
    });
});