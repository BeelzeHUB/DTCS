/* ========================================================
   HIS - Surgery & OR Scheduler Management Interactivity Script
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    console.log("Operating Room queue arrays loaded.");

    // Action submission verification trigger mockup
    const commitBtn = document.querySelector('.btn-commit-schedule');
    if (commitBtn) {
        commitBtn.addEventListener('click', function() {
            const patientName = document.querySelector('.custom-form-input').value;
            alert(`Surgical allocation successful for ${patientName}. Theater tracking unit notified.`);
        });
    }

    // Pipeline options panel simulator clicker
    const interactiveDots = document.querySelectorAll('.bi-three-dots-vertical');
    interactiveDots.forEach(dot => {
        dot.parentElement.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Context menu requested for selected active case segment row.");
        });
    });

    setupAddRecordModal({
        map: {
            patient: v => `<div class="d-flex align-items-center gap-2"><div class="patient-icon-circle bg-light text-muted"><i class="bi bi-person"></i></div><span class="font-weight-bold text-dark">${v}</span></div>`,
            procedure: v => `<span class="text-muted">${v}</span>`,
            theater: v => `<span class="badge bg-light text-dark font-monospace px-2 py-1 border text-uppercase fs-10">${v}</span>`,
            surgeon: v => `<span class="text-dark font-weight-medium">${v}</span>`
        },
        statusClass: {
            'Confirmed': 'bg-soft-success-bright text-success-dark',
            'In Preparation': 'bg-soft-info text-info',
            'Delayed': 'bg-soft-danger text-danger',
            'Pending': 'bg-soft-secondary text-muted'
        }
    });
});