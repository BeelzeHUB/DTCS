/* =======================================================
   DTCS - Laboratory Information System (LIS) Consolidated Controller
   Main sidebar = all DTCS modules (handled by dashboard.css).
   Laboratory Information = overview + 6 scroll sections; the sidebar
   sub-menu highlights the section in view (scroll-spy) and can be
   hidden/unhidden with the chevron button.
   Handles sidebar toggle, sub-menu toggle, scroll-spy, search, toast,
   spinner, charts, and per-section logic.
   ======================================================= */

/* ---------- Sidebar collapse toggle (main DTCS sidebar) ---------- */
function lisSetupSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        const hidden = document.body.classList.toggle('sidebar-hidden');
        toggle.setAttribute('aria-label', hidden ? 'Show sidebar' : 'Hide sidebar');
    });
}

/* ---------- Collapse / expand the Laboratory Information sub-menu (hide & unhide) ---------- */
function lisSetupSubToggle() {
    const toggle = document.getElementById('lisSubToggle');
    const menu = document.getElementById('lisSubMenu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const hidden = menu.classList.toggle('collapsed');
        toggle.classList.toggle('collapsed', hidden);
        toggle.setAttribute('aria-expanded', hidden ? 'false' : 'true');
        // Re-run scroll-spy so the highlight updates (parent green vs sub-item) right away
        window.dispatchEvent(new Event('scroll'));
    });
}

/* ---------- Scroll-spy: highlight the sub-item for the section in view ---------- */
function lisSetupScrollSpy() {
    const items = document.querySelectorAll('.nav-sub-item');
    const sections = Array.prototype.slice.call(document.querySelectorAll('.lis-section'));
    const parentLink = document.getElementById('lisParentLink');
    if (!items.length || !sections.length) return;
    let ticking = false;

    function setActive(id) {
        items.forEach(function (i) { i.classList.toggle('active', i.dataset.lisTab === id); });
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            const menu = document.getElementById('lisSubMenu');
            const hidden = menu && menu.classList.contains('collapsed');
            // When the sub-menu is hidden, Laboratory Information keeps its green highlight
            if (hidden) {
                items.forEach(function (i) { i.classList.remove('active'); });
                if (parentLink) parentLink.classList.add('active');
                ticking = false;
                return;
            }
            const top = window.scrollY || document.documentElement.scrollTop;
            const offset = 140;
            let current = sections[0].id;
            sections.forEach(function (sec) {
                if (sec.offsetTop - offset <= top) current = sec.id;
            });
            if (current === 'lis-overview') {
                items.forEach(function (i) { i.classList.remove('active'); });
                if (parentLink) parentLink.classList.add('active');
            } else {
                if (parentLink) parentLink.classList.remove('active');
                setActive(current.replace('tab-', ''));
            }
            ticking = false;
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Clicking a sub-item / module card scrolls smoothly to its section
    document.querySelectorAll('[data-lis-tab], [data-goto]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            const tab = link.dataset.lisTab || link.dataset.goto;
            const target = document.getElementById(tab === 'requests' ? 'tab-requests' : 'tab-' + tab) || document.getElementById('tab-' + tab);
            if (target) {
                e.preventDefault();
                const y = target.offsetTop - 90;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

    // Clicking "Laboratory Information" returns to the overview
    if (parentLink) {
        parentLink.addEventListener('click', function (e) {
            if (parentLink.getAttribute('href') === '#lis-overview') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

/* ---------- Toast notifications (UI only) ---------- */
function lisToast(title, message, type) {
    type = type || 'success';
    const wrap = document.getElementById('lisToastWrap');
    if (!wrap) return;
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };
    const el = document.createElement('div');
    el.className = 'lis-toast ' + type;
    el.innerHTML =
        '<i class="bi ' + (icons[type] || icons.info) + ' lis-toast-icon"></i>' +
        '<div class="lis-toast-body"><p class="lis-toast-title">' + title + '</p><p class="lis-toast-msg">' + message + '</p></div>' +
        '<button class="lis-toast-close" aria-label="Dismiss"><i class="bi bi-x"></i></button>';
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    const remove = function () { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 350); };
    el.querySelector('.lis-toast-close').addEventListener('click', remove);
    setTimeout(remove, 4000);
}

/* ---------- Loading spinner ---------- */
function lisShowSpinner() { const s = document.getElementById('lisSpinner'); if (s) s.classList.add('show'); }
function lisHideSpinner() { const s = document.getElementById('lisSpinner'); if (s) s.classList.remove('show'); }
function lisWithButtonSpinner(btn, callback) {
    if (!btn) { callback(); return; }
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="lis-btn-spinner"></span> Processing...';
    setTimeout(function () { btn.disabled = false; btn.innerHTML = original; callback(); }, 900);
}

/* ---------- Generic table search ---------- */
function lisSetupTableSearch(inputId, tableSelector, emptyRowId) {
    const input = document.getElementById(inputId);
    const table = document.querySelector(tableSelector);
    if (!input || !table) return;
    const rows = table.querySelectorAll('tbody tr:not(.lis-empty-row)');
    function apply() {
        const term = input.value.trim().toLowerCase();
        let visible = 0;
        rows.forEach(function (row) {
            const match = term === '' || row.textContent.toLowerCase().includes(term);
            row.classList.toggle('d-none', !match);
            if (match) visible++;
        });
        const empty = document.getElementById(emptyRowId);
        if (empty) empty.classList.toggle('d-none', visible !== 0);
    }
    input.addEventListener('input', apply);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; apply(); input.blur(); } });
}

/* ---------- Generic pagination (UI only) ---------- */
function lisSetupPagination(scope, totalPages) {
    const prev = document.getElementById(scope + 'PrevPage');
    const next = document.getElementById(scope + 'NextPage');
    const info = document.getElementById(scope + 'PageInfo');
    if (!prev && !next) return;
    let current = 1;
    function render() {
        if (info) info.textContent = 'Page ' + current + ' of ' + totalPages;
        if (prev) prev.disabled = current === 1;
        if (next) next.disabled = current === totalPages;
    }
    if (prev) prev.addEventListener('click', function () { if (current > 1) { current--; render(); } });
    if (next) next.addEventListener('click', function () { if (current < totalPages) { current++; render(); } });
    render();
}

/* ---------- Notifications bell ---------- */
function lisSetupNotifications() {
    const bell = document.getElementById('lisNotifBtn');
    if (!bell) return;
    bell.addEventListener('click', function () { lisToast('Notifications', 'You have 3 unread laboratory alerts.', 'info'); });
}

/* =======================================================
   SECTION: LABORATORY REQUESTS
   ======================================================= */
function lisInitRequests() {
    const filterBtn = document.getElementById('lisFilterBtn');
    const filterBar = document.getElementById('lisFilterBar');
    if (filterBtn && filterBar) filterBtn.addEventListener('click', function () {
        filterBar.style.display = filterBar.style.display === 'none' ? 'block' : 'none';
    });
    document.querySelectorAll('#tab-requests .lis-test-chip').forEach(function (chip) {
        chip.addEventListener('click', function () { this.classList.toggle('selected'); });
    });
    const form = document.getElementById('lisRequestForm');
    const saveBtn = document.getElementById('lisSaveBtn');
    if (form && saveBtn) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const selected = document.querySelectorAll('#tab-requests .lis-test-chip.selected').length;
            if (selected === 0) { lisToast('Validation', 'Please select at least one laboratory test.', 'warning'); return; }
            lisWithButtonSpinner(saveBtn, function () { lisToast('Request Saved', 'Laboratory request submitted with ' + selected + ' test(s).', 'success'); });
        });
    }
    const cancelBtn = document.getElementById('lisCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', function () {
        document.querySelectorAll('#tab-requests .lis-test-chip.selected').forEach(c => c.classList.remove('selected'));
        lisToast('Cancelled', 'Request form cleared.', 'info');
    });
    const table = document.getElementById('lisRequestsTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'record';
        if (btn.classList.contains('view')) lisToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('edit')) lisToast('Edit', 'Editing ' + id, 'info');
        else if (btn.classList.contains('delete')) {
            if (confirm('Delete ' + id + '?')) { row.style.transition = 'opacity .3s'; row.style.opacity = '0'; setTimeout(function () { row.remove(); }, 300); lisToast('Deleted', id + ' removed.', 'error'); }
        }
    });
    lisSetupTableSearch('lisSearchInput', '#lisRequestsTable', 'lisEmptyRow');
    lisSetupPagination('lis', 24);
}

/* =======================================================
   SECTION: SAMPLE COLLECTION
   ======================================================= */
function lisInitSamples() {
    const form = document.getElementById('lisSampleForm');
    const saveBtn = document.getElementById('lisSaveSampleBtn');
    if (form && saveBtn) form.addEventListener('submit', function (e) {
        e.preventDefault();
        lisWithButtonSpinner(saveBtn, function () { lisToast('Sample Collected', 'Specimen logged and barcode generated.', 'success'); });
    });
    const table = document.getElementById('lisSamplesTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'sample';
        if (btn.classList.contains('view')) lisToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('print')) lisToast('Print', 'Printing label for ' + id, 'info');
    });
    lisSetupTableSearch('lisSearchInput', '#lisSamplesTable', 'lisEmptyRow');
}

/* =======================================================
   SECTION: TEST PROCESSING
   ======================================================= */
function lisInitProcessing() {
    const form = document.getElementById('lisProcessForm');
    const saveBtn = document.getElementById('lisSaveResultBtn');
    const autoFlag = document.getElementById('lisAutoFlag');
    const resultInput = document.getElementById('lisResultInput');
    const rangeInput = document.getElementById('lisRange');
    const flagSelect = document.getElementById('lisFlag');
    function autoComputeFlag() {
        if (!autoFlag || !autoFlag.checked) return;
        const val = parseFloat((resultInput?.value || '').trim());
        const range = (rangeInput?.value || '').match(/([\d.]+)\s*-\s*([\d.]+)/);
        if (isNaN(val) || !range) { flagSelect.value = 'Normal'; return; }
        const min = parseFloat(range[1]), max = parseFloat(range[2]);
        if (val < min * 0.5 || val > max * 1.5) flagSelect.value = 'Critical';
        else if (val < min) flagSelect.value = 'Low';
        else if (val > max) flagSelect.value = 'High';
        else flagSelect.value = 'Normal';
    }
    if (resultInput) resultInput.addEventListener('input', autoComputeFlag);
    if (autoFlag) autoFlag.addEventListener('change', autoComputeFlag);
    if (form && saveBtn) form.addEventListener('submit', function (e) {
        e.preventDefault();
        lisWithButtonSpinner(saveBtn, function () { lisToast('Result Saved', 'Result entered with flag: ' + (flagSelect?.value || ''), 'success'); });
    });
    const table = document.getElementById('lisProcessTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const test = row.querySelectorAll('td')[1]?.textContent || 'test';
        if (btn.classList.contains('edit')) lisToast('Edit', 'Editing ' + test, 'info');
        else if (btn.classList.contains('print')) lisToast('Print', 'Printing ' + test, 'info');
    });
    lisSetupTableSearch('lisSearchInput', '#lisProcessTable', 'lisEmptyRow');
}

/* =======================================================
   SECTION: LABORATORY RESULTS
   ======================================================= */
function lisInitResults() {
    const printBtn = document.getElementById('lisPrintBtn');
    const pdfBtn = document.getElementById('lisPdfBtn');
    const emailBtn = document.getElementById('lisEmailBtn');
    if (printBtn) printBtn.addEventListener('click', function () { lisWithButtonSpinner(printBtn, function () { lisToast('Print', 'Sending report to printer...', 'info'); }); });
    if (pdfBtn) pdfBtn.addEventListener('click', function () { lisToast('Download', 'Generating PDF report...', 'success'); });
    if (emailBtn) emailBtn.addEventListener('click', function () { lisToast('Email', 'Report sent to requesting physician.', 'success'); });
    if (document.getElementById('lisResultsTable')) lisSetupTableSearch('lisSearchInput', '#lisResultsTable', 'lisEmptyRow');
}

/* =======================================================
   SECTION: RESULT VERIFICATION
   ======================================================= */
function lisInitVerification() {
    const table = document.getElementById('lisVerifyTable');
    const pendingCountEl = document.getElementById('lisPendingCount');
    function decPending() {
        if (pendingCountEl) { let n = parseInt(pendingCountEl.textContent, 10) || 0; pendingCountEl.textContent = Math.max(0, n - 1); }
    }
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const patient = row.querySelector('.lis-strong')?.textContent || 'result';
        if (btn.classList.contains('approve')) {
            const status = row.querySelectorAll('td')[4];
            if (status) status.innerHTML = '<span class="lis-badge lis-badge-approved">Approved</span>';
            decPending(); lisToast('Approved', patient + ' result verified.', 'success'); setTimeout(function () { row.remove(); }, 600);
        } else if (btn.classList.contains('reject')) {
            const status = row.querySelectorAll('td')[4];
            if (status) status.innerHTML = '<span class="lis-badge lis-badge-rejected">Rejected</span>';
            decPending(); lisToast('Rejected', patient + ' result rejected.', 'error');
        } else if (btn.classList.contains('view')) {
            lisToast('View', 'Opening ' + patient, 'info');
        }
    });
    lisSetupTableSearch('lisSearchInput', '#lisVerifyTable', 'lisEmptyRow');
    lisSetupPagination('lis', 4);
}

/* =======================================================
   SECTION: LABORATORY REPORTS (Chart.js)
   ======================================================= */
let lisChartsReady = false;
function lisInitCharts() {
    if (lisChartsReady || !window.Chart) return;
    lisChartsReady = true;
    const brand = { blue: '#2563eb', teal: '#14b8a6', green: '#065f46', amber: '#d97706', red: '#dc2626', slate: '#475569' };
    const mainData = {
        daily: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        monthly: ['W1', 'W2', 'W3', 'W4'],
        yearly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    };
    const mainValues = {
        daily: [12, 8, 34, 40, 38, 22],
        weekly: [210, 240, 225, 260, 280, 150, 119],
        monthly: [980, 1040, 1120, 1284],
        yearly: [9200, 9800, 10200, 11000, 11400, 12100, 12840, 13200, 12900, 13400, 13800, 14100]
    };
    let mainChart = null;
    const mainCanvas = document.getElementById('lisMainChart');
    if (mainCanvas) {
        mainChart = new Chart(mainCanvas.getContext('2d'), {
            type: 'bar',
            data: { labels: mainData.daily, datasets: [{ label: 'Tests', data: mainValues.daily, backgroundColor: brand.blue, borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
    document.querySelectorAll('[data-range]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('[data-range]').forEach(b => { b.classList.remove('lis-btn-primary'); b.classList.add('lis-btn-outline'); });
            btn.classList.remove('lis-btn-outline'); btn.classList.add('lis-btn-primary');
            const r = btn.dataset.range;
            if (mainChart) { mainChart.data.labels = mainData[r]; mainChart.data.datasets[0].data = mainValues[r]; mainChart.update(); }
        });
    });
    const cat = document.getElementById('lisCategoryChart');
    if (cat) new Chart(cat.getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['Hematology', 'Chemistry', 'Urinalysis', 'Microbiology', 'Serology'], datasets: [{ data: [420, 380, 210, 148, 126], backgroundColor: [brand.red, brand.blue, brand.amber, brand.green, brand.teal], borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
    const trend = document.getElementById('lisTrendChart');
    if (trend) new Chart(trend.getContext('2d'), {
        type: 'line',
        data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Avg Hours', data: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.4], borderColor: brand.teal, backgroundColor: 'rgba(20,184,166,0.15)', fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const flag = document.getElementById('lisFlagChart');
    if (flag) new Chart(flag.getContext('2d'), {
        type: 'pie',
        data: { labels: ['Normal', 'High', 'Low', 'Critical'], datasets: [{ data: [1102, 96, 49, 37], backgroundColor: [brand.green, brand.amber, brand.blue, brand.red], borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
function lisInitReports() {
    const printBtn2 = document.getElementById('lisPrintBtn2');
    const pdfBtn2 = document.getElementById('lisPdfBtn2');
    const excelBtn = document.getElementById('lisExcelBtn');
    if (printBtn2) printBtn2.addEventListener('click', function () { lisToast('Print', 'Sending reports to print...', 'info'); });
    if (pdfBtn2) pdfBtn2.addEventListener('click', function () { lisToast('Export', 'PDF report generated.', 'success'); });
    if (excelBtn) excelBtn.addEventListener('click', function () { lisToast('Export', 'Excel report downloaded.', 'success'); });
}

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener('DOMContentLoaded', function () {
    lisSetupSidebar();
    lisSetupSubToggle();
    lisSetupScrollSpy();
    lisSetupNotifications();
    lisInitRequests();
    lisInitSamples();
    lisInitProcessing();
    lisInitResults();
    lisInitVerification();
    lisInitReports();
    lisInitCharts();
    setTimeout(lisHideSpinner, 600);
});
