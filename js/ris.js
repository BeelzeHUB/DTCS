/* ========================================================
   HIS - Radiology and Imaging System Interactivity File
   ======================================================== */

document.addEventListener('DOMContentLoaded', function () {
    console.log("Radiology imaging DICOM pipelines initialized.");

    // Simple thumbnail item focus simulator selection loop
    const thumbnails = document.querySelectorAll('.thumb-frame');
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            console.log("Loading medical frame segment slice bundle mapping configuration index.");
        });
    });

    // Verification handler target mockup
    const verifyBtn = document.querySelector('.btn-verify-report');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', function() {
            alert("Digital signature verified. Reporting file committed via secure diagnostic protocol.");
        });
    }

    setupAddRecordModal({
        map: {
            patient: v => `<span class="font-weight-bold text-dark">${v}</span>`,
            modality: v => `<span class="text-muted">${v}</span>`,
            study: v => `<span class="text-dark">${v}</span>`
        },
        statusClass: {
            'Pending Verification': 'bg-soft-warning text-warning-dark',
            'Verified': 'bg-soft-success text-success',
            'Stat': 'bg-soft-danger text-danger'
        }
    });
});