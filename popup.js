const gmailConnectBtn = document.getElementById("gmailConnect");
const gmailQueryEl = document.getElementById("gmailQuery");
const gmailUnreadOnlyEl = document.getElementById("gmailUnreadOnly");
const gmailFetchCodeBtn = document.getElementById("gmailFetchCode");
const gmailCodeEl = document.getElementById("gmailCode");
const gmailMetaEl = document.getElementById("gmailMeta");
const statusEl = document.getElementById("status");
const lastCheckTimeEl = document.getElementById("lastCheckTime");
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
const accountToggleBtn = document.getElementById("accountToggle");
const accountDropdown = document.getElementById("accountDropdown");
const accountListEl = document.getElementById("accountList");

const I18N = {
  ru: {
    code: "Код", history: "История", filters: "Фильтры", tools: "Инструменты",
    idle: "Готово", searching: "Поиск...", found: "Код найден", notFound: "Кодов нет",
    searchError: "Ошибка API", connectInProgress: "Вход...", connectError: "Ошибка входа",
    connectOk: "Успешно", connectNeeded: "Вход...", disconnectInProgress: "Выход...",
    disconnectOk: "Отключено", disconnectError: "Ошибка выхода", copied: "Скопировано",
    copyError: "Ошибка буфера", loadError: "Ошибка загрузки", undoOk: "Отменено",
    exportOk: "Сохранено", importOk: "Импортировано", importError: "Ошибка файла",
    logsCleared: "Очищено", lastFound: "Последний найденный код", account: "Аккаунты",
    connected: "Подключено", notConnected: "Не подключено", connect: "Добавить аккаунт",
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
    noSubject: "(без темы)", markCode: "Это код", markNoCode: "Не код",
    profileNote: "Используется аккаунт профиля Chrome", maxAccounts: "Достигнут лимит (3 аккаунта)",
    justChecked: "Только что проверено", checkedAgo: " мин назад", lastChecked: "Последняя проверка: "
  },
  en: {
    code: "Code", history: "History", filters: "Filters", tools: "Tools",
    idle: "Ready", searching: "Searching...", found: "Code found", notFound: "No codes",
    searchError: "API Error", connectInProgress: "Connecting...", connectError: "Login error",
    connectOk: "Success", connectNeeded: "Login...", disconnectInProgress: "Disconnecting...",
    disconnectOk: "Disconnected", disconnectError: "Logout error", copied: "Copied",
    copyError: "Buffer error", loadError: "Load error", undoOk: "Undone",
    exportOk: "Saved", importOk: "Imported", importError: "File error",
    logsCleared: "Cleared", lastFound: "Last found code", account: "Accounts",
    connected: "Connected", notConnected: "Not connected", connect: "Add Account",
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
    noSubject: "(no subject)", markCode: "It's a code", markNoCode: "Not a code",
    profileNote: "Uses your Chrome Profile account", maxAccounts: "Limit reached (3 accounts)",
    justChecked: "Just checked", checkedAgo: " min ago", lastChecked: "Last checked: "
  }
};

const userLang = (navigator.language || "en").split("-")[0];
const T = { ...I18N.en, ...(I18N[userLang] || {}) };

const TEXT = T;

function translateUI() {
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    if (T[key]) {
      if (el.tagName === "INPUT" && el.placeholder !== undefined) el.placeholder = T[key];
      else el.innerHTML = T[key];
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
    toggleAdvancedBtn.querySelector("span").textContent = isHidden ? "▼ " + T.advanced : "▶ " + T.advanced;
  });
}

// Account Toggle
if (accountToggleBtn) {
  accountToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    accountDropdown.classList.toggle("show");
    accountToggleBtn.classList.toggle("active");
  });
}

// Close dropdown on click outside
document.addEventListener("click", () => {
  if (accountDropdown) accountDropdown.classList.remove("show");
  if (accountToggleBtn) accountToggleBtn.classList.remove("active");
});

if (accountDropdown) {
  accountDropdown.addEventListener("click", (e) => e.stopPropagation());
}

let gmailEntry = null;
let gmailAccounts = [];
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
const MAX_ACCOUNTS = 3;

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, (data) => resolve(data || {})));
}

function storageSet(values) {
  return new Promise((resolve) => chrome.storage.local.set(values, () => resolve()));
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
    logsListEl.textContent = T.loadError + ": " + String(e);
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

function renderAccountList() {
  if (!accountListEl) return;
  accountListEl.innerHTML = "";
  if (!gmailAccounts.length) {
    const el = document.createElement("div");
    el.className = "hint";
    el.textContent = T.notConnected;
    accountListEl.appendChild(el);
  } else {
    gmailAccounts.forEach(account => {
      const el = document.createElement("div");
      el.className = "account-item";
      el.innerHTML = `
        <span class="account-email">${account.email}</span>
        <button class="remove-account" data-email="${account.email}" title="${T.disconnect}">×</button>
      `;
      accountListEl.appendChild(el);
    });
  }

  document.querySelectorAll(".remove-account").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const email = e.target.getAttribute("data-email");
      const response = await chrome.runtime.sendMessage({ type: "GMAIL_DISCONNECT", email });
      if(response && response.accounts) {
        gmailAccounts = response.accounts;
        renderAccountList();
        renderGmailPanel();
      }
    });
  });

  gmailConnectBtn.disabled = gmailAccounts.length >= MAX_ACCOUNTS;
  if(gmailAccounts.length >= MAX_ACCOUNTS) {
    gmailConnectBtn.textContent = T.maxAccounts;
  } else {
    gmailConnectBtn.textContent = T.connect;
  }
}

function renderGmailPanel() {
  const hasAccounts = gmailAccounts.length > 0;
  if (gmailCodeEl) gmailCodeEl.textContent = gmailEntry && gmailEntry.code ? gmailEntry.code : "—";
  if (gmailMetaEl) {
    let metaText = formatGmailMeta(gmailEntry);
    if(gmailEntry && gmailEntry.account) {
      metaText += ` (${gmailEntry.account})`
    }
    gmailMetaEl.textContent = metaText;
  }
  if (gmailFetchCodeBtn) gmailFetchCodeBtn.disabled = !hasAccounts;
  if (gmailUnreadOnlyEl) gmailUnreadOnlyEl.checked = !!gmailUnreadOnly;
  if (undoActionBtn) undoActionBtn.disabled = !lastAction;
  if (gmailThresholdEl) gmailThresholdEl.value = gmailThreshold;
  if (thresholdValEl) thresholdValEl.textContent = gmailThreshold;
  
  if (accountToggleBtn) accountToggleBtn.classList.toggle("connected", hasAccounts);

  if (modeAutoBtn && modeManualBtn) {
    modeAutoBtn.classList.toggle("active", gmailMode === "auto");
    modeManualBtn.classList.toggle("active", gmailMode === "manual");
    modeAutoBtn.disabled = !hasAccounts;
    modeManualBtn.disabled = !hasAccounts;
    if (modeHintEl) modeHintEl.textContent = gmailMode === "auto" ? T.autoDesc : T.manualDesc;
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

function updateLastCheckTime() {
  chrome.storage.local.get("gmailLastCheckTime", (data) => {
    if (!lastCheckTimeEl) return;
    const ts = data.gmailLastCheckTime;
    if (!ts) {
      lastCheckTimeEl.textContent = "";
      return;
    }
    const minutes = Math.floor((Date.now() - ts) / 60000);
    lastCheckTimeEl.textContent = minutes === 0 
      ? T.justChecked 
      : `${T.lastChecked}${minutes}${T.checkedAgo}`;
  });
}

async function fetchLatestGmailCode({ silent = false } = {}) {
  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = true;
    gmailFetchCodeBtn.innerHTML = `🔄 <span>${T.searching || "Searching..."}</span>`;
  }
  if (!silent) {
    setStatus(TEXT.searching);
    if (gmailCodeEl) gmailCodeEl.textContent = "⋯";
  }

  const response = await chrome.runtime.sendMessage({ 
    type: "GMAIL_FETCH_LAST_CODE", 
    query: gmailQueryEl ? gmailQueryEl.value : "" 
  });

  if (response && response.ok) {
    gmailEntry = response.code || null;
    if (!silent) setStatus(gmailEntry ? T.found : T.notFound);
  } else {
    if (!silent) setStatus(T.searchError);
  }

  renderGmailPanel();

  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = gmailAccounts.length === 0;
    gmailFetchCodeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <span data-t="manualSearch">${T.manualSearch}</span>
    `;
  }
}

function saveQueryDebounced() {
  clearTimeout(gmailQueryTimer);
  gmailQueryTimer = setTimeout(async () => {
    gmailQuery = gmailQueryEl.value.trim();
    await storageSet({ gmailQuery });
    if (gmailAccounts.length > 0) fetchLatestGmailCode({ silent: true });
  }, 800);
}

async function init() {
  const stored = await storageGet([
    "gmailAccounts", "gmailQuery", "gmailUnreadOnly", "gmailLastEntry",
    "gmailUnmatched", "gmailSenderAllowlist", "gmailSenderBlocklist",
    "gmailHistory", "gmailLastCheckTime", "gmailThreshold", "gmailMode"
  ]);
  gmailAccounts = stored.gmailAccounts || [];
  gmailQuery = stored.gmailQuery || "newer_than:1h subject:(code OR verification OR подтверждение OR код)";
  gmailUnreadOnly = !!stored.gmailUnreadOnly;
  gmailEntry = stored.gmailLastEntry || null;
  unmatchedMessages = stored.gmailUnmatched || [];
  senderAllowlist = stored.gmailSenderAllowlist || [];
  senderBlocklist = stored.gmailSenderBlocklist || [];
  gmailHistory = stored.gmailHistory || [];
  gmailThreshold = stored.gmailThreshold || 3;
  gmailMode = stored.gmailMode || "auto";
  
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
    gmailQueryEl.addEventListener("input", saveQueryDebounced);
  }
  if (lastCheckEl) lastCheckEl.textContent = formatTime(stored.gmailLastCheckTime);
  
  translateUI();
  renderAccountList();
  renderGmailPanel();
  updateLastCheckTime();
  setInterval(updateLastCheckTime, 30000);
  setStatus(gmailAccounts.length > 0 ? TEXT.idle : TEXT.connectNeeded);
  if (gmailAccounts.length > 0) fetchLatestGmailCode({ silent: true });
}

if (gmailConnectBtn) {
  gmailConnectBtn.addEventListener("click", async () => {
    gmailConnectBtn.disabled = true;
    setStatus(TEXT.connectInProgress);
    const response = await chrome.runtime.sendMessage({ type: "GMAIL_CONNECT" });
    if (response && response.ok) {
      gmailAccounts = response.accounts;
      setStatus(TEXT.connectOk);
      renderAccountList();
      renderGmailPanel();
      fetchLatestGmailCode();
    } else {
      setStatus(response.error || TEXT.connectError);
    }
    gmailConnectBtn.disabled = gmailAccounts.length >= MAX_ACCOUNTS;
  });
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
    meta.textContent = `${item.from} • ${item.date}`;
    const actions = document.createElement("div");
    actions.className = "unmatched-actions";
    const markCode = document.createElement("button");
    markCode.className = "secondary";
    markCode.textContent = T.markCode;
    markCode.addEventListener("click", () => markUnmatched(item, true));
    const markNoCode = document.createElement("button");
    markNoCode.className = "ghost";
    markNoCode.textContent = T.markNoCode;
    markNoCode.addEventListener("click", () => markUnmatched(item, false));
    actions.appendChild(markCode);
    actions.appendChild(markNoCode);
    wrapper.appendChild(title);
    wrapper.appendChild(meta);
    wrapper.appendChild(actions);
    unmatchedListEl.appendChild(wrapper);
  });
}

function extractEmailAddress(from) {
  if (!from) return "";
  const match = String(from).match(/<([^>]+)>/);
  if (match && match[1]) return match[1].trim().toLowerCase();
  const direct = String(from).trim().toLowerCase();
  return direct.includes("@") ? direct : "";
}

function extractEmailDomain(from) {
  const addr = extractEmailAddress(from);
  if (!addr) return "";
  const parts = addr.split("@");
  return parts.length === 2 ? parts[1] : "";
}

async function markUnmatched(item, isCode) {
  if (!item) return;
  const domain = extractEmailDomain(item.from);
  lastAction = { item, isCode, domain };
  if (undoActionBtn) undoActionBtn.disabled = false;
  if (isCode && domain && !senderAllowlist.includes(domain)) {
    senderAllowlist = [domain, ...senderAllowlist].slice(0, 50);
    await storageSet({ gmailSenderAllowlist: senderAllowlist });
  }
  if (!isCode && domain && !senderBlocklist.includes(domain)) {
    senderBlocklist = [domain, ...senderBlocklist].slice(0, 50);
    await storageSet({ gmailSenderBlocklist: senderBlocklist });
  }
  unmatchedMessages = unmatchedMessages.filter((entry) => entry.id !== item.id);
  await storageSet({ gmailUnmatched: unmatchedMessages });
  renderUnmatchedList();
}

if (gmailThresholdEl) {
  gmailThresholdEl.addEventListener("input", () => {
    if(thresholdValEl) thresholdValEl.textContent = gmailThresholdEl.value;
  });
  gmailThresholdEl.addEventListener("change", () => {
    gmailThreshold = parseInt(gmailThresholdEl.value, 10);
    storageSet({ gmailThreshold });
    fetchLatestGmailCode();
  });
}

if (gmailUnreadOnlyEl) {
  gmailUnreadOnlyEl.addEventListener("change", () => {
    gmailUnreadOnly = !!gmailUnreadOnlyEl.checked;
    storageSet({ gmailUnreadOnly });
    fetchLatestGmailCode();
  });
}

if (gmailFetchCodeBtn) gmailFetchCodeBtn.addEventListener("click", () => fetchLatestGmailCode());

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
    if (!gmailEntry || !gmailEntry.code) return;
    try {
      await navigator.clipboard.writeText(gmailEntry.code);
      const original = gmailCodeEl.innerHTML;
      gmailCodeEl.textContent = "✓ " + (T.copied || "Copied!");
      setTimeout(() => {
        gmailCodeEl.innerHTML = original;
        window.close();
      }, 800);
    } catch (e) {
      console.error("Copy failed");
    }
  });
}

if (refreshLogsBtn) refreshLogsBtn.addEventListener("click", () => renderLogs());
if (clearLogsBtn) {
  clearLogsBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "GMAIL_CLEAR_LOGS" });
    renderLogs();
  });
}

if (exportDataBtn) {
  exportDataBtn.addEventListener("click", async () => {
    const data = await storageGet(["gmailQuery", "gmailThreshold", "gmailSenderAllowlist", "gmailSenderBlocklist"]);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gmail-otp-config-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(TEXT.exportOk);
  });
}

if (importDataBtn) {
  importDataBtn.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const data = JSON.parse(re.target.result);
          await storageSet(data);
          setStatus(TEXT.importOk);
          init();
        } catch {
          setStatus(TEXT.importError);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

init().catch(e => {
  console.error("Init failed", e);
  setStatus(TEXT.loadError || "Ошибка загрузки");
  if (statusEl) statusEl.style.color = "var(--danger)";
});
