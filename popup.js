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

async function init() {
  const stored = await storageGet([
    "gmailQuery",
    "gmailUnreadOnly",
    "gmailLastEntry",
    "gmailEmail"
  ]);
  gmailQuery = normalizeGmailQuery(stored.gmailQuery);
  gmailUnreadOnly = !!stored.gmailUnreadOnly;
  gmailEntry = stored.gmailLastEntry || null;
  gmailEmail = stored.gmailEmail || "";
  if (gmailQueryEl) {
    gmailQueryEl.value = gmailQuery;
  }
  renderGmailPanel();
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
