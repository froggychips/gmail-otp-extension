import { STORAGE_KEYS, MSG, MAX_ACCOUNTS, DEFAULT_QUERY } from './src/shared/constants.js';
import { VALIDATORS } from './src/shared/validators.js';

const gmailConnectBtn = document.getElementById("gmailConnect");
const gmailQueryEl = document.getElementById("gmailQuery");
const gmailUnreadOnlyEl = document.getElementById("gmailUnreadOnly");
const gmailFetchCodeBtn = document.getElementById("gmailFetchCode");
const gmailCodeEl = document.getElementById("gmailCode");
const heroHintEl = document.getElementById("heroHint");
const heroIconEl = document.getElementById("heroIcon");
const heroNameEl = document.getElementById("heroName");
const heroTimeEl = document.getElementById("heroTime");
const heroAccountEl = document.getElementById("heroAccount");
const copyIndicatorEl = document.getElementById("copyIndicator");
const unmatchedListEl = document.getElementById("unmatchedList");
const unmatchedClearBtn = document.getElementById("unmatchedClear");
const historyListEl = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
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
const siteAllowlistInputEl = document.getElementById("siteAllowlistInput");
const clipboardClearSecondsInputEl = document.getElementById("clipboardClearSecondsInput");
const securityStatusEl = document.getElementById("securityStatus");
const allowlistSummaryEl = document.getElementById("allowlistSummary");
const appRootEl = document.querySelector(".app");
const themeToggleBtn = document.getElementById("themeToggle");
const themeIconEl = document.getElementById("themeIcon");
const langToggleBtn = document.getElementById("langToggle");
const langDropdown = document.getElementById("langDropdown");
const langOptionBtns = document.querySelectorAll(".lang-option");

const TRANSLATIONS = {
  en: {
    extensionName: "Gmail OTP",
    account: "Accounts",
    connect: "Add Account",
    code: "Code",
    history: "History",
    filters: "Filters",
    tools: "Tools",
    clickToCopy: "Click to copy",
    mode: "Operating Mode",
    auto: "Auto",
    manual: "Manual",
    autoDesc: "Auto: checks every minute.",
    manualDesc: "Manual: checks on click.",
    manualSearch: "Find code manually",
    historyTitle: "Latest Codes",
    empty: "List is empty",
    clearHistory: "Clear History",
    searchSettings: "Search Settings",
    unreadOnly: "Search only unread",
    unreadDesc: "Recommended: faster and more accurate.",
    recognition: "Recognition Algorithm",
    sensitivity: "Sensitivity",
    rawQuery: "Gmail Query (Raw)",
    optimalSettings: "Optimal Settings",
    securityTitle: "Security",
    allowlistLabel: "Allowed sites for OTP paste",
    clipboardLabel: "Clipboard auto-clear (sec)",
    clipboardHint: "0 disables auto-clear.",
    testRun: "Deep Test (500 emails)",
    exportFull: "Export All Codes",
    logs: "System Logs",
    refresh: "Refresh",
    clear: "Clear",
    unmatched: "Unmatched Emails",
    data: "Data",
    export: "Export",
    import: "Import",
    reset: "Reset All",
    language: "Language",
    russian: "Russian",
    advancedSettings: "Advanced Settings",
    allHttpsDomainsAllowed: "All HTTPS domains allowed",
    testingTools: "Testing Tools",
    testing: "Testing",
    searching: "Searching...",
    idle: "Ready",
    notConnected: "Not connected",
    maxAccounts: "Limit reached (3)",
    loadError: "Load Error",
    noSubject: "(no subject)",
    markCode: "It's a code",
    markNoCode: "Not a code",
    resetConfirm: "Are you sure? This will delete all settings.",
    clearHistoryConfirm: "Clear all history?",
    correctCodePrompt: "Correct code:",
    noOtherCodes: "No other codes found",
    allowlistCount: "domain(s) in list",
    securitySaved: "Security saved",
    allowlistInvalid: "Invalid domains: ",
    processing: "Processing...",
    exportFullOk: "Export complete!",
    testRunRunning: "Running in background..."
  },
  ru: {
    extensionName: "Gmail OTP",
    account: "Аккаунты",
    connect: "Добавить аккаунт",
    code: "Код",
    history: "История",
    filters: "Фильтры",
    tools: "Инструменты",
    clickToCopy: "Нажмите, чтобы скопировать",
    mode: "Режим работы",
    auto: "Авто",
    manual: "Ручной",
    autoDesc: "Авто: проверка раз в минуту.",
    manualDesc: "Ручной: проверка при нажатии.",
    manualSearch: "Найти код вручную",
    historyTitle: "Последние коды",
    empty: "Список пуст",
    clearHistory: "Очистить историю",
    searchSettings: "Настройки поиска",
    unreadOnly: "Искать только в непрочитанных",
    unreadDesc: "Рекомендуется: так быстрее и точнее.",
    recognition: "Алгоритм распознавания",
    sensitivity: "Чувствительность",
    rawQuery: "Запрос Gmail (Query)",
    optimalSettings: "Оптимальные настройки",
    securityTitle: "Безопасность",
    allowlistLabel: "Разрешенные сайты для вставки",
    clipboardLabel: "Автоочистка буфера (сек)",
    clipboardHint: "0 отключает автоочистку.",
    testRun: "Глубокий тест (500 писем)",
    exportFull: "Экспорт всех кодов",
    logs: "Логи системы",
    refresh: "Обновить",
    clear: "Очистить",
    unmatched: "Неопознанные письма",
    data: "Данные",
    export: "Экспорт",
    import: "Импорт",
    reset: "Сбросить всё",
    language: "Язык",
    russian: "Русский",
    advancedSettings: "Продвинутые настройки",
    allHttpsDomainsAllowed: "Разрешены все HTTPS домены",
    testingTools: "Инструменты тестирования",
    testing: "Тестирование",
    searching: "Поиск...",
    idle: "Готово",
    notConnected: "Не подключено",
    maxAccounts: "Лимит (3 аккаунта)",
    loadError: "Ошибка загрузки",
    noSubject: "(без темы)",
    markCode: "Это код",
    markNoCode: "Не код",
    resetConfirm: "Вы уверены? Это удалит все настройки.",
    clearHistoryConfirm: "Очистить историю?",
    correctCodePrompt: "Правильный код:",
    noOtherCodes: "Нет других кодов",
    allowlistCount: "домен(ов) в списке",
    securitySaved: "Сохранено",
    allowlistInvalid: "Ошибки в доменах: ",
    processing: "Обработка...",
    exportFullOk: "Экспорт завершен!",
    testRunRunning: "Выполняется в фоне..."
  }
};

let currentLang = "en";

function t(key) {
  return TRANSLATIONS[currentLang][key] || key;
}

function localizeHtml(htmlString) {
  return htmlString.replace(/__MSG_(\w+)__/g, (match, v1) => {
    return t(v1);
  });
}

function applyTranslations() {
  document.title = t("extensionName");
  document.querySelectorAll("[data-t]").forEach(el => {
    const key = el.getAttribute("data-t");
    const translatedText = t(key);
    if (translatedText) {
      if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.placeholder !== undefined) {
        el.placeholder = translatedText;
      } else {
        el.textContent = translatedText;
      }
    }
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    langDropdown?.classList.remove("show");
    langToggleBtn?.classList.remove("active");
  });
}

// Language Toggle
if (langToggleBtn) {
  langToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle("show");
    langToggleBtn.classList.toggle("active");
    accountDropdown?.classList.remove("show");
    accountToggleBtn?.classList.remove("active");
  });
}

langOptionBtns.forEach(btn => {
  btn.addEventListener("click", async (e) => {
    const lang = e.target.getAttribute("data-lang");
    await chrome.storage.local.set({ [STORAGE_KEYS.language]: lang });
    window.location.reload();
  });
});

// Theme Toggle
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", async () => {
    const currentThemeData = await chrome.storage.local.get(STORAGE_KEYS.theme);
    const newTheme = currentThemeData[STORAGE_KEYS.theme] === "dark" ? "light" : "dark";
    await chrome.storage.local.set({ [STORAGE_KEYS.theme]: newTheme });
    document.body.classList.toggle("dark-theme", newTheme === "dark");
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  if (!themeIconEl) return;
  themeIconEl.innerHTML = theme === "dark" 
    ? '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>' 
    : '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
}

// Close dropdown on click outside
document.addEventListener("click", () => {
  accountDropdown?.classList.remove("show");
  accountToggleBtn?.classList.remove("active");
  langDropdown?.classList.remove("show");
  langToggleBtn?.classList.remove("active");
});

accountDropdown?.addEventListener("click", (e) => e.stopPropagation());
langDropdown?.addEventListener("click", (e) => e.stopPropagation());

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
let isTestRunning = false;
let siteAllowlist = [];
let clipboardClearSeconds = 20;

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function normalizePopupScale() {
  if (!appRootEl) return;
  const viewportScale = window.visualViewport?.scale || 1;
  if (viewportScale > 1.01) {
    const inverse = 1 / viewportScale;
    appRootEl.style.transform = `scale(${inverse})`;
    appRootEl.style.transformOrigin = "top left";
    appRootEl.style.width = `${viewportScale * 100}%`;
    appRootEl.style.height = `${viewportScale * 100}%`;
  } else {
    appRootEl.style.transform = "";
    appRootEl.style.transformOrigin = "";
    appRootEl.style.width = "";
    appRootEl.style.height = "";
  }
}

function showSecurityStatus(message, isError = false) {
  if (!securityStatusEl) return;
  securityStatusEl.textContent = message;
  securityStatusEl.style.color = isError ? "var(--danger)" : "var(--success)";
}

function updateAllowlistSummary() {
  if (!allowlistSummaryEl) return;
  allowlistSummaryEl.textContent = siteAllowlist.length
    ? `${siteAllowlist.length} ${t("allowlistCount")}`
    : t("allHttpsDomainsAllowed");
}

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
  } catch (e) { logsListEl.textContent = t("loadError") + ": " + e.message; }
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

function renderAccountList() {
  if (!accountListEl) return;
  accountListEl.innerHTML = "";
  if (!gmailAccounts.length) {
    const el = document.createElement("div");
    el.className = "hint"; 
    el.style.textAlign = "center";
    el.style.padding = "10px";
    el.textContent = t("notConnected");
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
  gmailConnectBtn.textContent = gmailAccounts.length >= MAX_ACCOUNTS ? t("maxAccounts") : t("connect");
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
    if (heroHintEl) heroHintEl.textContent = t("clickToCopy");
  } else {
    if (gmailCodeEl) gmailCodeEl.textContent = "—";
    if (heroIconEl) heroIconEl.style.display = 'none';
    if (heroNameEl) heroNameEl.textContent = hasAccounts ? t("idle") : t("notConnected");
    if (heroTimeEl) heroTimeEl.textContent = "--:--";
    if (heroAccountEl) heroAccountEl.textContent = "";
  }

  if (gmailFetchCodeBtn) gmailFetchCodeBtn.disabled = !hasAccounts;
  if (gmailUnreadOnlyEl) gmailUnreadOnlyEl.checked = !!gmailUnreadOnly;
  if (gmailThresholdEl) gmailThresholdEl.value = gmailThreshold;
  if (thresholdValEl) thresholdValEl.textContent = gmailThreshold;
  if (accountToggleBtn) accountToggleBtn.classList.toggle("connected", hasAccounts);

  if (modeAutoBtn && modeManualBtn) {
    modeAutoBtn.classList.toggle("active", gmailMode === "auto");
    modeManualBtn.classList.toggle("active", gmailMode === "manual");
    modeAutoBtn.disabled = !hasAccounts;
    modeManualBtn.disabled = !hasAccounts;
    if (modeHintEl) modeHintEl.textContent = gmailMode === "auto" ? t("autoDesc") : t("manualDesc");
  }

  const hero = document.getElementById("gmailCodeWrapper");
  if (hero) {
    hero.style.background = gmailEntry?.code ? "linear-gradient(135deg, #2563eb, #3b82f6)" : "var(--bg-secondary)";
    hero.style.color = gmailEntry?.code ? "white" : "var(--text-secondary)";
  }
}

function renderHistory() {
  if (!historyListEl) return;
  if (!gmailHistory.length) { historyListEl.innerHTML = `<div class="list-item">${t("empty")}</div>`; return; }
  historyListEl.innerHTML = "";
  gmailHistory.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "history-item-container";
    
    const domain = item.domain || extractDomain(item.from);
    const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain || "")}&sz=32`;

    const el = document.createElement("div");
    el.className = "list-item history-item";
    el.innerHTML = localizeHtml(`
      <img src="${favicon}" class="history-favicon" style="width: 16px; height: 16px; margin-right: 10px; border-radius: 2px;">
      <div class="history-info">
        <div class="history-title">${escapeHtml(item.subject || t("noSubject"))}</div>
        <div class="history-sub">${escapeHtml(item.from)} • ${escapeHtml(formatDate(item))}</div>
      </div>
      <div class="history-val">${escapeHtml(item.code)}</div>
      <div class="history-actions"><button class="btn-edit" data-id="${escapeHtml(item.id)}">✏️</button></div>
    `);
    
    const correctionMenu = document.createElement("div");
    correctionMenu.className = "correction-menu";
    correctionMenu.id = `correction-${item.id}`;
    
    const others = item.others || [];
    if (others.length > 0) {
      correctionMenu.innerHTML = localizeHtml(`<div style="margin-bottom: 4px; color: var(--text-secondary);">__MSG_correctCodePrompt__</div>`);
      others.forEach(other => {
        const opt = document.createElement("span");
        opt.className = "correction-option";
        opt.textContent = other;
        opt.addEventListener("click", async () => {
          await sendMessageWithTimeout({ type: MSG.correctCode, id: item.id, code: other, domain: item.domain });
          navigator.clipboard.writeText(other);
          const stored = await chrome.storage.local.get(STORAGE_KEYS.history);
          gmailHistory = stored[STORAGE_KEYS.history] || [];
          renderHistory();
        });
        correctionMenu.appendChild(opt);
      });
    } else {
      correctionMenu.innerHTML = localizeHtml(`<div style="margin-bottom: 4px; color: var(--text-secondary);">__MSG_noOtherCodes__</div>`);
    }

    const ignoreBtn = document.createElement("button");
    ignoreBtn.className = "btn btn-ghost";
    ignoreBtn.style = "width: auto; padding: 4px 8px; font-size: 10px; margin-top: 8px;";
    ignoreBtn.textContent = t("clear");
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
    gmailFetchCodeBtn.innerHTML = `🔄 <span>${t("searching")}</span>`;
  }
  if (!silent && gmailCodeEl) gmailCodeEl.textContent = "⋯";

  try {
    const response = await sendMessageWithTimeout({ type: MSG.fetch, query: gmailQueryEl?.value || "" });
    if (response?.ok) { gmailEntry = response.code || null; }
  } catch (err) { console.error("Fetch failed:", err); }

  renderGmailPanel();
  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = gmailAccounts.length === 0;
    gmailFetchCodeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span data-t="manualSearch">${t("manualSearch")}</span>`;
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
  const storedData = await chrome.storage.local.get([STORAGE_KEYS.language, STORAGE_KEYS.theme]);
  currentLang = storedData[STORAGE_KEYS.language] || (navigator.language || "en").split("-")[0];
  if (!TRANSLATIONS[currentLang]) currentLang = "en";
  
  const currentTheme = storedData[STORAGE_KEYS.theme] || "light";
  document.body.classList.toggle("dark-theme", currentTheme === "dark");
  updateThemeIcon(currentTheme);

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
  siteAllowlist = stored[STORAGE_KEYS.siteAllowlist] || [];
  clipboardClearSeconds = VALIDATORS.clampClipboardSeconds(stored[STORAGE_KEYS.clipboardClearSeconds]);
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
    if (isTestRunning) testRunBtn.textContent = "⏳ " + t("searching");
  }
  
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
    gmailQueryEl.addEventListener("input", saveQueryDebounced);
  }

  if (siteAllowlistInputEl) {
    siteAllowlistInputEl.value = siteAllowlist.join("\n");
    siteAllowlistInputEl.addEventListener("change", async () => {
      const parsed = VALIDATORS.parseDomainList(siteAllowlistInputEl.value);
      siteAllowlist = parsed.valid;
      siteAllowlistInputEl.value = siteAllowlist.join("\n");
      await chrome.storage.local.set({ [STORAGE_KEYS.siteAllowlist]: siteAllowlist });
      updateAllowlistSummary();
      if (parsed.invalid.length) {
        showSecurityStatus(t("allowlistInvalid") + parsed.invalid.join(", "), true);
      } else {
        showSecurityStatus(t("securitySaved"));
      }
    });
  }

  if (clipboardClearSecondsInputEl) {
    clipboardClearSecondsInputEl.value = String(clipboardClearSeconds);
    clipboardClearSecondsInputEl.addEventListener("change", async () => {
      clipboardClearSeconds = VALIDATORS.clampClipboardSeconds(clipboardClearSecondsInputEl.value);
      clipboardClearSecondsInputEl.value = String(clipboardClearSeconds);
      await chrome.storage.local.set({ [STORAGE_KEYS.clipboardClearSeconds]: clipboardClearSeconds });
      showSecurityStatus(t("securitySaved"));
    });
  }
  
  applyTranslations();
  updateAllowlistSummary();
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
    wrapper.innerHTML = localizeHtml(`<div class="unmatched-title">${escapeHtml(item.subject || t("noSubject"))}</div><div class="unmatched-meta">${escapeHtml(item.from)} • ${escapeHtml(item.date)}</div><div class="unmatched-actions"><button class="secondary mark-code" data-id="${escapeHtml(item.id)}" data-domain="${escapeHtml(item.domain)}">${t("markCode")}</button><button class="ghost mark-no-code" data-id="${escapeHtml(item.id)}" data-domain="${escapeHtml(item.domain)}">${t("markNoCode")}</button></div>`);
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

      const tabs = await new Promise((resolve) => chrome.tabs.query({ active: true, currentWindow: true }, resolve));
      const activeTab = tabs[0];
      const activeHost = hostnameFromUrl(activeTab?.url || "");
      const canPasteToTab = !!(activeTab?.id && activeTab?.url?.startsWith("https://") && VALIDATORS.isAllowedSiteHost(activeHost, siteAllowlist));
      if (canPasteToTab) {
        chrome.tabs.sendMessage(activeTab.id, { action: "PASTE_OTP", code }).catch(() => {});
      }

      if (copyIndicatorEl) copyIndicatorEl.classList.add("show");
      const closeDelayMs = Math.max(600, clipboardClearSeconds * 1000);
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch (e) {
          console.warn("Clipboard auto-clear failed:", e?.message || e);
        }
        if (copyIndicatorEl) copyIndicatorEl.classList.remove("show");
        window.close();
      }, closeDelayMs);
    } catch (e) { console.error("Copy failed"); }
  });
}

if (refreshLogsBtn) refreshLogsBtn.addEventListener("click", () => renderLogs());
if (clearLogsBtn) clearLogsBtn.addEventListener("click", () => sendMessageWithTimeout({ type: MSG.clearLogs }).then(() => renderLogs()));

if (testRunBtn) {
  testRunBtn.addEventListener("click", async () => {
    testRunBtn.disabled = true;
    const originalText = testRunBtn.textContent;
    testRunBtn.textContent = "⏳ " + t("searching");
    
    try {
      const response = await sendMessageWithTimeout({ type: MSG.testRun });
      if (response?.ok) {
        testRunBtn.textContent = "✅ " + t("testRunRunning");
      }
    } catch (err) {
      console.error("Test run start failed:", err);
      testRunBtn.disabled = false;
      testRunBtn.textContent = originalText;
    }
  });
}

setInterval(async () => {
  if (!testRunBtn) return;
  const stored = await chrome.storage.local.get(STORAGE_KEYS.isTestRunning);
  const isCurrentlyRunning = !!stored[STORAGE_KEYS.isTestRunning];
  
  if (isCurrentlyRunning !== isTestRunning) {
    isTestRunning = isCurrentlyRunning;
    testRunBtn.disabled = isTestRunning;
    if (!isTestRunning) {
      testRunBtn.textContent = t("testRun");
      const activeTab = document.querySelector(".tab-btn.active");
      if (activeTab?.getAttribute("data-tab") === "history") {
        const storedHistory = await chrome.storage.local.get(STORAGE_KEYS.history);
        gmailHistory = storedHistory[STORAGE_KEYS.history] || [];
        renderHistory();
      }
    } else {
      testRunBtn.textContent = "⏳ " + t("testRunRunning");
    }
  }
}, 3000);

if (exportFullBtn) {
  exportFullBtn.addEventListener("click", async () => {
    exportFullBtn.disabled = true;
    const originalText = exportFullBtn.textContent;
    exportFullBtn.textContent = "⏳ " + t("processing");
    
    try {
      const response = await sendMessageWithTimeout({ type: MSG.exportFull }, 300000);
      if (response?.ok && response.data) {
        const headers = ["Email", "Date", "From", "Subject", "Snippet", "Detected Codes", "HTML Body"];
        const csvRows = [headers.join(",")];
        for (const row of response.data) {
          const values = [
            row.email, row.date, row.from, row.subject, row.snippet,
            Array.isArray(row.detectedCodes) ? row.detectedCodes.join("; ") : "",
            row.html
          ].map(val => `"${VALIDATORS.sanitizeCsvCell(val).replace(/"/g, '""')}"`);
          csvRows.push(values.join(","));
        }
        const blob = new Blob([csvRows.join("\n")], {type: "text/csv;charset=utf-8;"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `gmail-otp-dump-${new Date().toISOString().slice(0,19).replace(/:/g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(t("exportFullOk"));
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
    if (!confirm(t("resetConfirm"))) return;
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
    await chrome.storage.local.set({ [STORAGE_KEYS.threshold]: 3, [STORAGE_KEYS.query]: DEFAULT_QUERY });
    fetchLatestGmailCode();
    renderGmailPanel();
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", async () => {
    if (!confirm(t("clearHistoryConfirm"))) return;
    gmailHistory = [];
    gmailEntry = null;
    await chrome.storage.local.set({ [STORAGE_KEYS.history]: [], [STORAGE_KEYS.lastEntry]: null });
    renderHistory();
    renderGmailPanel();
  });
}

document.addEventListener('error', (e) => {
  if (e.target.tagName === 'IMG') e.target.style.visibility = 'hidden';
}, true);

init().catch(e => {
  console.error("Init failed", e);
  const statusBadge = document.getElementById("status");
  if (statusBadge) { statusBadge.textContent = t("loadError"); statusBadge.style.color = "var(--danger)"; }
});

normalizePopupScale();
window.addEventListener("resize", normalizePopupScale);
if (window.visualViewport) window.visualViewport.addEventListener("resize", normalizePopupScale);
