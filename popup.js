import { STORAGE_KEYS, MSG, MAX_ACCOUNTS } from './src/shared/constants.js';
import { VALIDATORS } from './src/shared/validators.js';

const gmailConnectBtn = document.getElementById("gmailConnect");
const gmailQueryEl = document.getElementById("gmailQuery");
const gmailUnreadOnlyEl = document.getElementById("gmailUnreadOnly");
const gmailFetchCodeBtn = document.getElementById("gmailFetchCode");
const gmailCodeEl = document.getElementById("gmailCode");
const gmailMetaEl = document.getElementById("gmailMeta");
const lastCheckTimeEl = document.getElementById("lastCheckTime");
const unmatchedListEl = document.getElementById("unmatchedList");
const unmatchedClearBtn = document.getElementById("unmatchedClear");
const historyListEl = document.getElementById("historyList");
const undoActionBtn = document.getElementById("undoAction");
const gmailThresholdEl = document.getElementById("gmailThreshold");
const thresholdValEl = document.getElementById("thresholdVal");
const exportDataBtn = document.getElementById("exportData");
const importDataBtn = document.getElementById("importData");
const resetExtensionBtn = document.getElementById("resetExtension");
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
const accountScrollerEl = document.getElementById("accountScroller");

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
    justChecked: "Только что проверено", checkedAgo: " мин назад", lastChecked: "Последняя проверка: ",
    reset: "Сбросить всё", resetConfirm: "Вы уверены? Это удалит все настройки и аккаунты."
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
    justChecked: "Just checked", checkedAgo: " min ago", lastChecked: "Last checked: ",
    reset: "Reset All", resetConfirm: "Are you sure? This will delete all settings and accounts."
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
let currentAccountIndex = 0;
let accountScrollerTimer = null;

async function sendMessageWithTimeout(message, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout waiting for response")), timeout);
    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(response);
    });
  });
}

async function renderLogs() {
  if (!logsListEl) return;
  try {
    const response = await sendMessageWithTimeout({ type: MSG.getLogs });
    const logs = response && Array.isArray(response.logs) ? response.logs : [];
    if (!logs.length) { logsListEl.textContent = "—"; return; }
    logsListEl.innerHTML = logs.map(entry => {
      const time = new Date(entry.ts).toLocaleTimeString();
      const msg = entry.msg.map(m => typeof m === 'object' && m.message ? m.message : JSON.stringify(m)).join(" ");
      return `<div class="log-entry"><span class="log-ts">[${time}]</span> ${msg}</div>`;
    }).join("");
  } catch (e) { logsListEl.textContent = T.loadError + ": " + e.message; }
}

function formatGmailMeta(entry) {
  if (!entry) return "—";
  return `${T.from}: ${entry.from || "unknown"} • ${T.date}: ${entry.date || "unknown"}`;
}

function updateAccountScroller() {
  if (!accountScrollerEl) return;
  if (accountScrollerTimer) clearTimeout(accountScrollerTimer);
  if (!gmailAccounts.length) { accountScrollerEl.textContent = ""; return; }

  const showNext = () => {
    if (!gmailAccounts.length) return;
    accountScrollerEl.style.opacity = "0";
    setTimeout(() => {
      currentAccountIndex = (currentAccountIndex + 1) % gmailAccounts.length;
      accountScrollerEl.textContent = gmailAccounts[currentAccountIndex].email;
      accountScrollerEl.style.opacity = "1";
    }, 300);
    accountScrollerTimer = setTimeout(showNext, 4000);
  };

  accountScrollerEl.textContent = gmailAccounts[currentAccountIndex]?.email || gmailAccounts[0].email;
  accountScrollerEl.style.opacity = "1";
  if (gmailAccounts.length > 1) accountScrollerTimer = setTimeout(showNext, 4000);
}

function renderAccountList() {
  if (!accountListEl) return;
  accountListEl.innerHTML = "";
  if (!gmailAccounts.length) {
    const el = document.createElement("div");
    el.className = "hint"; el.textContent = T.notConnected;
    accountListEl.appendChild(el);
  } else {
    gmailAccounts.forEach(account => {
      const el = document.createElement("div");
      el.className = "account-item";
      el.innerHTML = `<span class="account-email">${account.email}</span><button class="remove-account" data-email="${account.email}">×</button>`;
      accountListEl.appendChild(el);
    });
  }

  document.querySelectorAll(".remove-account").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const email = e.target.getAttribute("data-email");
      try {
        const response = await sendMessageWithTimeout({ type: MSG.disconnect, email });
        if (response?.ok) { gmailAccounts = response.accounts; renderAccountList(); renderGmailPanel(); }
      } catch (err) { console.error("Disconnect failed:", err); }
    });
  });

  gmailConnectBtn.disabled = gmailAccounts.length >= MAX_ACCOUNTS;
  gmailConnectBtn.textContent = gmailAccounts.length >= MAX_ACCOUNTS ? T.maxAccounts : T.connect;
  updateAccountScroller();
}

function renderGmailPanel() {
  const hasAccounts = gmailAccounts.length > 0;
  if (gmailCodeEl) gmailCodeEl.textContent = gmailEntry?.code || "—";
  if (gmailMetaEl) {
    let metaText = formatGmailMeta(gmailEntry);
    if (gmailEntry?.account) metaText += ` (${gmailEntry.account})`;
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
    hero.style.background = gmailEntry?.code ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "var(--bg-secondary)";
    hero.style.color = gmailEntry?.code ? "white" : "var(--text-secondary)";
  }
}

function renderHistory() {
  if (!historyListEl) return;
  if (!gmailHistory.length) { historyListEl.innerHTML = `<div class="list-item">${T.empty}</div>`; return; }
  historyListEl.innerHTML = "";
  gmailHistory.forEach((item) => {
    const el = document.createElement("div");
    el.className = "list-item history-item";
    el.innerHTML = `<div class="history-info"><div class="history-title">${item.subject || T.noSubject}</div><div class="history-sub">${item.from} • ${item.date}</div></div><div class="history-val">${item.code}</div>`;
    el.addEventListener("click", () => navigator.clipboard.writeText(item.code));
    historyListEl.appendChild(el);
  });
}

async function fetchLatestGmailCode({ silent = false } = {}) {
  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = true;
    gmailFetchCodeBtn.innerHTML = `🔄 <span>${T.searching}</span>`;
  }
  if (!silent && gmailCodeEl) gmailCodeEl.textContent = "⋯";

  try {
    const response = await sendMessageWithTimeout({ type: MSG.fetch, query: gmailQueryEl?.value || "" });
    if (response?.ok) { gmailEntry = response.code || null; }
  } catch (err) { console.error("Fetch failed:", err); }

  renderGmailPanel();
  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = gmailAccounts.length === 0;
    gmailFetchCodeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span data-t="manualSearch">${T.manualSearch}</span>`;
  }
}

function saveQueryDebounced() {
  clearTimeout(gmailQueryTimer);
  gmailQueryTimer = setTimeout(async () => {
    try {
      gmailQuery = VALIDATORS.gmailQuery(gmailQueryEl.value);
      await chrome.storage.local.set({ [STORAGE_KEYS.query]: gmailQuery });
      if (gmailAccounts.length > 0) fetchLatestGmailCode({ silent: true });
    } catch (e) { console.warn(e.message); }
  }, 800);
}

async function init() {
  const stored = await new Promise(r => chrome.storage.local.get(null, r));
  gmailAccounts = stored[STORAGE_KEYS.accounts] || [];
  gmailQuery = stored[STORAGE_KEYS.query] || "";
  gmailUnreadOnly = !!stored[STORAGE_KEYS.unreadOnly];
  gmailEntry = stored[STORAGE_KEYS.lastEntry] || null;
  unmatchedMessages = stored[STORAGE_KEYS.unmatched] || [];
  senderAllowlist = stored[STORAGE_KEYS.senderAllowlist] || [];
  senderBlocklist = stored[STORAGE_KEYS.senderBlocklist] || [];
  gmailHistory = stored[STORAGE_KEYS.history] || [];
  gmailThreshold = stored[STORAGE_KEYS.threshold] || 3;
  gmailMode = stored[STORAGE_KEYS.mode] || "auto";
  
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
    gmailQueryEl.addEventListener("input", saveQueryDebounced);
  }
  
  translateUI();
  renderAccountList();
  renderGmailPanel();
  if (gmailAccounts.length > 0) fetchLatestGmailCode({ silent: true });
}

if (gmailConnectBtn) {
  gmailConnectBtn.addEventListener("click", async () => {
    gmailConnectBtn.disabled = true;
    try {
      const response = await sendMessageWithTimeout({ type: MSG.connect });
      if (response?.ok) { gmailAccounts = response.accounts; renderAccountList(); renderGmailPanel(); fetchLatestGmailCode(); }
    } catch (err) { console.error("Connection failed:", err); }
    gmailConnectBtn.disabled = gmailAccounts.length >= MAX_ACCOUNTS;
  });
}

function renderUnmatchedList() {
  if (!unmatchedListEl) return;
  if (!unmatchedMessages.length) { unmatchedListEl.textContent = "—"; return; }
  unmatchedListEl.innerHTML = "";
  unmatchedMessages.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "unmatched-item";
    wrapper.innerHTML = `<div class="unmatched-title">${item.subject || T.noSubject}</div><div class="unmatched-meta">${item.from} • ${item.date}</div><div class="unmatched-actions"><button class="secondary">${T.markCode}</button><button class="ghost">${T.markNoCode}</button></div>`;
    unmatchedListEl.appendChild(wrapper);
  });
}

if (gmailThresholdEl) {
  gmailThresholdEl.addEventListener("input", () => { if (thresholdValEl) thresholdValEl.textContent = gmailThresholdEl.value; });
  gmailThresholdEl.addEventListener("change", () => {
    gmailThreshold = VALIDATORS.threshold(gmailThresholdEl.value);
    chrome.storage.local.set({ [STORAGE_KEYS.threshold]: gmailThreshold });
    fetchLatestGmailCode();
  });
}

if (gmailUnreadOnlyEl) {
  gmailUnreadOnlyEl.addEventListener("change", () => {
    gmailUnreadOnly = !!gmailUnreadOnlyEl.checked;
    chrome.storage.local.set({ [STORAGE_KEYS.unreadOnly]: gmailUnreadOnly });
    fetchLatestGmailCode();
  });
}

if (gmailFetchCodeBtn) gmailFetchCodeBtn.addEventListener("click", () => fetchLatestGmailCode());

if (modeAutoBtn) modeAutoBtn.addEventListener("click", () => {
  gmailMode = "auto";
  sendMessageWithTimeout({ type: MSG.modeAuto }).then(() => renderGmailPanel());
});

if (modeManualBtn) modeManualBtn.addEventListener("click", () => {
  gmailMode = "manual";
  sendMessageWithTimeout({ type: MSG.modeManual }).then(() => renderGmailPanel());
});

const hero = document.getElementById("gmailCodeWrapper");
if (hero) {
  hero.addEventListener("click", async () => {
    if (!gmailEntry?.code) return;
    try {
      await navigator.clipboard.writeText(gmailEntry.code);
      const original = gmailCodeEl.innerHTML;
      gmailCodeEl.textContent = "✓ " + (T.copied || "Copied!");
      setTimeout(() => { gmailCodeEl.innerHTML = original; window.close(); }, 800);
    } catch (e) { console.error("Copy failed"); }
  });
}

if (refreshLogsBtn) refreshLogsBtn.addEventListener("click", () => renderLogs());
if (clearLogsBtn) clearLogsBtn.addEventListener("click", () => sendMessageWithTimeout({ type: MSG.clearLogs }).then(() => renderLogs()));

if (resetExtensionBtn) {
  resetExtensionBtn.addEventListener("click", async () => {
    if (!confirm(T.resetConfirm)) return;
    for (const acc of gmailAccounts) await sendMessageWithTimeout({ type: MSG.disconnect, email: acc.email }).catch(() => {});
    await new Promise(r => chrome.storage.local.clear(r));
    window.location.reload();
  });
}

init().catch(e => {
  console.error("Init failed", e);
  const statusBadge = document.getElementById("status");
  if (statusBadge) { statusBadge.textContent = T.loadError; statusBadge.style.color = "var(--danger)"; }
});
