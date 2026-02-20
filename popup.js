const gmailStatusEl = document.getElementById("gmailStatus");
const gmailConnectBtn = document.getElementById("gmailConnect");
const gmailDisconnectBtn = document.getElementById("gmailDisconnect");
const gmailQueryEl = document.getElementById("gmailQuery");
const gmailUnreadOnlyEl = document.getElementById("gmailUnreadOnly");
const gmailFetchCodeBtn = document.getElementById("gmailFetchCode");
const gmailCopyCodeBtn = document.getElementById("gmailCopyCode");
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

const TEXT = {
  idle: "Готово",
  searching: "Ищу код...",
  found: "Найдено",
  notFound: "Не найдено",
  searchError: "Не удалось найти",
  connectInProgress: "Подключаю...",
  connectError: "Не удалось подключить",
  connectOk: "Подключено",
  connectNeeded: "Выберите аккаунт",
  disconnectInProgress: "Отключаю...",
  disconnectOk: "Отключено",
  disconnectError: "Не удалось отключить",
  copied: "Скопировано",
  copyError: "Не удалось скопировать",
  loadError: "Ошибка загрузки",
  undoOk: "Действие отменено",
  exportOk: "Данные сохранены",
  importOk: "Данные импортированы",
  importError: "Ошибка импорта",
  logsCleared: "Логи очищены"
};

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
      return `<div><span style="color:#6b7280">[${time}]</span> ${msg}</div>`;
    }).join("");
  } catch (e) {
    logsListEl.textContent = "Ошибка получения логов: " + String(e);
  }
}

if (refreshLogsBtn) {
  refreshLogsBtn.addEventListener("click", () => {
    renderLogs();
  });
}

if (clearLogsBtn) {
  clearLogsBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "GMAIL_CLEAR_LOGS" });
    setStatus(TEXT.logsCleared);
    renderLogs();
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve());
  });
}

function normalizeGmailQuery(value) {
  const trimmed = String(value || "").trim();
  return trimmed;
}

function formatGmailMeta(entry) {
  if (!entry) return "—";
  const from = entry.from ? String(entry.from).trim() : "";
  const subject = entry.subject ? String(entry.subject).trim() : "";
  const date = entry.date ? String(entry.date).trim() : "";
  const parts = [];
  if (from) parts.push(`От: ${from}`);
  if (subject) parts.push(`Тема: ${subject}`);
  if (date) parts.push(`Дата: ${date}`);
  return parts.length ? parts.join(" • ") : "—";
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text || TEXT.idle;
}

function formatTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function renderGmailPanel() {
  if (gmailStatusEl) {
    gmailStatusEl.textContent = gmailEmail ? gmailEmail : "Не подключено";
  }
  if (gmailCodeEl) {
    gmailCodeEl.textContent = gmailEntry && gmailEntry.code ? gmailEntry.code : "—";
  }
  if (gmailMetaEl) {
    gmailMetaEl.textContent = formatGmailMeta(gmailEntry);
  }
  if (gmailCopyCodeBtn) {
    gmailCopyCodeBtn.disabled = !(gmailEntry && gmailEntry.code);
  }
  if (gmailDisconnectBtn) {
    gmailDisconnectBtn.disabled = !gmailEmail;
  }
  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = !gmailEmail;
  }
  if (gmailUnreadOnlyEl) {
    gmailUnreadOnlyEl.checked = !!gmailUnreadOnly;
  }
  if (undoActionBtn) {
    undoActionBtn.disabled = !lastAction;
  }
  if (gmailThresholdEl) {
    gmailThresholdEl.value = gmailThreshold;
  }
  if (thresholdValEl) {
    thresholdValEl.textContent = gmailThreshold;
  }
  if (modeAutoBtn && modeManualBtn) {
    modeAutoBtn.classList.toggle("active", gmailMode === "auto");
    modeManualBtn.classList.toggle("active", gmailMode === "manual");
    modeAutoBtn.disabled = !gmailEmail;
    modeManualBtn.disabled = !gmailEmail;
  }
}

function renderHistory() {
  if (!historyListEl) return;
  if (!gmailHistory || !gmailHistory.length) {
    historyListEl.textContent = "—";
    return;
  }
  historyListEl.innerHTML = "";
  gmailHistory.forEach((item) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.innerHTML = `
      <div class="history-code">${item.code}</div>
      <div class="history-meta">${item.subject || "(без темы)"} • ${item.from}</div>
    `;
    el.addEventListener("click", () => {
      navigator.clipboard.writeText(item.code);
      setStatus(TEXT.copied);
    });
    historyListEl.appendChild(el);
  });
}

function setGmailEntry(entry, persist = true) {
  gmailEntry = entry || null;
  renderGmailPanel();
  if (persist) {
    storageSet({ gmailLastEntry: gmailEntry });
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
    title.textContent = item.subject || "(без темы)";

    const meta = document.createElement("div");
    meta.className = "unmatched-meta";
    const from = item.from ? String(item.from).trim() : "";
    const date = item.date ? String(item.date).trim() : "";
    meta.textContent = [from, date].filter(Boolean).join(" • ") || "—";

    const actions = document.createElement("div");
    actions.className = "unmatched-actions";

    const markCode = document.createElement("button");
    markCode.className = "secondary";
    markCode.textContent = "Это код";
    markCode.addEventListener("click", () => {
      markUnmatched(item, true);
    });

    const markNoCode = document.createElement("button");
    markNoCode.className = "ghost";
    markNoCode.textContent = "Не код";
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

async function init() {
  const stored = await storageGet([
    "gmailQuery",
    "gmailUnreadOnly",
    "gmailLastEntry",
    "gmailEmail",
    "gmailUnmatched",
    "gmailSenderAllowlist",
    "gmailSenderBlocklist",
    "gmailHistory",
    "gmailLastCheckTime",
    "gmailThreshold",
    "gmailMode"
  ]);
  gmailQuery = normalizeGmailQuery(stored.gmailQuery);
  gmailUnreadOnly = !!stored.gmailUnreadOnly;
  gmailEntry = stored.gmailLastEntry || null;
  gmailEmail = stored.gmailEmail || "";
  unmatchedMessages = Array.isArray(stored.gmailUnmatched) ? stored.gmailUnmatched : [];
  senderAllowlist = Array.isArray(stored.gmailSenderAllowlist) ? stored.gmailSenderAllowlist : [];
  senderBlocklist = Array.isArray(stored.gmailSenderBlocklist) ? stored.gmailSenderBlocklist : [];
  gmailHistory = Array.isArray(stored.gmailHistory) ? stored.gmailHistory : [];
  gmailThreshold = typeof stored.gmailThreshold === "number" ? stored.gmailThreshold : 3;
  gmailMode = stored.gmailMode || "auto";
  
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
  }
  if (lastCheckEl) {
    lastCheckEl.textContent = formatTime(stored.gmailLastCheckTime);
  }
  
  renderGmailPanel();
  renderUnmatchedList();
  renderHistory();
  
  setStatus(gmailEmail ? TEXT.idle : TEXT.connectNeeded);
  if (gmailEmail) {
    setTimeout(() => {
      fetchLatestGmailCode({ silent: true });
    }, 250);
  }
  
  renderLogs();
}

async function fetchLatestGmailCode({ silent = false } = {}) {
  const query = normalizeGmailQuery(gmailQueryEl ? gmailQueryEl.value : "");
  if (gmailQueryEl) {
    gmailQueryEl.value = query;
  }
  if (!silent) {
    setStatus(TEXT.searching);
  }
  if (gmailFetchCodeBtn) {
    gmailFetchCodeBtn.disabled = true;
  }
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GMAIL_FETCH_LAST_CODE",
      query
    });
    if (response && response.ok) {
      setGmailEntry(response.code || null);
      
      const stored = await storageGet(["gmailUnmatched", "gmailHistory", "gmailLastCheckTime"]);
      unmatchedMessages = Array.isArray(stored.gmailUnmatched) ? stored.gmailUnmatched : [];
      gmailHistory = Array.isArray(stored.gmailHistory) ? stored.gmailHistory : [];
      
      if (lastCheckEl) {
        lastCheckEl.textContent = formatTime(stored.gmailLastCheckTime);
      }
      
      renderUnmatchedList();
      renderHistory();
      
      if (!silent) {
        setStatus(response.code ? TEXT.found : TEXT.notFound);
      }
    } else {
      if (!silent) {
        setStatus(TEXT.searchError);
      }
    }
  } catch {
    if (!silent) {
      setStatus(TEXT.searchError);
    }
  } finally {
    if (gmailFetchCodeBtn) {
      gmailFetchCodeBtn.disabled = !gmailEmail;
    }
  }
}

if (gmailThresholdEl) {
  gmailThresholdEl.addEventListener("input", () => {
    gmailThreshold = parseInt(gmailThresholdEl.value, 10);
    thresholdValEl.textContent = gmailThreshold;
  });
  gmailThresholdEl.addEventListener("change", () => {
    storageSet({ gmailThreshold });
  });
}

if (exportDataBtn) {
  exportDataBtn.addEventListener("click", async () => {
    const data = await storageGet([
      "gmailQuery",
      "gmailThreshold",
      "gmailSenderAllowlist",
      "gmailSenderBlocklist"
    ]);
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

if (undoActionBtn) {
  undoActionBtn.addEventListener("click", async () => {
    if (!lastAction) return;
    const { item, isCode, domain } = lastAction;
    
    if (isCode && domain) {
      senderAllowlist = senderAllowlist.filter(d => d !== domain);
      await storageSet({ gmailSenderAllowlist: senderAllowlist });
    }
    if (!isCode && domain) {
      senderBlocklist = senderBlocklist.filter(d => d !== domain);
      await storageSet({ gmailSenderBlocklist: senderBlocklist });
    }
    
    unmatchedMessages = [item, ...unmatchedMessages].slice(0, 40);
    await storageSet({ gmailUnmatched: unmatchedMessages });
    
    lastAction = null;
    undoActionBtn.disabled = true;
    renderUnmatchedList();
          setStatus(TEXT.undoOk);
      });
    }
    
    if (modeAutoBtn) {
      modeAutoBtn.addEventListener("click", async () => {
        if (gmailMode === "auto") return;
        gmailMode = "auto";
        await chrome.runtime.sendMessage({ type: "GMAIL_MODE_AUTO" });
        renderGmailPanel();
      });
    }
    
    if (modeManualBtn) {
      modeManualBtn.addEventListener("click", async () => {
        if (gmailMode === "manual") return;
        gmailMode = "manual";
        await chrome.runtime.sendMessage({ type: "GMAIL_MODE_MANUAL" });
        renderGmailPanel();
      });
    }
    
    if (gmailQueryEl) {
      gmailQueryEl.addEventListener("input", () => {
    
    if (gmailQueryTimer) clearTimeout(gmailQueryTimer);
    gmailQueryTimer = setTimeout(() => {
      const normalized = normalizeGmailQuery(gmailQueryEl.value);
      if (normalized !== gmailQuery) {
        gmailQuery = normalized;
        storageSet({ gmailQuery: normalized });
        setGmailEntry(null);
      }
    }, 400);
  });
  gmailQueryEl.addEventListener("change", () => {
    const normalized = normalizeGmailQuery(gmailQueryEl.value);
    gmailQueryEl.value = normalized;
    if (normalized !== gmailQuery) {
      gmailQuery = normalized;
      storageSet({ gmailQuery: normalized });
      setGmailEntry(null);
    }
  });
}

if (gmailUnreadOnlyEl) {
  gmailUnreadOnlyEl.addEventListener("change", () => {
    const nextValue = !!gmailUnreadOnlyEl.checked;
    if (nextValue !== gmailUnreadOnly) {
      gmailUnreadOnly = nextValue;
      storageSet({ gmailUnreadOnly });
      setGmailEntry(null);
    }
  });
}

if (gmailConnectBtn) {
  gmailConnectBtn.addEventListener("click", async () => {
    gmailConnectBtn.disabled = true;
    setStatus(TEXT.connectInProgress);
    try {
      const response = await chrome.runtime.sendMessage({ type: "GMAIL_CONNECT" });
      if (response && response.ok) {
        gmailEmail = response.email || "";
        await storageSet({ gmailEmail });
        setStatus(gmailEmail ? TEXT.connectOk : TEXT.connectNeeded);
      } else {
        setStatus(TEXT.connectError);
      }
    } catch {
      setStatus(TEXT.connectError);
    } finally {
              gmailConnectBtn.disabled = false;
              renderGmailPanel(); // Ensure mode buttons are enabled/disabled correctly
            }
          });
      }
      
      if (gmailDisconnectBtn) {
        gmailDisconnectBtn.addEventListener("click", async () => {
          gmailDisconnectBtn.disabled = true;
          setStatus(TEXT.disconnectInProgress);
          try {
            await chrome.runtime.sendMessage({ type: "GMAIL_DISCONNECT" });
            gmailEmail = "";
            setGmailEntry(null);
            await storageSet({ gmailEmail: "" });
            // Clear mode state as well if disconnected
            gmailMode = "auto";
            await chrome.runtime.sendMessage({ type: "GMAIL_MODE_AUTO" }); // Ensure alarm is reset
            setStatus(TEXT.disconnectOk);
          } catch {
            setStatus(TEXT.disconnectError);
          } finally {
            gmailDisconnectBtn.disabled = false;
            renderGmailPanel(); // Ensure mode buttons are enabled/disabled correctly
          }
        });
      }
      if (gmailFetchCodeBtn) {
  gmailFetchCodeBtn.addEventListener("click", () => {
    fetchLatestGmailCode({ silent: false });
  });
}

if (unmatchedClearBtn) {
  unmatchedClearBtn.addEventListener("click", async () => {
    unmatchedMessages = [];
    await storageSet({ gmailUnmatched: [] });
    renderUnmatchedList();
  });
}

if (gmailCopyCodeBtn) {
  gmailCopyCodeBtn.addEventListener("click", async () => {
    const code = gmailEntry && gmailEntry.code ? String(gmailEntry.code).trim() : "";
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setStatus(TEXT.copied);
    } catch {
      setStatus(TEXT.copyError);
    }
  });
}

if (gmailCodeEl) {
  gmailCodeEl.addEventListener("click", () => {
    if (gmailCopyCodeBtn) gmailCopyCodeBtn.click();
  });
  gmailCodeEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (gmailCopyCodeBtn) gmailCopyCodeBtn.click();
    }
  });
}

init().catch(() => setStatus(TEXT.loadError));
