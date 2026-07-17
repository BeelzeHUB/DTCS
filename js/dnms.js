/* =======================================================
   DTCS - Diet & Nutrition Management System (DNMS) Controller
   Sidebar = all DTCS modules (handled by dashboard.css).
   DNMS = overview + 5 scroll sections; the sidebar sub-menu
   highlights the section in view (scroll-spy) and can be
   hidden/unhidden with the chevron button.
   ======================================================= */

/* ---------- Sidebar collapse toggle (main DTCS sidebar) ---------- */
function dnmsSetupSidebar() {
    const toggle = document.getElementById("sidebarToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
        const hidden = document.body.classList.toggle("sidebar-hidden");
        toggle.setAttribute("aria-label", hidden ? "Show sidebar" : "Hide sidebar");
    });
}

/* ---------- Collapse / expand the DNMS sub-menu (hide & unhide) ---------- */
function dnmsSetupSubToggle() {
    const toggle = document.getElementById("dnmsSubToggle");
    const menu = document.getElementById("dnmsSubMenu");
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
function dnmsSetupScrollSpy() {
    const items = document.querySelectorAll(".nav-sub-item");
    const sections = Array.prototype.slice.call(document.querySelectorAll(".lis-section"));
    const parentLink = document.getElementById("dnmsParentLink");
    if (!items.length || !sections.length) return;
    let ticking = false;
    function setActive(id) {
        items.forEach(function (i) { i.classList.toggle("active", i.dataset.lisTab === id); });
    }
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            const menu = document.getElementById("dnmsSubMenu");
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
            if (current === "dnms-overview") {
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
            if (parentLink.getAttribute("href") === "#dnms-overview") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    }
}

/* ---------- Toast notifications (UI only) ---------- */
function dnmsToast(title, message, type) {
    type = type || "success";
    const wrap = document.getElementById("dnmsToastWrap");
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
function dnmsShowSpinner() { const s = document.getElementById("dnmsSpinner"); if (s) s.classList.add("show"); }
function dnmsHideSpinner() { const s = document.getElementById("dnmsSpinner"); if (s) s.classList.remove("show"); }
function dnmsWithButtonSpinner(btn, callback) {
    if (!btn) { callback(); return; }
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="lis-btn-spinner"></span> Processing...';
    setTimeout(function () { btn.disabled = false; btn.innerHTML = original; callback(); }, 900);
}

/* ---------- Generic table search ---------- */
function dnmsSetupTableSearch(inputId, tableSelector, emptyRowId) {
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
function dnmsSetupNotifications() {
    const bell = document.getElementById("dnmsNotifBtn");
    if (!bell) return;
    bell.addEventListener("click", function () { dnmsToast("Notifications", "You have 2 unread nutrition alerts.", "info"); });
}

/* ---------- Charts (Nutrition Reports) ---------- */
let dnmsChartsReady = false;
function dnmsInitCharts() {
    if (dnmsChartsReady || !window.Chart) return;
    dnmsChartsReady = true;
    const brand = { blue: "#2563eb", teal: "#14b8a6", green: "#065f46", amber: "#d97706", red: "#dc2626" };
    const bar = document.getElementById("dnmsBarChart");
    if (bar) new Chart(bar.getContext("2d"), {
        type: "bar",
        data: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets: [{ label: "Meals Served", data: [210,225,200,240,260,150,119], backgroundColor: brand.blue, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const pie = document.getElementById("dnmsPieChart");
    if (pie) new Chart(pie.getContext("2d"), {
        type: "pie",
        data: { labels: ["Diabetic","Low Sodium","Renal","Soft"], datasets: [{ data: [30,22,10,8], backgroundColor: [brand.red, brand.blue, brand.amber, brand.teal], borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
    const line = document.getElementById("dnmsLineChart");
    if (line) new Chart(line.getContext("2d"), {
        type: "line",
        data: { labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul"], datasets: [{ label: "Avg Compliance %", data: [82,84,85,88,90,89,91], borderColor: brand.green, backgroundColor: "rgba(6,95,70,0.12)", fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

/* ---------- Section: Diet Prescription ---------- */
function dnmsInitPrescription() {
    const form = document.getElementById("dnmsRxForm");
    const save = document.getElementById("dnmsRxSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        dnmsWithButtonSpinner(save, function () { dnmsToast("Saved", "Diet prescription created.", "success"); });
    });
    const reset = document.getElementById("dnmsRxReset");
    if (reset) reset.addEventListener("click", function () { form.reset(); dnmsToast("Reset", "Form cleared.", "info"); });
    const cancel = document.getElementById("dnmsRxCancel");
    if (cancel) cancel.addEventListener("click", function () { dnmsToast("Cancelled", "Cancelled.", "info"); });
    const draft = document.getElementById("dnmsRxDraft");
    if (draft) draft.addEventListener("click", function () { dnmsToast("Draft", "Saved as draft.", "info"); });
    const table = document.getElementById("dnmsRxTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "rx";
        if (b.classList.contains("view")) dnmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) dnmsToast("Edit", "Editing " + id, "info");
        else if (b.classList.contains("print")) dnmsToast("Print", "Printing " + id, "info");
        else if (b.classList.contains("delete")) {
            if (confirm("Delete " + id + "?")) { row.style.transition = "opacity .3s"; row.style.opacity = "0"; setTimeout(function () { row.remove(); }, 300); dnmsToast("Deleted", id + " removed.", "error"); }
        }
    });
    dnmsSetupTableSearch("dnmsSearchInput", "#dnmsRxTable", "lisEmptyRow");
}

/* ---------- Section: Meal Planning ---------- */
function dnmsInitMeal() {
    const form = document.getElementById("dnmsMealForm");
    const save = document.getElementById("dnmsMealSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        dnmsWithButtonSpinner(save, function () { dnmsToast("Saved", "Meal plan created.", "success"); });
    });
    const reset = document.getElementById("dnmsMealReset");
    if (reset) reset.addEventListener("click", function () { form.reset(); dnmsToast("Reset", "Form cleared.", "info"); });
    const update = document.getElementById("dnmsMealUpdate");
    if (update) update.addEventListener("click", function () { dnmsToast("Updated", "Meal plan updated.", "info"); });
    const table = document.getElementById("dnmsMealTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "plan";
        if (b.classList.contains("view")) dnmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) dnmsToast("Edit", "Editing " + id, "info");
    });
    dnmsSetupTableSearch("dnmsSearchInput", "#dnmsMealTable", "lisEmptyRow");
}

/* ---------- Section: Nutrition Monitoring ---------- */
function dnmsInitMonitoring() {
    const form = document.getElementById("dnmsMonForm");
    const save = document.getElementById("dnmsMonSave");
    if (form && save) form.addEventListener("submit", function (e) {
        e.preventDefault();
        dnmsWithButtonSpinner(save, function () { dnmsToast("Saved", "Monitoring record saved.", "success"); });
    });
    const update = document.getElementById("dnmsMonUpdate");
    if (update) update.addEventListener("click", function () { dnmsToast("Updated", "Record updated.", "info"); });
    const clear = document.getElementById("dnmsMonClear");
    if (clear) clear.addEventListener("click", function () { form.reset(); dnmsToast("Cleared", "Form cleared.", "info"); });
    const table = document.getElementById("dnmsMonTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "patient";
        if (b.classList.contains("view")) dnmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("edit")) dnmsToast("Edit", "Editing " + id, "info");
    });
    dnmsSetupTableSearch("dnmsSearchInput", "#dnmsMonTable", "lisEmptyRow");
}

/* ---------- Section: Dietary Recommendations ---------- */
function dnmsInitRecommendation() {
    const gen = document.getElementById("dnmsRecGen");
    if (gen) gen.addEventListener("click", function () { dnmsWithButtonSpinner(gen, function () { dnmsToast("Generated", "Recommendation generated.", "success"); }); });
    const print = document.getElementById("dnmsRecPrint");
    if (print) print.addEventListener("click", function () { dnmsToast("Print", "Printing recommendation...", "info"); });
    const pdf = document.getElementById("dnmsRecPdf");
    if (pdf) pdf.addEventListener("click", function () { dnmsToast("Export", "PDF generated.", "success"); });
    const pdf2 = document.getElementById("dnmsRecPdf2");
    if (pdf2) pdf2.addEventListener("click", function () { dnmsToast("Download", "PDF downloaded.", "success"); });
    const table = document.getElementById("dnmsRecTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "rec";
        if (b.classList.contains("view")) dnmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("print")) dnmsToast("Print", "Printing " + id, "info");
    });
    dnmsSetupTableSearch("dnmsRecSearch", "#dnmsRecTable", "lisEmptyRow");
}

/* ---------- Section: Nutrition Reports ---------- */
function dnmsInitReports() {
    const pdf = document.getElementById("dnmsRepPdf");
    if (pdf) pdf.addEventListener("click", function () { dnmsToast("Export", "PDF report generated.", "success"); });
    const excel = document.getElementById("dnmsRepExcel");
    if (excel) excel.addEventListener("click", function () { dnmsToast("Export", "Excel report downloaded.", "success"); });
    const print = document.getElementById("dnmsRepPrint");
    if (print) print.addEventListener("click", function () { dnmsToast("Print", "Printing report...", "info"); });
    document.querySelectorAll("[data-range]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            document.querySelectorAll("[data-range]").forEach(b => { b.classList.remove("lis-btn-primary"); b.classList.add("lis-btn-outline"); });
            btn.classList.remove("lis-btn-outline"); btn.classList.add("lis-btn-primary");
            dnmsToast("Range", "Report range: " + btn.dataset.range, "info");
        });
    });
    const table = document.getElementById("dnmsRepTable");
    if (table) table.addEventListener("click", function (e) {
        const b = e.target.closest(".lis-tbtn"); if (!b) return;
        const row = b.closest("tr"); const id = row.querySelector(".lis-strong")?.textContent || "report";
        if (b.classList.contains("view")) dnmsToast("View", "Opening " + id, "info");
        else if (b.classList.contains("print")) dnmsToast("Print", "Printing " + id, "info");
    });
    dnmsSetupTableSearch("dnmsSearchInput", "#dnmsRepTable", "lisEmptyRow");
}

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener("DOMContentLoaded", function () {
    dnmsSetupSidebar();
    dnmsSetupSubToggle();
    dnmsSetupScrollSpy();
    dnmsSetupNotifications();
    dnmsInitPrescription();
    dnmsInitMeal();
    dnmsInitMonitoring();
    dnmsInitRecommendation();
    dnmsInitReports();
    dnmsInitCharts();
    setTimeout(dnmsHideSpinner, 600);
});
