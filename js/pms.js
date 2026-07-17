/* =======================================================
   DTCS - Pharmacy Management System (PMS) Consolidated Controller
   Sidebar = all DTCS modules (handled by dashboard.css).
   Pharmacy Management = overview + 6 scroll sections; the sidebar
   sub-menu highlights the section in view (scroll-spy) and can be
   hidden/unhidden with the chevron button.
   ======================================================= */

/* ---------- Sidebar collapse toggle (main DTCS sidebar) ---------- */
function pmsSetupSidebar() {
    const toggle = document.getElementById("sidebarToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
        const hidden = document.body.classList.toggle("sidebar-hidden");
        toggle.setAttribute("aria-label", hidden ? "Show sidebar" : "Hide sidebar");
    });
}

/* ---------- Collapse / expand the Pharmacy sub-menu (hide & unhide) ---------- */
function pmsSetupSubToggle() {
    const toggle = document.getElementById("pmsSubToggle");
    const menu = document.getElementById("pmsSubMenu");
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
function pmsSetupScrollSpy() {
    const items = document.querySelectorAll(".nav-sub-item");
    const sections = Array.prototype.slice.call(document.querySelectorAll(".lis-section"));
    const parentLink = document.getElementById("pmsParentLink");
    if (!items.length || !sections.length) return;
    let ticking = false;
    function setActive(id) {
        items.forEach(function (i) { i.classList.toggle("active", i.dataset.lisTab === id); });
    }
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            const menu = document.getElementById("pmsSubMenu");
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
            if (parentLink) parentLink.classList.add("active");
            if (current === "pms-overview") {
                items.forEach(function (i) { i.classList.remove("active"); });
            } else {
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
            if (parentLink.getAttribute("href") === "#pms-overview") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

/* ---------- Toast notifications (UI only) ---------- */
function pmsToast(title, message, type) {
    type = type || "success";
    const wrap = document.getElementById("pmsToastWrap");
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
function pmsShowSpinner() { const s = document.getElementById("pmsSpinner"); if (s) s.classList.add("show"); }
function pmsHideSpinner() { const s = document.getElementById("pmsSpinner"); if (s) s.classList.remove("show"); }
function pmsWithButtonSpinner(btn, callback) {
    if (!btn) { callback(); return; }
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="lis-btn-spinner"></span> Processing...';
    setTimeout(function () { btn.disabled = false; btn.innerHTML = original; callback(); }, 900);
}

/* ---------- Generic table search ---------- */
function pmsSetupTableSearch(inputId, tableSelector, emptyRowId) {
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
function pmsSetupNotifications() {
    const bell = document.getElementById("pmsNotifBtn");
    if (!bell) return;
    bell.addEventListener("click", function () { pmsToast("Notifications", "You have 3 unread pharmacy alerts.", "info"); });
}

/* ---------- Section: Medicine Inventory ---------- */
function pmsInitInventory() {
    const form = document.getElementById("pmsMedicineForm");
    const saveBtn = document.getElementById("pmsMedSave");
    if (form && saveBtn) form.addEventListener("submit", function (e) {
        e.preventDefault();
        pmsWithButtonSpinner(saveBtn, function () { pmsToast("Saved", "Medicine added to inventory.", "success"); });
    });
    const reset = document.getElementById("pmsMedReset");
    if (reset) reset.addEventListener("click", function () { form.reset(); pmsToast("Reset", "Form cleared.", "info"); });
    const cancel = document.getElementById("pmsMedCancel");
    if (cancel) cancel.addEventListener("click", function () { pmsToast("Cancelled", "Cancelled.", "info"); });
    const table = document.getElementById("pmsInventoryTable");
    if (table) table.addEventListener("click", function (e) {
        const btn = e.target.closest(".lis-tbtn"); if (!btn) return;
        const row = btn.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "medicine";
        if (btn.classList.contains("view")) pmsToast("View", "Opening " + id, "info");
        else if (btn.classList.contains("edit")) pmsToast("Edit", "Editing " + id, "info");
        else if (btn.classList.contains("print")) pmsToast("Print", "Printing " + id, "info");
        else if (btn.classList.contains("delete")) {
            if (confirm("Delete " + id + "?")) { row.style.transition = "opacity .3s"; row.style.opacity = "0"; setTimeout(function () { row.remove(); }, 300); pmsToast("Deleted", id + " removed.", "error"); }
        }
    });
    pmsSetupTableSearch("pmsSearchInput", "#pmsInventoryTable", "lisEmptyRow");
}

/* ---------- Section: Stock Monitoring (Chart.js) ---------- */
function pmsInitStock() {
    const canvas = document.getElementById("pmsStockChart");
    if (canvas && window.Chart) {
        new Chart(canvas.getContext("2d"), {
            type: "doughnut",
            data: { labels: ["In Stock", "Low Stock", "Out of Stock", "Overstock"], datasets: [{ data: [798, 12, 4, 28], backgroundColor: ["#065f46", "#d97706", "#dc2626", "#2563eb"], borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    const table = document.getElementById("pmsStockTable");
    if (table) table.addEventListener("click", function (e) {
        const btn = e.target.closest(".lis-tbtn"); if (!btn) return;
        const row = btn.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "item";
        if (btn.classList.contains("view")) pmsToast("View", "Opening " + id, "info");
        else if (btn.classList.contains("edit")) pmsToast("Restock", "Restock " + id, "info");
    });
    pmsSetupTableSearch("pmsSearchInput", "#pmsStockTable", "lisEmptyRow");
}

/* ---------- Section: Dispensing ---------- */
function pmsInitDispensing() {
    const form = document.getElementById("pmsDispenseForm");
    const btn = document.getElementById("pmsDispenseBtn");
    if (form && btn) form.addEventListener("submit", function (e) {
        e.preventDefault();
        pmsWithButtonSpinner(btn, function () { pmsToast("Dispensed", "Medicine dispensed and inventory updated.", "success"); });
    });
    const cancel = document.getElementById("pmsDispenseCancel");
    if (cancel) cancel.addEventListener("click", function () { pmsToast("Cancelled", "Cancelled.", "info"); });
    const print = document.getElementById("pmsDispensePrint");
    if (print) print.addEventListener("click", function () { pmsToast("Print", "Printing receipt...", "info"); });
    const table = document.getElementById("pmsDispenseTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "rx";
        if (b.classList.contains("view")) pmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("print")) pmsToast("Print", "Printing " + id, "info");
    });
    pmsSetupTableSearch("pmsSearchInput", "#pmsDispenseTable", "lisEmptyRow");
}

/* ---------- Section: Prescription Validation ---------- */
function pmsInitValidation() {
    const approve = document.getElementById("pmsValApprove");
    if (approve) approve.addEventListener("click", function () { pmsWithButtonSpinner(approve, function () { pmsToast("Approved", "Prescription validated.", "success"); }); });
    const reject = document.getElementById("pmsValReject");
    if (reject) reject.addEventListener("click", function () { pmsToast("Rejected", "Prescription rejected.", "error"); });
    const clarify = document.getElementById("pmsValClarify");
    if (clarify) clarify.addEventListener("click", function () { pmsToast("Clarification", "Request sent to physician.", "info"); });
    const table = document.getElementById("pmsValidationTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "rx";
        if (b.classList.contains("view")) pmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("approve")) { const s = row.querySelectorAll("td")[3]; if (s) s.innerHTML = '<span class="lis-badge lis-badge-approved">Approved</span>'; pmsToast("Approved", id + " approved.", "success"); }
        else if (b.classList.contains("reject")) { const s = row.querySelectorAll("td")[3]; if (s) s.innerHTML = '<span class="lis-badge lis-badge-rejected">Rejected</span>'; pmsToast("Rejected", id + " rejected.", "error"); }
    });
    pmsSetupTableSearch("pmsSearchInput", "#pmsValidationTable", "lisEmptyRow");
}

/* ---------- Section: Expiration Monitoring ---------- */
function pmsInitExpiration() {
    const table = document.getElementById("pmsExpirationTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "medicine";
        if (b.classList.contains("delete")) pmsToast("Remove", "Removed " + id, "error");
        else if (b.classList.contains("print")) pmsToast("Return", "Returned to supplier: " + id, "info");
        else if (b.classList.contains("view")) pmsToast("View", "Opening " + id, "info");
    });
    pmsSetupTableSearch("pmsSearchInput", "#pmsExpirationTable", "lisEmptyRow");
}

/* ---------- Section: Purchase Orders ---------- */
function pmsInitOrders() {
    const form = document.getElementById("pmsOrderForm");
    const create = document.getElementById("pmsOrderCreate");
    if (form && create) form.addEventListener("submit", function (e) {
        e.preventDefault();
        pmsWithButtonSpinner(create, function () { pmsToast("Order Created", "Purchase order submitted.", "success"); });
    });
    const draft = document.getElementById("pmsOrderDraft");
    if (draft) draft.addEventListener("click", function () { pmsToast("Draft", "Order saved as draft.", "info"); });
    const submit = document.getElementById("pmsOrderSubmit");
    if (submit) submit.addEventListener("click", function () { pmsToast("Submitted", "Order submitted for approval.", "info"); });
    const cancel = document.getElementById("pmsOrderCancel");
    if (cancel) cancel.addEventListener("click", function () { pmsToast("Cancelled", "Cancelled.", "info"); });
    const table = document.getElementById("pmsOrderTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "PO";
        if (b.classList.contains("view")) pmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) pmsToast("Edit", "Editing " + id, "info");
        else if (b.classList.contains("delete")) pmsToast("Delete", "Deleted " + id, "error");
    });
    pmsSetupTableSearch("pmsSearchInput", "#pmsOrderTable", "lisEmptyRow");
}

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener("DOMContentLoaded", function () {
    pmsSetupSidebar();
    pmsSetupSubToggle();
    pmsSetupScrollSpy();
    pmsSetupNotifications();
    pmsInitInventory();
    pmsInitStock();
    pmsInitDispensing();
    pmsInitValidation();
    pmsInitExpiration();
    pmsInitOrders();
    setTimeout(pmsHideSpinner, 600);
});
