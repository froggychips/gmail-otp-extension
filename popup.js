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
const unmatchedListEl = document.getElementById("unmatchedList");
const unmatchedClearBtn = document.getElementById("unmatchedClear");

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
  loadError: "Ошибка загрузки"
};

let gmailEntry = null;
let gmailEmail = "";
let gmailQuery = "";
let gmailUnreadOnly = false;
let gmailQueryTimer = null;
let unmatchedMessages = [];
let senderAllowlist = [];
let senderBlocklist = [];

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
    "gmailSenderBlocklist"
  ]);
  gmailQuery = normalizeGmailQuery(stored.gmailQuery);
  gmailUnreadOnly = !!stored.gmailUnreadOnly;
  gmailEntry = stored.gmailLastEntry || null;
  gmailEmail = stored.gmailEmail || "";
  unmatchedMessages = Array.isArray(stored.gmailUnmatched) ? stored.gmailUnmatched : [];
  senderAllowlist = Array.isArray(stored.gmailSenderAllowlist) ? stored.gmailSenderAllowlist : [];
  senderBlocklist = Array.isArray(stored.gmailSenderBlocklist) ? stored.gmailSenderBlocklist : [];
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
  }
  renderGmailPanel();
  renderUnmatchedList();
  setStatus(gmailEmail ? TEXT.idle : TEXT.connectNeeded);
  if (gmailEmail) {
    setTimeout(() => {
      fetchLatestGmailCode({ silent: true });
    }, 250);
  }
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
      const stored = await storageGet(["gmailUnmatched"]);
      unmatchedMessages = Array.isArray(stored.gmailUnmatched) ? stored.gmailUnmatched : [];
      renderUnmatchedList();
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
      renderGmailPanel();
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
      setStatus(TEXT.disconnectOk);
    } catch {
      setStatus(TEXT.disconnectError);
    } finally {
      gmailDisconnectBtn.disabled = false;
      renderGmailPanel();
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
