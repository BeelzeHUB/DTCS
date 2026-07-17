/* =======================================================
   DTCS - Diagnostic Dashboard Controller
   Central executive overview of all clinical modules.
   ======================================================= */

/* ---------- Toast notifications (UI only) ---------- */
function dashToast(title, message, type) {
    type = type || "success";
    const wrap = document.getElementById("dashToastWrap");
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

/* ---------- Sidebar toggle ---------- */
function dashSetupSidebar() {
    const toggle = document.getElementById("sidebarToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
        const hidden = document.body.classList.toggle("sidebar-hidden");
        toggle.setAttribute("aria-label", hidden ? "Show sidebar" : "Hide sidebar");
    });
}

/* ---------- Live clock ---------- */
function dashSetupClock() {
    const dateEl = document.getElementById("dashDate");
    const timeEl = document.getElementById("dashTime");
    if (!dateEl || !timeEl) return;
    function tick() {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        timeEl.textContent = now.toLocaleTimeString("en-US");
    }
    tick();
    setInterval(tick, 1000);
}

/* ---------- Notifications ---------- */
function dashSetupNotifications() {
    const bell = document.getElementById("dashNotifBtn");
    if (!bell) return;
    bell.addEventListener("click", function () { dashToast("Notifications", "You have 5 unread hospital alerts.", "info"); });
}

/* ---------- Refresh ---------- */
function dashSetupRefresh() {
    const btn = document.getElementById("dashRefresh");
    if (!btn) return;
    btn.addEventListener("click", function () {
        const original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="lis-btn-spinner"></span> Refreshing...';
        setTimeout(function () { btn.disabled = false; btn.innerHTML = original; dashToast("Refreshed", "Dashboard metrics updated.", "success"); }, 900);
    });
}

/* ---------- Charts ---------- */
function dashInitCharts() {
    if (!window.Chart) return;
    const brand = { blue: "#2563eb", teal: "#14b8a6", green: "#065f46", amber: "#d97706", red: "#dc2626", slate: "#475569" };
    const daily = document.getElementById("dashDailyChart");
    if (daily) new Chart(daily.getContext("2d"), {
        type: "bar",
        data: { labels: ["00:00","04:00","08:00","12:00","16:00","20:00"], datasets: [{ label: "Services", data: [12,8,34,40,38,22], backgroundColor: brand.blue, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const dist = document.getElementById("dashDistChart");
    if (dist) new Chart(dist.getContext("2d"), {
        type: "doughnut",
        data: { labels: ["Laboratory","Radiology","Pharmacy","Surgery","Nutrition"], datasets: [{ data: [612,128,156,14,64], backgroundColor: [brand.blue, brand.teal, brand.green, brand.amber, brand.red], borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
    const weekly = document.getElementById("dashWeeklyChart");
    if (weekly) new Chart(weekly.getContext("2d"), {
        type: "line",
        data: { labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets: [{ label: "Lab", data: [210,240,225,260,280,150,119], borderColor: brand.blue, backgroundColor: "rgba(37,99,235,0.12)", fill: true, tension: 0.4 }, { label: "Radiology", data: [86,92,88,95,101,60,55], borderColor: brand.teal, backgroundColor: "rgba(20,184,166,0.12)", fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
    const monthly = document.getElementById("dashMonthlyChart");
    if (monthly) new Chart(monthly.getContext("2d"), {
        type: "line",
        data: { labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul"], datasets: [{ label: "Patients", data: [3200,3400,3600,3800,4000,4200,4300], borderColor: brand.green, backgroundColor: "rgba(6,95,70,0.12)", fill: true, tension: 0.4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
    const util = document.getElementById("dashUtilChart");
    if (util) new Chart(util.getContext("2d"), {
        type: "bar",
        data: { labels: ["Laboratory","Radiology","Pharmacy","Surgery","Nutrition"], datasets: [{ label: "Utilization %", data: [78,65,82,55,60], backgroundColor: [brand.blue, brand.teal, brand.green, brand.amber, brand.red], borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
    });
}

/* =======================================================
   INIT
   ======================================================= */
document.addEventListener("DOMContentLoaded", function () {
    dashSetupSidebar();
    dashSetupClock();
    dashSetupNotifications();
    dashSetupRefresh();
    dashInitCharts();
    setTimeout(function () { const s = document.getElementById("dashSpinner"); if (s) s.classList.remove("show"); }, 600);
});
