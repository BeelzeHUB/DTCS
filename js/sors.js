/* =======================================================
   DTCS - Surgery & Operating Room Scheduler (SORS) Controller
   Sidebar = all DTCS modules (handled by dashboard.css).
   SORS = overview + 5 scroll sections; the sidebar sub-menu
   highlights the section in view (scroll-spy) and can be
   hidden/unhidden with the chevron button.
   ======================================================= */

/* ---------- Sidebar collapse toggle (main DTCS sidebar) ---------- */
function sorsSetupSidebar() {
    const toggle = document.getElementById("sidebarToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
        const hidden = document.body.classList.toggle("sidebar-hidden");
        toggle.setAttribute("aria-label", hidden ? "Show sidebar" : "Hide sidebar");
    });
}

/* ---------- Collapse / expand the SORS sub-menu (hide & unhide) ---------- */
function sorsSetupSubToggle() {
    const toggle = document.getElementById("sorsSubToggle");
    const menu = document.getElementById("sorsSubMenu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const hidden = menu.classList.toggle("collapsed");
        toggle.classList.toggle("collapsed", hidden);
        toggle.setAttribute("aria-expanded", hidden ? "false" : "true");
        window.dispatchEvent(new Event("scroll"));
    });
}

/* ---------- Scroll-spy: highlight the sub-item for the section in view ---------- */
function sorsSetupScrollSpy() {
    const items = document.querySelectorAll(".nav-sub-item");
    const sections = Array.prototype.slice.call(document.querySelectorAll(".lis-section"));
    const parentLink = document.getElementById("sorsParentLink");
    if (!items.length || !sections.length) return;
    let ticking = false;
    function setActive(id) {
        items.forEach(function (i) { i.classList.toggle("active", i.dataset.lisTab === id); });
    }
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            const menu = document.getElementById("sorsSubMenu");
            const hidden = menu && menu.classList.contains("collapsed");
            if (hidden) {
                items.forEach(function (i) { i.classList.remove("active"); });
                if (parentLink) parentLink.classList.add("active");
                ticking = false;
                return;
            }
            const top = window.scrollY || document.documentElement.scrollTop;
            const offset = 140;
            let current = sections[0].id;
            sections.forEach(function (sec) {
                if (sec.offsetTop - offset <= top) current = sec.id;
            });
            if (current === "sors-overview") {
                items.forEach(function (i) { i.classList.remove("active"); });
                if (parentLink) parentLink.classList.add("active");
            } else {
                if (parentLink) parentLink.classList.remove("active");
                setActive(current.replace("tab-", ""));
            }
            ticking = false;
        });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    document.querySelectorAll("[data-lis-tab], [data-goto]").forEach(function (link) {
        link.addEventListener("click", function (e) {
            const tab = link.dataset.lisTab || link.dataset.goto;
            const target = document.getElementById("tab-" + tab);
            if (target) {
                e.preventDefault();
                window.scrollTo({ top: target.offsetTop - 90, behavior: "smooth" });
            }
        });
    });
    if (parentLink) {
        parentLink.addEventListener("click", function (e) {
            if (parentLink.getAttribute("href") === "#sors-overview") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

/* ---------- Toast notifications (UI only) ---------- */
function sorsToast(title, message, type) {
    type = type || "success";
    const wrap = document.getElementById("sorsToastWrap");
    if (!wrap) return;
    const icons = { success: "bi-check-circle-fill", error: "bi-x-circle-fill", info: "bi-info-circle-fill", warning: "bi-exclamation-triangle-fill" };
    const el = document.createElement("div");
    el.className = "lis-toast " + type;
    el.innerHTML =
        '<i class="bi ' + (icons[type] || icons.info) + ' lis-toast-icon"></i>' +
        '<div class="lis-toast-body"><p class="lis-toast-title">' + title + '</p><p class="lis-toast-msg">' + message + '</p></div>' +
        '<button class="lis-toast-close" aria-label="Dismiss"><i class="bi bi-x"></i></button>';
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    const remove = function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 350); };
    el.querySelector(".lis-toast-close").addEventListener("click", remove);
    setTimeout(remove, 4000);
}

/* ---------- Loading spinner ---------- */
function sorsShowSpinner() { const s = document.getElementById("sorsSpinner"); if (s) s.classList.add("show"); }
function sorsHideSpinner() { const s = document.getElementById("sorsSpinner"); if (s) s.classList.remove("show"); }
function sorsWithButtonSpinner(btn, callback) {
    if (!btn) { callback(); return; }
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="lis-btn-spinner"></span> Processing...';
    setTimeout(function () { btn.disabled = false; btn.innerHTML = original; callback(); }, 900);
}

/* ---------- Generic table search ---------- */
function sorsSetupTableSearch(inputId, tableSelector, emptyRowId) {
    const input = document.getElementById(inputId);
    const table = document.querySelector(tableSelector);
    if (!input || !table) return;
    const rows = table.querySelectorAll("tbody tr:not(.lis-empty-row)");
    function apply() {
        const term = input.value.trim().toLowerCase();
        let visible = 0;
        rows.forEach(function (row) {
            const match = term === "" || row.textContent.toLowerCase().includes(term);
            row.classList.toggle("d-none", !match);
            if (match) visible++;
        });
        const empty = document.getElementById(emptyRowId);
        if (empty) empty.classList.toggle("d-none", visible !== 0);
    }
    input.addEventListener("input", apply);
}

/* ---------- Notifications bell ---------- */
function sorsSetupNotifications() {
    const bell = document.getElementById("sorsNotifBtn");
    if (!bell) return;
    bell.addEventListener("click", function () { sorsToast("Notifications", "You have 2 unread surgery alerts.", "info"); });
}

/* ---------- Section: Surgery Scheduling ---------- */
function sorsInitScheduling() {
    const form = document.getElementById("sorsSchedForm");
    const save = document.getElementById("sorsSchedSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        sorsWithButtonSpinner(save, function () { sorsToast("Scheduled", "Surgery scheduled.", "success"); });
    });
    const reset = document.getElementById("sorsSchedReset");
    if (reset) reset.addEventListener("click", function () { form.reset(); sorsToast("Reset", "Form cleared.", "info"); });
    const cancel = document.getElementById("sorsSchedCancel");
    if (cancel) cancel.addEventListener("click", function () { sorsToast("Cancelled", "Cancelled.", "info"); });
    const draft = document.getElementById("sorsSchedDraft");
    if (draft) draft.addEventListener("click", function () { sorsToast("Draft", "Saved as draft.", "info"); });
    const table = document.getElementById("sorsSchedTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "surgery";
        if (b.classList.contains("view")) sorsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) sorsToast("Edit", "Editing " + id, "info");
        else if (b.classList.contains("print")) sorsToast("Print", "Printing " + id, "info");
        else if (b.classList.contains("delete")) {
            if (confirm("Delete " + id + "?")) { row.style.transition = "opacity .3s"; row.style.opacity = "0"; setTimeout(function () { row.remove(); }, 300); sorsToast("Deleted", id + " removed.", "error"); }
        }
    });
    sorsSetupTableSearch("sorsSearchInput", "#sorsSchedTable", "lisEmptyRow");
}

/* ---------- Section: Operating Room Reservation ---------- */
function sorsInitReservation() {
    const form = document.getElementById("sorsResForm");
    const save = document.getElementById("sorsResSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        sorsWithButtonSpinner(save, function () { sorsToast("Reserved", "Operating room reserved.", "success"); });
    });
    const update = document.getElementById("sorsResUpdate");
    if (update) update.addEventListener("click", function () { sorsToast("Updated", "Reservation updated.", "info"); });
    const cancel = document.getElementById("sorsResCancel");
    if (cancel) cancel.addEventListener("click", function () { sorsToast("Cancelled", "Reservation cancelled.", "info"); });
    const table = document.getElementById("sorsResTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "reservation";
        if (b.classList.contains("view")) sorsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) sorsToast("Edit", "Editing " + id, "info");
    });
    sorsSetupTableSearch("sorsSearchInput", "#sorsResTable", "lisEmptyRow");
}

/* ---------- Section: Surgeon Assignment ---------- */
function sorsInitSurgeon() {
    const form = document.getElementById("sorsAsgForm");
    const save = document.getElementById("sorsAsgSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        sorsWithButtonSpinner(save, function () { sorsToast("Assigned", "Surgical team assigned.", "success"); });
    });
    const update = document.getElementById("sorsAsgUpdate");
    if (update) update.addEventListener("click", function () { sorsToast("Updated", "Assignment updated.", "info"); });
    const clear = document.getElementById("sorsAsgClear");
    if (clear) clear.addEventListener("click", function () { form.reset(); sorsToast("Cleared", "Form cleared.", "info"); });
    const table = document.getElementById("sorsAsgTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "surgery";
        if (b.classList.contains("view")) sorsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) sorsToast("Edit", "Editing " + id, "info");
    });
    sorsSetupTableSearch("sorsSearchInput", "#sorsAsgTable", "lisEmptyRow");
}

/* ---------- Section: Equipment Scheduling ---------- */
function sorsInitEquipment() {
    const form = document.getElementById("sorsEquipForm");
    const save = document.getElementById("sorsEquipSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        sorsWithButtonSpinner(save, function () { sorsToast("Reserved", "Equipment reserved.", "success"); });
    });
    const update = document.getElementById("sorsEquipUpdate");
    if (update) update.addEventListener("click", function () { sorsToast("Updated", "Reservation updated.", "info"); });
    const cancel = document.getElementById("sorsEquipCancel");
    if (cancel) cancel.addEventListener("click", function () { sorsToast("Cancelled", "Reservation cancelled.", "info"); });
    const table = document.getElementById("sorsEquipTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "equipment";
        if (b.classList.contains("view")) sorsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) sorsToast("Edit", "Editing " + id, "info");
    });
    sorsSetupTableSearch("sorsSearchInput", "#sorsEquipTable", "lisEmptyRow");
}

/* ---------- Section: Surgical Records ---------- */
function sorsInitRecords() {
    const save = document.getElementById("sorsRecSave");
    if (save) save.addEventListener("click", function () { sorsWithButtonSpinner(save, function () { sorsToast("Saved", "Surgical record saved.", "success"); }); });
    const update = document.getElementById("sorsRecUpdate");
    if (update) update.addEventListener("click", function () { sorsToast("Updated", "Record updated.", "info"); });
    const print = document.getElementById("sorsRecPrint");
    if (print) print.addEventListener("click", function () { sorsToast("Print", "Printing record...", "info"); });
    const pdf = document.getElementById("sorsRecPdf");
    if (pdf) pdf.addEventListener("click", function () { sorsToast("Export", "PDF generated.", "success"); });
    const table = document.getElementById("sorsRecTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "record";
        if (b.classList.contains("view")) sorsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("print")) sorsToast("Print", "Printing " + id, "info");
    });
    sorsSetupTableSearch("sorsSearchInput", "#sorsRecTable", "lisEmptyRow");
}

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener("DOMContentLoaded", function () {
    sorsSetupSidebar();
    sorsSetupSubToggle();
    sorsSetupScrollSpy();
    sorsSetupNotifications();
    sorsInitScheduling();
    sorsInitReservation();
    sorsInitSurgeon();
    sorsInitEquipment();
    sorsInitRecords();
    setTimeout(sorsHideSpinner, 600);
});
