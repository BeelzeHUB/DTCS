/* =======================================================
   DTCS - Virtual MediSense AI Controller
   Clinical Decision Support Assistant (Google Gemini API)
   ======================================================= */

const MS_SYSTEM = "You are MediSense AI, an intelligent clinical decision support assistant inside a Hospital Information System (HIS). " +
    "You help clinical staff with: (1) Symptom Assessment - structuring chief complaints and suggesting clinical pathways; " +
    "(2) Diagnostic Assistance - recommending differential diagnoses and relevant tests; " +
    "(3) Treatment Recommendation - proposing evidence-informed treatment plans; " +
    "(4) Clinical Service Support - coordinating referrals, consults, and care workflows; " +
    "(5) AI Chat Assistant - answering clinical queries conversationally; " +
    "(6) Medical Knowledge Assistance - retrieving general medical explanations and references; " +
    "(7) Clinical Decision Support - surfacing decision aids at the point of care; " +
    "(8) Patient Inquiry Support - answering patient education questions safely. " +
    "Always be concise, structured, and professional. Clearly label every answer as advisory only, " +
    "state that licensed professionals retain full authority over clinical decisions, and never claim to replace a clinician. " +
    "Do not provide a definitive diagnosis; provide differential considerations and suggest appropriate next steps/tests.";

function msToast(title, message, type) {
    type = type || "success";
    const wrap = document.getElementById("msToastWrap");
    if (!wrap) return;
    const icons = { success: "bi-check-circle-fill", error: "bi-x-circle-fill", info: "bi-info-circle-fill", warning: "bi-exclamation-triangle-fill" };
    const el = document.createElement("div");
    el.className = "lis-toast " + type;
    el.innerHTML = '<i class="bi ' + (icons[type] || icons.info) + ' lis-toast-icon"></i>' +
        '<div class="lis-toast-body"><p class="lis-toast-title">' + title + '</p><p class="lis-toast-msg">' + message + '</p></div>' +
        '<button class="lis-toast-close" aria-label="Dismiss"><i class="bi bi-x"></i></button>';
    wrap.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    const remove = function () { el.classList.remove("show"); setTimeout(function () { el.remove(); }, 350); };
    el.querySelector(".lis-toast-close").addEventListener("click", remove);
    setTimeout(remove, 4000);
}

function msSetupSidebar() {
    const toggle = document.getElementById("sidebarToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
        const hidden = document.body.classList.toggle("sidebar-hidden");
        toggle.setAttribute("aria-label", hidden ? "Show sidebar" : "Hide sidebar");
    });
}

function msGetKey() {
    return localStorage.getItem("ms_gemini_key") || "";
}
function msSetKey(k) {
    if (k) localStorage.setItem("ms_gemini_key", k);
}

function msAddMessage(role, text, isHtml) {
    const chat = document.getElementById("msChat");
    const msg = document.createElement("div");
    msg.className = "ms-msg " + (role === "user" ? "user" : "bot");
    const bubble = document.createElement("div");
    bubble.className = "ms-bubble";
    if (isHtml) bubble.innerHTML = text; else bubble.textContent = text;
    msg.appendChild(bubble);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
    return bubble;
}

function msShowTyping() {
    const chat = document.getElementById("msChat");
    const msg = document.createElement("div");
    msg.className = "ms-msg bot";
    msg.id = "msTyping";
    msg.innerHTML = '<div class="ms-bubble"><span class="ms-typing"><span></span><span></span><span></span></span></div>';
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}
function msRemoveTyping() {
    const t = document.getElementById("msTyping");
    if (t) t.remove();
}

let msHistory = [];
function msCallGemini(userText) {
    const key = msGetKey();
    if (!key) {
        msAddMessage("bot", "Please paste your Google Gemini API key in the field below to enable MediSense AI responses. " +
            "Get one at https://aistudio.google.com/app/apikey", true);
        return;
    }
    msShowTyping();
    const payload = {
        contents: [{ role: "user", parts: [{ text: MS_SYSTEM + "\n\nUser: " + userText }] }],
        systemInstruction: { parts: [{ text: MS_SYSTEM }] },
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
    };
    fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(key), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            msRemoveTyping();
            let text = "";
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
                text = data.candidates[0].content.parts.map(function (p) { return p.text; }).join("");
            } else if (data.error) {
                text = "Error: " + (data.error.message || "Gemini request failed.");
            } else {
                text = "Sorry, I could not generate a response. Please try again.";
            }
            text = text.trim() + "\n\nAdvisory only — licensed professionals retain full authority over clinical decisions.";
            msAddMessage("bot", text, false);
            msHistory.push({ user: userText, ai: text });
        })
        .catch(function (err) {
            msRemoveTyping();
            msAddMessage("bot", "Connection error: " + err.message + ". Check your API key and network.", false);
        });
}

function msSend() {
    const input = document.getElementById("msInput");
    const text = input.value.trim();
    if (!text) return;
    msAddMessage("user", text, false);
    input.value = "";
    msCallGemini(text);
}

document.addEventListener("DOMContentLoaded", function () {
    msSetupSidebar();

    const keyInput = document.getElementById("msApiKey");
    const saved = msGetKey();
    if (saved) { keyInput.value = saved; document.getElementById("msKeySaved").classList.remove("d-none"); }

    keyInput.addEventListener("change", function () {
        msSetKey(keyInput.value.trim());
        document.getElementById("msKeySaved").classList.remove("d-none");
    });

    document.getElementById("msSend").addEventListener("click", msSend);
    document.getElementById("msInput").addEventListener("keydown", function (e) {
        if (e.key === "Enter") msSend();
    });

    document.querySelectorAll("#msQuick .ms-quick").forEach(function (b) {
        b.addEventListener("click", function () {
            const q = b.dataset.q;
            document.getElementById("msInput").value = q;
            msSend();
        });
    });

    document.getElementById("msClearChat").addEventListener("click", function () {
        const chat = document.getElementById("msChat");
        chat.innerHTML = '<div class="ms-msg bot"><div class="ms-bubble">Conversation cleared. How can I help you? <span class="ms-advisory">Advisory only.</span></div></div>';
        msHistory = [];
    });

    const notif = document.getElementById("msNotifBtn");
    if (notif) notif.addEventListener("click", function () { msToast("Notifications", "You have 3 unread clinical alerts.", "info"); });

    setTimeout(function () { const s = document.getElementById("msSpinner"); if (s) s.classList.remove("show"); }, 500);
});
