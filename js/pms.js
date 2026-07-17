/* ========================================================
    HIS - Pharmacy Management System Interactivity Script
    ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    console.log("Pharmacy Inventory & Dispensation Ledger subsystem offline instances armed.");

    loadPatientFromLIS();

    const dispenseBtn = document.querySelector('.btn-approve-dispense');
    if (dispenseBtn) {
        dispenseBtn.addEventListener('click', function () {
            alert("Prescription order approved. Outpatient tracking entry pushed to dispensation queue.");
        });
    }

    const flagBtn = document.querySelector('.btn-flag-interaction');
    if (flagBtn) {
        flagBtn.addEventListener('click', function () {
            alert("Dispensation alert logged: Prescription profile interaction flag submitted for supervisor validation review.");
        });
    }

    setupAddRecordModal({
        map: {
            medicine: v => `<span class="d-block font-weight-bold text-dark">${v}</span>`,
            dosage: v => `<small class="text-muted fs-11">${v || '—'}</small>`,
            stock: v => `<span class="d-block font-weight-bold text-dark">${v || '0'}</span>`,
            price: v => `<span class="font-weight-medium text-dark">${v || '—'}</span>`,
            expiry: v => `<span class="text-muted">${v || '—'}</span>`
        },
        statusClass: {
            'In Stock': 'bg-soft-success-bright text-success-dark',
            'Critical': 'bg-soft-danger text-danger',
            'Reorder Soon': 'bg-soft-secondary text-muted'
        }
    });
});

/* ========================================================
    PMS - Load Patient Data from LIS (localStorage)
    ======================================================== */
function loadPatientFromLIS() {
    const panel = document.getElementById('priorityDispensationPanel');
    const emptyState = document.getElementById('priorityDispensationEmpty');
    if (!panel || !emptyState) return;

    const stored = localStorage.getItem('lis_patient_profile');
    if (!stored) {
        panel.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    let profileData;
    try {
        profileData = JSON.parse(stored);
    } catch (e) {
        panel.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    const avatar = document.getElementById('pmsPatientAvatar');
    const nameEl = document.getElementById('pmsPatientName');
    const infoEl = document.getElementById('pmsPatientInfo');
    const statusEl = document.getElementById('pmsPatientStatus');

    if (avatar && profileData.initials) {
        avatar.textContent = profileData.initials;
    }
    if (nameEl && profileData.name) {
        nameEl.textContent = profileData.name;
    }
    if (infoEl && profileData.id) {
        const ward = profileData.fields && profileData.fields.ward ? profileData.fields.ward : '-';
        const room = profileData.fields && profileData.fields.room ? profileData.fields.room : '';
        infoEl.textContent = profileData.id + ' &bull; ' + ward + (room ? ' ' + room : '');
    }
    if (statusEl) {
        statusEl.textContent = 'Pending Approval';
    }

    panel.style.display = 'block';
    emptyState.style.display = 'none';
}