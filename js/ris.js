/* =======================================================
   DTCS - Radiology and Imaging System (RIS) Consolidated Controller
   Sidebar = all DTCS modules (handled by dashboard.css).
   Radiology and Imaging = overview + 5 scroll sections; the sidebar
   sub-menu highlights the section in view (scroll-spy) and can be
   hidden/unhidden with the chevron button.
   Handles sidebar toggle, sub-menu toggle, scroll-spy, search, toast,
   spinner, charts, and per-section logic.
   ======================================================= */

/* ---------- Sidebar collapse toggle (main DTCS sidebar) ---------- */
function risSetupSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        const hidden = document.body.classList.toggle('sidebar-hidden');
        toggle.setAttribute('aria-label', hidden ? 'Show sidebar' : 'Hide sidebar');
    });
}

/* ---------- Collapse / expand the Radiology sub-menu (hide & unhide) ---------- */
function risSetupSubToggle() {
    const toggle = document.getElementById('risSubToggle');
    const menu = document.getElementById('risSubMenu');
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
function risSetupScrollSpy() {
    const items = document.querySelectorAll('.nav-sub-item');
    const sections = Array.prototype.slice.call(document.querySelectorAll('.lis-section'));
    const parentLink = document.getElementById('risParentLink');
    if (!items.length || !sections.length) return;
    let ticking = false;

    function setActive(id) {
        items.forEach(function (i) { i.classList.toggle('active', i.dataset.lisTab === id); });
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            const menu = document.getElementById('risSubMenu');
            const hidden = menu && menu.classList.contains('collapsed');
            // When the sub-menu is hidden, Radiology keeps its green highlight
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
            if (current === 'ris-overview') {
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
            const target = document.getElementById('tab-' + tab);
            if (target) {
                e.preventDefault();
                const y = target.offsetTop - 90;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

    // Clicking "Radiology and Imaging" returns to the overview
    if (parentLink) {
        parentLink.addEventListener('click', function (e) {
            if (parentLink.getAttribute('href') === '#ris-overview') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

/* ---------- Toast notifications (UI only) ---------- */
function risToast(title, message, type) {
    type = type || 'success';
    const wrap = document.getElementById('risToastWrap');
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
function risShowSpinner() { const s = document.getElementById('risSpinner'); if (s) s.classList.add('show'); }
function risHideSpinner() { const s = document.getElementById('risSpinner'); if (s) s.classList.remove('show'); }
function risWithButtonSpinner(btn, callback) {
    if (!btn) { callback(); return; }
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="lis-btn-spinner"></span> Processing...';
    setTimeout(function () { btn.disabled = false; btn.innerHTML = original; callback(); }, 900);
}

/* ---------- Generic table search ---------- */
function risSetupTableSearch(inputId, tableSelector, emptyRowId) {
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
}

/* ---------- Notifications bell ---------- */
function risSetupNotifications() {
    const bell = document.getElementById('risNotifBtn');
    if (!bell) return;
    bell.addEventListener('click', function () { risToast('Notifications', 'You have 2 unread radiology alerts.', 'info'); });
}

/* ---------- Section: Imaging Requests ---------- */
function risInitRequests() {
    document.querySelectorAll('#tab-requests .lis-test-chip').forEach(function (chip) {
        chip.addEventListener('click', function () { this.classList.toggle('selected'); });
    });
    const form = document.getElementById('risRequestForm');
    const saveBtn = document.getElementById('risRequestSave');
    if (form && saveBtn) form.addEventListener('submit', function (e) {
        e.preventDefault();
        risWithButtonSpinner(saveBtn, function () { risToast('Request Saved', 'Imaging request submitted.', 'success'); });
    });
    const resetBtn = document.getElementById('risRequestReset');
    if (resetBtn) resetBtn.addEventListener('click', function () { form.reset(); risToast('Reset', 'Form cleared.', 'info'); });
    const cancelBtn = document.getElementById('risRequestCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function () { risToast('Cancelled', 'Request cancelled.', 'info'); });
    const table = document.getElementById('risRequestsTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'request';
        if (btn.classList.contains('view')) risToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('edit')) risToast('Edit', 'Editing ' + id, 'info');
        else if (btn.classList.contains('print')) risToast('Print', 'Printing ' + id, 'info');
        else if (btn.classList.contains('delete')) {
            if (confirm('Delete ' + id + '?')) { row.style.transition = 'opacity .3s'; row.style.opacity = '0'; setTimeout(function () { row.remove(); }, 300); risToast('Deleted', id + ' removed.', 'error'); }
        }
    });
    risSetupTableSearch('risSearchInput', '#risRequestsTable', 'lisEmptyRow');
}

/* ---------- Section: Scheduling ---------- */
function risInitScheduling() {
    const form = document.getElementById('risSchedForm');
    const saveBtn = document.getElementById('risSchedSave');
    if (form && saveBtn) form.addEventListener('submit', function (e) {
        e.preventDefault();
        risWithButtonSpinner(saveBtn, function () { risToast('Scheduled', 'Appointment scheduled.', 'success'); });
    });
    const resched = document.getElementById('risSchedReschedule');
    if (resched) resched.addEventListener('click', function () { risToast('Reschedule', 'Appointment rescheduled.', 'info'); });
    const cancel = document.getElementById('risSchedCancel');
    if (cancel) cancel.addEventListener('click', function () { risToast('Cancelled', 'Appointment cancelled.', 'info'); });
    const table = document.getElementById('risSchedTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'appointment';
        if (btn.classList.contains('view')) risToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('edit')) risToast('Edit', 'Editing ' + id, 'info');
    });
    risSetupTableSearch('risSearchInput', '#risSchedTable', 'lisEmptyRow');
}

/* ---------- Section: Radiologist Assignment ---------- */
function risInitAssignment() {
    const form = document.getElementById('risAssignForm');
    const saveBtn = document.getElementById('risAssignSave');
    if (form && saveBtn) form.addEventListener('submit', function (e) {
        e.preventDefault();
        risWithButtonSpinner(saveBtn, function () { risToast('Assigned', 'Study assigned to radiologist.', 'success'); });
    });
    const reassign = document.getElementById('risAssignReassign');
    if (reassign) reassign.addEventListener('click', function () { risToast('Reassign', 'Study reassigned.', 'info'); });
    const clear = document.getElementById('risAssignClear');
    if (clear) clear.addEventListener('click', function () { form.reset(); risToast('Cleared', 'Form cleared.', 'info'); });
    const table = document.getElementById('risAssignTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'study';
        if (btn.classList.contains('view')) risToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('edit')) risToast('Edit', 'Editing ' + id, 'info');
    });
    risSetupTableSearch('risSearchInput', '#risAssignTable', 'lisEmptyRow');
}

/* ---------- Section: Imaging Reports ---------- */
function risInitReports() {
    const draft = document.getElementById('risRepDraft');
    if (draft) draft.addEventListener('click', function () { risToast('Draft', 'Report saved as draft.', 'info'); });
    const finalize = document.getElementById('risRepFinalize');
    if (finalize) finalize.addEventListener('click', function () { risWithButtonSpinner(finalize, function () { risToast('Finalized', 'Report finalized & signed.', 'success'); }); });
    const printBtn = document.getElementById('risRepPrint');
    if (printBtn) printBtn.addEventListener('click', function () { risToast('Print', 'Sending report to printer...', 'info'); });
    const pdfBtn = document.getElementById('risRepPdf');
    if (pdfBtn) pdfBtn.addEventListener('click', function () { risToast('Export', 'PDF report generated.', 'success'); });
    const table = document.getElementById('risReportsTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'report';
        if (btn.classList.contains('view')) risToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('print')) risToast('Print', 'Printing ' + id, 'info');
    });
    risSetupTableSearch('risSearchInput', '#risReportsTable', 'lisEmptyRow');
}

/* ---------- Section: Image History ---------- */
function risInitHistory() {
    const table = document.getElementById('risHistoryTable');
    if (table) table.addEventListener('click', function (e) {
        const btn = e.target.closest('.lis-tbtn'); if (!btn) return;
        const row = btn.closest('tr'); const id = row.querySelector('.lis-strong')?.textContent || 'study';
        if (btn.classList.contains('view')) risToast('View', 'Opening ' + id, 'info');
        else if (btn.classList.contains('print')) risToast('Print', 'Printing ' + id, 'info');
        else if (btn.classList.contains('download')) risToast('Download', 'Downloading ' + id, 'info');
    });
    risSetupTableSearch('risHistorySearch', '#risHistoryTable', 'lisEmptyRow');
}

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener('DOMContentLoaded', function () {
    risSetupSidebar();
    risSetupSubToggle();
    risSetupScrollSpy();
    risSetupNotifications();
    risInitRequests();
    risInitScheduling();
    risInitAssignment();
    risInitReports();
    risInitHistory();
    setTimeout(risHideSpinner, 600);
});
