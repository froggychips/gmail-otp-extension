const gmailStatusEl = document.getElementById("gmailStatus");
const gmailConnectBtn = document.getElementById("gmailConnect");
const gmailDisconnectBtn = document.getElementById("gmailDisconnect");
const gmailQueryEl = document.getElementById("gmailQuery");
const gmailUnreadOnlyEl = document.getElementById("gmailUnreadOnly");
const gmailFetchCodeBtn = document.getElementById("gmailFetchCode");
const gmailCodeEl = document.getElementById("gmailCode");
const gmailMetaEl = document.getElementById("gmailMeta");
const statusEl = document.getElementById("status");
const lastCheckEl = document.getElementById("lastCheck");
const unmatchedListEl = document.getElementById("unmatchedList");
const unmatchedClearBtn = document.getElementById("unmatchedClear");
const historyListEl = document.getElementById("historyList");
const undoActionBtn = document.getElementById("undoAction");
const gmailThresholdEl = document.getElementById("gmailThreshold");
const thresholdValEl = document.getElementById("thresholdVal");
const exportDataBtn = document.getElementById("exportData");
const importDataBtn = document.getElementById("importData");
const modeAutoBtn = document.getElementById("modeAuto");
const modeManualBtn = document.getElementById("modeManual");
const modeHintEl = document.getElementById("modeHint");
const logsListEl = document.getElementById("logsList");
const refreshLogsBtn = document.getElementById("refreshLogs");
const clearLogsBtn = document.getElementById("clearLogs");
const tabBtns = document.querySelectorAll(".tab-btn[data-tab]");
const tabContents = document.querySelectorAll(".tabs-content");
const toggleAdvancedBtn = document.getElementById("toggleAdvanced");
const advancedSection = document.getElementById("advancedSection");

const I18N = {
  ru: {
    code: "Код", history: "История", filters: "Фильтры", tools: "Инструменты",
    idle: "Готово", searching: "Поиск...", found: "Код найден", notFound: "Кодов нет",
    searchError: "Ошибка API", connectInProgress: "Вход...", connectError: "Ошибка входа",
    connectOk: "Успешно", connectNeeded: "Вход...", disconnectInProgress: "Выход...",
    disconnectOk: "Отключено", disconnectError: "Ошибка выхода", copied: "Скопировано",
    copyError: "Ошибка буфера", loadError: "Ошибка загрузки", undoOk: "Отменено",
    exportOk: "Сохранено", importOk: "Импортировано", importError: "Ошибка файла",
    logsCleared: "Очищено", lastFound: "Последний найденный код", account: "Аккаунт",
    connected: "Подключено", notConnected: "Не подключено", connect: "Подключить",
    disconnect: "Отключить", mode: "Режим работы", auto: "Авто", manual: "Ручной",
    autoDesc: "Авто: проверка раз в минуту.", manualDesc: "Ручной: только при нажатии.",
    manualSearch: "Найти код вручную", historyTitle: "Последние 10 кодов",
    empty: "Список пуст", searchSettings: "Настройки поиска", unreadOnly: "Искать только в непрочитанных",
    unreadDesc: "Рекомендуется: так быстрее и точнее.", advanced: "Продвинутые настройки",
    rawQuery: "Запрос Gmail (Query)", recognition: "Алгоритм распознавания",
    sensitivity: "Чувствительность", sensDesc: "Низкая — ловит всё подряд.<br>Высокая — только 100% коды.",
    logs: "Логи системы", refresh: "Обновить", clear: "Очистить",
    unmatched: "Неопознанные письма", undo: "Отменить", data: "Данные",
    export: "Экспорт", import: "Импорт", from: "От", subject: "Тема", date: "Дата",
    noSubject: "(без темы)", markCode: "Это код", markNoCode: "Не код"
  },
  en: {
    code: "Code", history: "History", filters: "Filters", tools: "Tools",
    idle: "Ready", searching: "Searching...", found: "Code found", notFound: "No codes",
    searchError: "API Error", connectInProgress: "Connecting...", connectError: "Login error",
    connectOk: "Success", connectNeeded: "Login...", disconnectInProgress: "Disconnecting...",
    disconnectOk: "Disconnected", disconnectError: "Logout error", copied: "Copied",
    copyError: "Buffer error", loadError: "Load error", undoOk: "Undone",
    exportOk: "Saved", importOk: "Imported", importError: "File error",
    logsCleared: "Cleared", lastFound: "Last found code", account: "Account",
    connected: "Connected", notConnected: "Not connected", connect: "Connect",
    disconnect: "Disconnect", mode: "Work Mode", auto: "Auto", manual: "Manual",
    autoDesc: "Auto: checks every minute.", manualDesc: "Manual: checks on click.",
    manualSearch: "Search manually", historyTitle: "Last 10 codes",
    empty: "List is empty", searchSettings: "Search Settings", unreadOnly: "Search unread only",
    unreadDesc: "Recommended: faster and more accurate.", advanced: "Advanced settings",
    rawQuery: "Gmail Query", recognition: "Recognition Algorithm",
    sensitivity: "Sensitivity", sensDesc: "Low — catches everything.<br>High — only 100% codes.",
    logs: "System Logs", refresh: "Refresh", clear: "Clear",
    unmatched: "Unmatched emails", undo: "Undo", data: "Data",
    export: "Export", import: "Import", from: "From", subject: "Subject", date: "Date",
    noSubject: "(no subject)", markCode: "It's a code", markNoCode: "Not a code"
  },
  de: {
    code: "Code", history: "Verlauf", filters: "Filter", tools: "Tools",
    idle: "Bereit", searching: "Suche...", found: "Code gefunden", notFound: "Keine Codes",
    searchError: "API-Fehler", lastFound: "Zuletzt gefundener Code", account: "Konto",
    connect: "Verbinden", disconnect: "Abmelden", mode: "Modus", auto: "Auto", manual: "Manuell"
  },
  fr: {
    code: "Code", history: "Historique", filters: "Filtres", tools: "Outils",
    idle: "Prêt", searching: "Recherche...", found: "Code trouvé", notFound: "Aucun code",
    searchError: "Erreur API", lastFound: "Dernier code trouvé", account: "Compte",
    connect: "Connecter", disconnect: "Déconnecter", mode: "Mode", auto: "Auto", manual: "Manuel"
  },
  es: {
    code: "Código", history: "Historial", filters: "Filtros", tools: "Herramientas",
    idle: "Listo", searching: "Buscando...", found: "Código encontrado", notFound: "Sin códigos",
    searchError: "Error de API", lastFound: "Último código encontrado", account: "Cuenta",
    connect: "Conectar", disconnect: "Desconectar", mode: "Modo", auto: "Auto", manual: "Manual"
  }
};

const userLang = (navigator.language || "en").split("-")[0];
const T = I18N[userLang] || I18N.en;

const TEXT = {
  idle: T.idle,
  searching: T.searching,
  found: T.found,
  notFound: T.notFound,
  searchError: T.searchError,
  connectInProgress: T.connectInProgress,
  connectError: T.connectError,
  connectOk: T.connectOk,
  connectNeeded: T.connectNeeded,
  disconnectInProgress: T.disconnectInProgress,
  disconnectOk: T.disconnectOk,
  disconnectError: T.disconnectError,
  copied: T.copied,
  copyError: T.copyError,
  loadError: T.loadError,
  undoOk: T.undoOk,
  exportOk: T.exportOk,
  importOk: T.importOk,
  importError: T.importError,
  logsCleared: T.logsCleared
};

function translateUI() {
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    if (T[key]) {
      if (el.tagName === "INPUT" && el.type === "placeholder") {
         el.placeholder = T[key];
      } else {
         el.innerHTML = T[key];
      }
    }
  });
}

// Tab Switching
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.getAttribute("data-tab");
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add("active");
    if (tabId === "history") renderHistory();
    if (tabId === "tools") {
      renderLogs();
      renderUnmatchedList();
    }
  });
});

// Advanced Toggle
if (toggleAdvancedBtn) {
  toggleAdvancedBtn.addEventListener("click", () => {
    const isHidden = advancedSection.style.display === "none";
    advancedSection.style.display = isHidden ? "block" : "none";
    toggleAdvancedBtn.querySelector("span").textContent = isHidden ? "▼ Продвинутые настройки" : "▶ Продвинутые настройки";
  });
}

let gmailEntry = null;
let gmailEmail = "";
let gmailQuery = "";
let gmailUnreadOnly = false;
let gmailQueryTimer = null;
let unmatchedMessages = [];
let senderAllowlist = [];
let senderBlocklist = [];
let gmailHistory = [];
let gmailThreshold = 3;
let lastAction = null;
let gmailMode = "auto";

function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (data) => resolve(data || {}));
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve());
  });
}

async function renderLogs() {
  if (!logsListEl) return;
  try {
    const response = await chrome.runtime.sendMessage({ type: "GMAIL_GET_LOGS" });
    const logs = response && Array.isArray(response.logs) ? response.logs : [];
    if (!logs.length) {
      logsListEl.textContent = "—";
      return;
    }
    logsListEl.innerHTML = logs.map(entry => {
      const time = new Date(entry.ts).toLocaleTimeString();
      const msg = entry.msg.map(m => {
        if (typeof m === 'object' && m.message) return `${m.message}`;
        return JSON.stringify(m);
      }).join(" ");
      return `<div class="log-entry"><span class="log-ts">[${time}]</span> ${msg}</div>`;
    }).join("");
  } catch (e) {
    logsListEl.textContent = "Ошибка получения логов: " + String(e);
  }
}

function normalizeGmailQuery(value) {
  const trimmed = String(value || "").trim();
  return trimmed;
}

function formatGmailMeta(entry) {
  if (!entry) return "—";
  const from = entry.from ? String(entry.from).trim() : "";
  const date = entry.date ? String(entry.date).trim() : "";
  return from ? `${T.from}: ${from} • ${T.date}: ${date}` : date;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text || TEXT.idle;
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderGmailPanel() {
  if (gmailStatusEl) gmailStatusEl.textContent = gmailEmail || T.notConnected;
  if (gmailCodeEl) gmailCodeEl.textContent = gmailEntry && gmailEntry.code ? gmailEntry.code : "—";
  if (gmailMetaEl) gmailMetaEl.textContent = formatGmailMeta(gmailEntry);
  if (gmailDisconnectBtn) gmailDisconnectBtn.disabled = !gmailEmail;
  if (gmailFetchCodeBtn) gmailFetchCodeBtn.disabled = !gmailEmail;
  if (gmailUnreadOnlyEl) gmailUnreadOnlyEl.checked = !!gmailUnreadOnly;
  if (undoActionBtn) undoActionBtn.disabled = !lastAction;
  if (gmailThresholdEl) gmailThresholdEl.value = gmailThreshold;
  if (thresholdValEl) thresholdValEl.textContent = gmailThreshold;
  
  if (modeAutoBtn && modeManualBtn) {
    modeAutoBtn.classList.toggle("active", gmailMode === "auto");
    modeManualBtn.classList.toggle("active", gmailMode === "manual");
    modeAutoBtn.disabled = !gmailEmail;
    modeManualBtn.disabled = !gmailEmail;
    if (modeHintEl) {
      modeHintEl.textContent = gmailMode === "auto" ? T.autoDesc : T.manualDesc;
    }
  }

  const hero = document.getElementById("gmailCodeWrapper");
  if (hero) {
    if (gmailEntry && gmailEntry.code) {
      hero.style.background = "linear-gradient(135deg, #2563eb, #3b82f6)";
      hero.style.color = "white";
    } else {
      hero.style.background = "var(--bg-secondary)";
      hero.style.color = "var(--text-secondary)";
    }
  }
}

function renderHistory() {
  if (!historyListEl) return;
  if (!gmailHistory || !gmailHistory.length) {
    historyListEl.innerHTML = `<div class="list-item">${T.empty}</div>`;
    return;
  }
  historyListEl.innerHTML = "";
  gmailHistory.forEach((item) => {
    const el = document.createElement("div");
    el.className = "list-item history-item";
    el.innerHTML = `
      <div class="history-info">
        <div class="history-title">${item.subject || T.noSubject}</div>
        <div class="history-sub">${item.from} • ${item.date}</div>
      </div>
      <div class="history-val">${item.code}</div>
    `;
    el.addEventListener("click", () => {
      navigator.clipboard.writeText(item.code);
      setStatus(TEXT.copied);
    });
    historyListEl.appendChild(el);
  });
}

async function fetchLatestGmailCode({ silent = false } = {}) {
  const query = normalizeGmailQuery(gmailQueryEl ? gmailQueryEl.value : "");
  if (!silent) setStatus(TEXT.searching);
  if (gmailFetchCodeBtn) gmailFetchCodeBtn.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: "GMAIL_FETCH_LAST_CODE", query });
    if (response && response.ok) {
      gmailEntry = response.code || null;
      renderGmailPanel();
      const stored = await storageGet(["gmailUnmatched", "gmailHistory", "gmailLastCheckTime"]);
      unmatchedMessages = Array.isArray(stored.gmailUnmatched) ? stored.gmailUnmatched : [];
      gmailHistory = Array.isArray(stored.gmailHistory) ? stored.gmailHistory : [];
      if (lastCheckEl) lastCheckEl.textContent = formatTime(stored.gmailLastCheckTime);
      if (!silent) setStatus(gmailEntry ? TEXT.found : TEXT.notFound);
    } else {
      if (!silent) setStatus(TEXT.searchError);
    }
  } catch {
    if (!silent) setStatus(TEXT.searchError);
  } finally {
    if (gmailFetchCodeBtn) gmailFetchCodeBtn.disabled = !gmailEmail;
  }
}

function renderUnmatchedList() {
  if (!unmatchedListEl) return;
  if (!unmatchedMessages.length) {
    unmatchedListEl.textContent = "—";
    return;
  }
  unmatchedListEl.innerHTML = "";
  unmatchedMessages.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "unmatched-item";

    const title = document.createElement("div");
    title.className = "unmatched-title";
    title.textContent = item.subject || T.noSubject;

    const meta = document.createElement("div");
    meta.className = "unmatched-meta";
    const from = item.from ? String(item.from).trim() : "";
    const date = item.date ? String(item.date).trim() : "";
    meta.textContent = [from, date].filter(Boolean).join(" • ") || "—";

    const actions = document.createElement("div");
    actions.className = "unmatched-actions";

    const markCode = document.createElement("button");
    markCode.className = "secondary";
    markCode.textContent = T.markCode;
    markCode.addEventListener("click", () => {
      markUnmatched(item, true);
    });

    const markNoCode = document.createElement("button");
    markNoCode.className = "ghost";
    markNoCode.textContent = T.markNoCode;
    markNoCode.addEventListener("click", () => {
      markUnmatched(item, false);
    });

    actions.appendChild(markCode);
    actions.appendChild(markNoCode);
    wrapper.appendChild(title);
    wrapper.appendChild(meta);
    wrapper.appendChild(actions);
    unmatchedListEl.appendChild(wrapper);
  });
}

async function init() {
  const stored = await storageGet([
    "gmailQuery", "gmailUnreadOnly", "gmailLastEntry", "gmailEmail",
    "gmailUnmatched", "gmailSenderAllowlist", "gmailSenderBlocklist",
    "gmailHistory", "gmailLastCheckTime", "gmailThreshold", "gmailMode"
  ]);
  gmailQuery = stored.gmailQuery || "newer_than:1h subject:(code OR verification OR подтверждение OR код)";
  gmailUnreadOnly = !!stored.unreadOnly;
  gmailEntry = stored.gmailLastEntry || null;
  gmailEmail = stored.gmailEmail || "";
  unmatchedMessages = Array.isArray(stored.gmailUnmatched) ? stored.gmailUnmatched : [];
  senderAllowlist = Array.isArray(stored.gmailSenderAllowlist) ? stored.gmailSenderAllowlist : [];
  senderBlocklist = Array.isArray(stored.gmailSenderBlocklist) ? stored.gmailSenderBlocklist : [];
  gmailHistory = Array.isArray(stored.gmailHistory) ? stored.gmailHistory : [];
  gmailThreshold = typeof stored.gmailThreshold === "number" ? stored.gmailThreshold : 3;
  gmailMode = stored.gmailMode || "auto";
  
  if (gmailQueryEl) gmailQueryEl.value = gmailQuery;
  if (lastCheckEl) lastCheckEl.textContent = formatTime(stored.gmailLastCheckTime);
  
  translateUI();
  renderGmailPanel();
  setStatus(gmailEmail ? TEXT.idle : TEXT.connectNeeded);
  if (gmailEmail) fetchLatestGmailCode({ silent: true });
}

// Event Listeners
if (gmailThresholdEl) {
  gmailThresholdEl.addEventListener("input", () => {
    gmailThreshold = parseInt(gmailThresholdEl.value, 10);
    thresholdValEl.textContent = gmailThreshold;
  });
  gmailThresholdEl.addEventListener("change", () => {
    storageSet({ gmailThreshold });
    fetchLatestGmailCode(); // Auto-search on change
  });
}

if (gmailQueryEl) {
  gmailQueryEl.addEventListener("input", () => {
    if (gmailQueryTimer) clearTimeout(gmailQueryTimer);
    gmailQueryTimer = setTimeout(() => {
      gmailQuery = normalizeGmailQuery(gmailQueryEl.value);
      storageSet({ gmailQuery });
      fetchLatestGmailCode({ silent: true });
    }, 500);
  });
}

if (gmailUnreadOnlyEl) {
  gmailUnreadOnlyEl.addEventListener("change", () => {
    gmailUnreadOnly = !!gmailUnreadOnlyEl.checked;
    storageSet({ gmailUnreadOnly });
    fetchLatestGmailCode();
  });
}

if (gmailConnectBtn) {
  gmailConnectBtn.addEventListener("click", async () => {
    gmailConnectBtn.disabled = true;
    setStatus(TEXT.connectInProgress);
    const response = await chrome.runtime.sendMessage({ type: "GMAIL_CONNECT" });
    if (response && response.ok) {
      gmailEmail = response.email || "";
      await storageSet({ gmailEmail });
      setStatus(gmailEmail ? TEXT.connectOk : TEXT.connectNeeded);
      fetchLatestGmailCode();
    } else {
      setStatus(TEXT.connectError);
    }
    gmailConnectBtn.disabled = false;
    renderGmailPanel();
  });
}

if (gmailDisconnectBtn) {
  gmailDisconnectBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "GMAIL_DISCONNECT" });
    gmailEmail = "";
    gmailEntry = null;
    await storageSet({ gmailEmail: "", gmailLastEntry: null });
    setStatus(TEXT.disconnectOk);
    renderGmailPanel();
  });
}

if (gmailFetchCodeBtn) {
  gmailFetchCodeBtn.addEventListener("click", () => fetchLatestGmailCode());
}

if (modeAutoBtn) {
  modeAutoBtn.addEventListener("click", async () => {
    gmailMode = "auto";
    await chrome.runtime.sendMessage({ type: "GMAIL_MODE_AUTO" });
    renderGmailPanel();
  });
}

if (modeManualBtn) {
  modeManualBtn.addEventListener("click", async () => {
    gmailMode = "manual";
    await chrome.runtime.sendMessage({ type: "GMAIL_MODE_MANUAL" });
    renderGmailPanel();
  });
}

const hero = document.getElementById("gmailCodeWrapper");
if (hero) {
  hero.addEventListener("click", async () => {
    const code = gmailEntry && gmailEntry.code ? String(gmailEntry.code).trim() : "";
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setStatus(TEXT.copied);
    hero.style.opacity = "0.7";
    setTimeout(() => hero.style.opacity = "1", 100);
  });
}

if (refreshLogsBtn) refreshLogsBtn.addEventListener("click", () => renderLogs());
if (clearLogsBtn) {
  clearLogsBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "GMAIL_CLEAR_LOGS" });
    renderLogs();
  });
}

init().catch(() => setStatus(TEXT.loadError));
