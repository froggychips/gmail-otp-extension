import { STORAGE_KEYS, MSG, MAX_ACCOUNTS, DEFAULT_QUERY } from './src/shared/constants.js';
import { VALIDATORS } from './src/shared/validators.js';

const gmailConnectBtn = document.getElementById("gmailConnect");
const gmailQueryEl = document.getElementById("gmailQuery");
const gmailUnreadOnlyEl = document.getElementById("gmailUnreadOnly");
const gmailFetchCodeBtn = document.getElementById("gmailFetchCode");
const gmailCodeEl = document.getElementById("gmailCode");
const heroChoicesEl = document.getElementById("heroChoices");
const heroHintEl = document.getElementById("heroHint");
const heroIconEl = document.getElementById("heroIcon");
const heroNameEl = document.getElementById("heroName");
const heroTimeEl = document.getElementById("heroTime");
const heroAccountEl = document.getElementById("heroAccount");
const copyIndicatorEl = document.getElementById("copyIndicator");
const lastCheckTimeEl = document.getElementById("lastCheckTime");
const unmatchedListEl = document.getElementById("unmatchedList");
const unmatchedClearBtn = document.getElementById("unmatchedClear");
const historyListEl = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const undoActionBtn = document.getElementById("undoAction");
const gmailThresholdEl = document.getElementById("gmailThreshold");
const thresholdValEl = document.getElementById("thresholdVal");
const exportDataBtn = document.getElementById("exportData");
const importDataBtn = document.getElementById("importData");
const resetExtensionBtn = document.getElementById("resetExtension");
const resetOptimalSettingsBtn = document.getElementById("resetOptimalSettings");
const testRunBtn = document.getElementById("testRun");
const exportFullBtn = document.getElementById("exportFull");
const modeAutoBtn = document.getElementById("modeAuto");
const modeManualBtn = document.getElementById("modeManual");
const modeHintEl = document.getElementById("modeHint");
const logsListEl = document.getElementById("logsList");
const refreshLogsBtn = document.getElementById("refreshLogs");
const clearLogsBtn = document.getElementById("clearLogs");
const tabBtns = document.querySelectorAll(".tab-btn[data-tab]");
const tabContents = document.querySelectorAll(".tabs-content");
const advancedFiltersToggle = document.getElementById("advancedFiltersToggle");
const advancedFiltersSection = document.getElementById("advancedFiltersSection");
const testingToolsToggle = document.getElementById("testingToolsToggle");
const advancedTestSection = document.getElementById("advancedTestSection");
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
    reset: "Сбросить всё", resetConfirm: "Вы уверены? Это удалит все настройки и аккаунты.",
    testRun: "Глубокий тест (500 писем)", testRunOk: "Тест завершен! Найдено кодов: ",
    exportFull: "Экспорт всех кодов + HTML", exportFullOk: "Экспорт завершен! Файл готов.",
    clearHistory: "Очистить историю", clearHistoryConfirm: "Вы уверены, что хотите очистить всю историю кодов?",
    clickToCopy: "Нажмите, чтобы скопировать"
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
    reset: "Reset All", resetConfirm: "Are you sure? This will delete all settings and accounts.",
    testRun: "Deep Test (500 emails)", testRunOk: "Test complete! Codes found: ",
    exportFull: "Export All Codes + HTML", exportFullOk: "Export complete! File ready.",
    clearHistory: "Clear History", clearHistoryConfirm: "Are you sure you want to clear all code history?",
    clickToCopy: "Click to copy"
  }
};

const userLang = (navigator.language || "en").split("-")[0];
const T = { ...I18N.en, ...(I18N[userLang] || {}) };

const TEXT = T;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

// Advanced Filters Toggle
if (advancedFiltersToggle) {
  advancedFiltersToggle.addEventListener("change", () => {
    const isChecked = advancedFiltersToggle.checked;
    if (advancedFiltersSection) advancedFiltersSection.style.display = isChecked ? "block" : "none";
    chrome.storage.local.set({ [STORAGE_KEYS.advancedTestMode]: isChecked });
  });
}

// Testing Tools Toggle
if (testingToolsToggle) {
  testingToolsToggle.addEventListener("change", () => {
    const isChecked = testingToolsToggle.checked;
    if (advancedTestSection) advancedTestSection.style.display = isChecked ? "block" : "none";
    chrome.storage.local.set({ [STORAGE_KEYS.testingToolsMode]: isChecked });
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
let isTestRunning = false;

async function sendMessageWithTimeout(message, timeout = 60000) {
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
      return `<div class="log-entry"><span class="log-ts">[${escapeHtml(time)}]</span> ${escapeHtml(msg)}</div>`;
    }).join("");
  } catch (e) { logsListEl.textContent = T.loadError + ": " + e.message; }
}

function extractDomain(from) {
  const match = String(from || "").match(/<[^>]+@([^>]+)>/) || String(from || "").match(/@([^>\s]+)/);
  return match ? match[1].toLowerCase() : "";
}

function cleanSenderName(from) {
  const nameMatch = String(from || "").match(/^"?(.*?)"?\s*<|^(.*?)\s*</);
  let name = nameMatch ? (nameMatch[1] || nameMatch[2]) : from;
  name = String(name || "Unknown").trim().replace(/^"|"$/g, '');
  if (name.includes('@') && !nameMatch) return name.split('@')[1];
  return name;
}

function formatDate(entry, timeOnly = false) {
  if (!entry) return "—";
  const ts = parseInt(entry.internalDate);
  if (isNaN(ts)) return entry.date || "—";
  
  const d = new Date(ts);
  if (timeOnly) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString(undefined, { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatGmailMeta(entry) {
  if (!entry) return "—";
  const domain = entry.domain || extractDomain(entry.from);
  const name = escapeHtml(cleanSenderName(entry.from));
  const time = escapeHtml(formatDate(entry, true));
  const account = escapeHtml(entry.account || "");
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain || "")}&sz=32`;
  
  return `
    <div class="meta-row" style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 2px;">
      <img src="${favicon}" style="width: 14px; height: 14px; border-radius: 2px;">
      <span style="font-weight: 600;">${name}</span>
      <span style="opacity: 0.7; font-weight: 400;">${time}</span>
    </div>
    <div class="meta-account" style="font-size: 10px; opacity: 0.8;">${account}</div>
  `;
}

function updateAccountScroller() {
  if (!accountScrollerEl) return;
  // ... existing logic ...
}

function renderAccountList() {
  if (!accountListEl) return;
  accountListEl.innerHTML = "";
  if (!gmailAccounts.length) {
    const el = document.createElement("div");
    el.className = "hint"; 
    el.style.textAlign = "center";
    el.style.padding = "10px";
    el.textContent = T.notConnected;
    accountListEl.appendChild(el);
  } else {
    gmailAccounts.forEach(account => {
      const el = document.createElement("div");
      el.className = "account-item";
      const emailSpan = document.createElement("span");
      emailSpan.className = "account-email";
      emailSpan.textContent = account.email;
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-account";
      removeBtn.setAttribute("data-email", account.email);
      removeBtn.textContent = "×";
      el.appendChild(emailSpan);
      el.appendChild(removeBtn);
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
  
  if (gmailEntry) {
    const domain = gmailEntry.domain || extractDomain(gmailEntry.from);
    
    if (gmailCodeEl) {
      gmailCodeEl.textContent = gmailEntry.code;
      gmailCodeEl.style.fontSize = gmailEntry.code.length > 8 ? '28px' : '48px';
    }

    if (heroIconEl) {
      heroIconEl.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      heroIconEl.style.display = 'block';
    }
    if (heroNameEl) heroNameEl.textContent = cleanSenderName(gmailEntry.from);
    if (heroTimeEl) heroTimeEl.textContent = formatDate(gmailEntry, true);
    if (heroAccountEl) heroAccountEl.textContent = gmailEntry.account || "";
    if (heroHintEl) heroHintEl.textContent = T.clickToCopy;
  } else {
    if (gmailCodeEl) gmailCodeEl.textContent = "—";
    if (heroIconEl) heroIconEl.style.display = 'none';
    if (heroNameEl) heroNameEl.textContent = hasAccounts ? T.idle : T.notConnected;
    if (heroTimeEl) heroTimeEl.textContent = "--:--";
    if (heroAccountEl) heroAccountEl.textContent = "";
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
    const wrapper = document.createElement("div");
    wrapper.className = "history-item-container";
    
    const domain = item.domain || extractDomain(item.from);
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain || "")}&sz=32`;

    const el = document.createElement("div");
    el.className = "list-item history-item";
    el.innerHTML = `
      <img src="${favicon}" class="history-favicon" style="width: 16px; height: 16px; margin-right: 10px; border-radius: 2px;">
      <div class="history-info">
        <div class="history-title">${escapeHtml(item.subject || T.noSubject)}</div>
        <div class="history-sub">${escapeHtml(item.from)} • ${escapeHtml(formatDate(item))}</div>
      </div>
      <div class="history-val">${escapeHtml(item.code)}</div>
      <div class="history-actions"><button class="btn-edit" data-id="${escapeHtml(item.id)}">✏️</button></div>
    `;
    
    const correctionMenu = document.createElement("div");
    correctionMenu.className = "correction-menu";
    correctionMenu.id = `correction-${item.id}`;
    
    const others = item.others || [];
    if (others.length > 0) {
      correctionMenu.innerHTML = `<div style="margin-bottom: 4px; color: var(--text-secondary);">Правильный код:</div>`;
      others.forEach(other => {
        const opt = document.createElement("span");
        opt.className = "correction-option";
        opt.textContent = other;
        opt.addEventListener("click", async () => {
          await sendMessageWithTimeout({ type: MSG.correctCode, id: item.id, code: other, domain: item.domain });
          navigator.clipboard.writeText(other);
          // Refresh
          const stored = await chrome.storage.local.get(STORAGE_KEYS.history);
          gmailHistory = stored[STORAGE_KEYS.history] || [];
          renderHistory();
        });
        correctionMenu.appendChild(opt);
      });
    } else {
      correctionMenu.innerHTML = `<div style="margin-bottom: 4px; color: var(--text-secondary);">Нет других вариантов в письме</div>`;
    }

    const ignoreBtn = document.createElement("button");
    ignoreBtn.className = "btn btn-ghost";
    ignoreBtn.style = "width: auto; padding: 4px 8px; font-size: 10px; margin-top: 8px;";
    ignoreBtn.textContent = "Это не код (игнорировать)";
    ignoreBtn.addEventListener("click", async () => {
      await sendMessageWithTimeout({ type: MSG.ignoreCode, id: item.id, code: item.code });
      const stored = await chrome.storage.local.get(STORAGE_KEYS.history);
      gmailHistory = stored[STORAGE_KEYS.history] || [];
      renderHistory();
    });
    correctionMenu.appendChild(ignoreBtn);

    el.querySelector(".history-info").addEventListener("click", () => navigator.clipboard.writeText(item.code));
    el.querySelector(".history-val").addEventListener("click", () => navigator.clipboard.writeText(item.code));
    
    el.querySelector(".btn-edit").addEventListener("click", (e) => {
      e.stopPropagation();
      correctionMenu.classList.toggle("show");
    });

    wrapper.appendChild(el);
    wrapper.appendChild(correctionMenu);
    historyListEl.appendChild(wrapper);
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
  isTestRunning = !!stored[STORAGE_KEYS.isTestRunning];
  const isAdvancedFilters = !!stored[STORAGE_KEYS.advancedTestMode];
  const isTestingTools = !!stored[STORAGE_KEYS.testingToolsMode];
  
  if (advancedFiltersToggle) {
    advancedFiltersToggle.checked = isAdvancedFilters;
    if (advancedFiltersSection) advancedFiltersSection.style.display = isAdvancedFilters ? "block" : "none";
  }

  if (testingToolsToggle) {
    testingToolsToggle.checked = isTestingTools;
    if (advancedTestSection) advancedTestSection.style.display = isTestingTools ? "block" : "none";
  }

  if (testRunBtn) {
    testRunBtn.disabled = isTestRunning;
    if (isTestRunning) testRunBtn.textContent = "⏳ " + (T.searching || "Scanning...");
  }
  
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
    gmailQueryEl.addEventListener("input", saveQueryDebounced);
  }
  
  translateUI();
  renderAccountList();
  renderGmailPanel();
  if (gmailAccounts.length > 0) fetchLatestGmailCode();
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
  if (!unmatchedMessages.length) { unmatchedListEl.innerHTML = '<div style="padding: 10px; color: var(--text-secondary); text-align: center;">—</div>'; return; }
  unmatchedListEl.innerHTML = "";
  unmatchedMessages.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "unmatched-item";
    wrapper.innerHTML = `<div class="unmatched-title">${escapeHtml(item.subject || T.noSubject)}</div><div class="unmatched-meta">${escapeHtml(item.from)} • ${escapeHtml(item.date)}</div><div class="unmatched-actions"><button class="secondary mark-code" data-id="${escapeHtml(item.id)}" data-domain="${escapeHtml(item.domain)}">${T.markCode}</button><button class="ghost mark-no-code" data-id="${escapeHtml(item.id)}" data-domain="${escapeHtml(item.domain)}">${T.markNoCode}</button></div>`;
    unmatchedListEl.appendChild(wrapper);
  });

  document.querySelectorAll(".mark-code").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const { id, domain } = e.target.dataset;
      await sendMessageWithTimeout({ type: MSG.markAsCode, id, domain });
      unmatchedMessages = unmatchedMessages.filter(m => m.id !== id);
      renderUnmatchedList();
      fetchLatestGmailCode({ silent: true });
    });
  });

  document.querySelectorAll(".mark-no-code").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const { id, domain } = e.target.dataset;
      await sendMessageWithTimeout({ type: MSG.markAsNoCode, id, domain });
      unmatchedMessages = unmatchedMessages.filter(m => m.id !== id);
      renderUnmatchedList();
    });
  });
}

if (unmatchedClearBtn) {
  unmatchedClearBtn.addEventListener("click", async () => {
    unmatchedMessages = [];
    await chrome.storage.local.set({ [STORAGE_KEYS.unmatched]: [] });
    renderUnmatchedList();
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
      const code = gmailEntry.code;
      await navigator.clipboard.writeText(code);
      
      // SEND PASTE COMMAND TO PAGE
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "PASTE_OTP", code: code }).catch(() => {});
        }
      });

      if (copyIndicatorEl) {
        copyIndicatorEl.classList.add("show");
        setTimeout(() => {
          copyIndicatorEl.classList.remove("show");
          window.close();
        }, 600);
      } else {
        window.close();
      }
    } catch (e) { console.error("Copy failed"); }
  });
}

if (refreshLogsBtn) refreshLogsBtn.addEventListener("click", () => renderLogs());
if (clearLogsBtn) clearLogsBtn.addEventListener("click", () => sendMessageWithTimeout({ type: MSG.clearLogs }).then(() => renderLogs()));

if (testRunBtn) {
  testRunBtn.addEventListener("click", async () => {
    testRunBtn.disabled = true;
    const originalText = testRunBtn.textContent;
    testRunBtn.textContent = "⏳ " + (T.searching || "Starting background scan...");
    
    try {
      const response = await sendMessageWithTimeout({ type: MSG.testRun });
      if (response?.ok) {
        testRunBtn.textContent = "✅ " + (T.searching || "Running in background...");
      }
    } catch (err) {
      console.error("Test run start failed:", err);
      testRunBtn.disabled = false;
      testRunBtn.textContent = originalText;
    }
  });
}

// Polling status for UI (keep it simple for now)
setInterval(async () => {
  if (!testRunBtn) return;
  const stored = await chrome.storage.local.get(STORAGE_KEYS.isTestRunning);
  const isCurrentlyRunning = !!stored[STORAGE_KEYS.isTestRunning];
  
  if (isCurrentlyRunning !== isTestRunning) {
    isTestRunning = isCurrentlyRunning;
    testRunBtn.disabled = isTestRunning;
    if (!isTestRunning) {
      testRunBtn.textContent = T.testRun || "Deep Test (500 emails)";
      // Auto-refresh history if tab is history
      const activeTab = document.querySelector(".tab-btn.active");
      if (activeTab?.getAttribute("data-tab") === "history") {
        const storedHistory = await chrome.storage.local.get(STORAGE_KEYS.history);
        gmailHistory = storedHistory[STORAGE_KEYS.history] || [];
        renderHistory();
      }
    } else {
      testRunBtn.textContent = "⏳ " + (T.searching || "Scanning in background...");
    }
  }
}, 3000);

if (exportFullBtn) {
  exportFullBtn.addEventListener("click", async () => {
    exportFullBtn.disabled = true;
    const originalText = exportFullBtn.textContent;
    exportFullBtn.textContent = "⏳ " + (T.searching || "Processing...");
    
    try {
      // 5 minutes timeout for large export
      const response = await sendMessageWithTimeout({ type: MSG.exportFull }, 300000);
      if (response?.ok && response.data) {
        // CSV Generation
        const headers = ["Email", "Date", "From", "Subject", "Snippet", "Detected Codes", "HTML Body"];
        const csvRows = [headers.join(",")];
        
        for (const row of response.data) {
          const values = [
            row.email,
            row.date,
            row.from,
            row.subject,
            row.snippet,
            Array.isArray(row.detectedCodes) ? row.detectedCodes.join("; ") : "",
            row.html
          ].map(val => {
            // Escape double quotes by doubling them
            const str = String(val || "").replace(/"/g, '""');
            // Wrap in double quotes
            return `"${str}"`;
          });
          csvRows.push(values.join(","));
        }
        
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gmail-otp-dump-${new Date().toISOString().slice(0,19).replace(/:/g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(T.exportFullOk || "Export complete!");
      } else {
        alert("Export failed or returned no data.");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Error: " + err.message);
    } finally {
      exportFullBtn.disabled = false;
      exportFullBtn.textContent = originalText;
    }
  });
}

if (resetExtensionBtn) {
  resetExtensionBtn.addEventListener("click", async () => {
    if (!confirm(T.resetConfirm)) return;
    for (const acc of gmailAccounts) await sendMessageWithTimeout({ type: MSG.disconnect, email: acc.email }).catch(() => {});
    await new Promise(r => chrome.storage.local.clear(r));
    window.location.reload();
  });
}

if (resetOptimalSettingsBtn) {
  resetOptimalSettingsBtn.addEventListener("click", async () => {
    gmailThreshold = 3;
    gmailQuery = DEFAULT_QUERY;
    
    if (gmailThresholdEl) gmailThresholdEl.value = 3;
    if (thresholdValEl) thresholdValEl.textContent = "3";
    if (gmailQueryEl) gmailQueryEl.value = DEFAULT_QUERY;
    
    await chrome.storage.local.set({ 
      [STORAGE_KEYS.threshold]: 3,
      [STORAGE_KEYS.query]: DEFAULT_QUERY
    });
    
    fetchLatestGmailCode();
    renderGmailPanel();
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", async () => {
    if (!confirm(T.clearHistoryConfirm)) return;
    gmailHistory = [];
    gmailEntry = null;
    await chrome.storage.local.set({ 
      [STORAGE_KEYS.history]: [],
      [STORAGE_KEYS.lastEntry]: null
    });
    renderHistory();
    renderGmailPanel();
  });
}

// Handle image errors (favicon loading failures) securely (CSP compliant)
document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') {
    e.target.style.visibility = 'hidden';
  }
}, true);

init().catch(e => {
  console.error("Init failed", e);
  const statusBadge = document.getElementById("status");
  if (statusBadge) { statusBadge.textContent = T.loadError; statusBadge.style.color = "var(--danger)"; }
});
