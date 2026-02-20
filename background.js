const STORAGE_KEYS = {
  accounts: "gmailAccounts", // Array of { email, lastMessageId }
  query: "gmailQuery",
  unreadOnly: "gmailUnreadOnly",
  lastEntry: "gmailLastEntry",
  unmatched: "gmailUnmatched",
  senderAllowlist: "gmailSenderAllowlist",
  senderBlocklist: "gmailSenderBlocklist",
  lastCheckTime: "gmailLastCheckTime",
  history: "gmailHistory",
  threshold: "gmailThreshold",
  mode: "gmailMode",
  logs: "gmailLogs"
};

const MSG = {
  connect: "GMAIL_CONNECT",
  disconnect: "GMAIL_DISCONNECT",
  fetch: "GMAIL_FETCH_LAST_CODE",
  modeAuto: "GMAIL_MODE_AUTO",
  modeManual: "GMAIL_MODE_MANUAL",
  getLogs: "GMAIL_GET_LOGS",
  clearLogs: "GMAIL_CLEAR_LOGS"
};

const MAX_ACCOUNTS = 3;
const MAX_LOG_ENTRIES = 50;
let currentOtpCode = null;   // последний найденный код для контекстного меню

async function log(...args) {
  const newEntry = {
    ts: Date.now(),
    msg: args.map(arg => {
      if (arg instanceof Error) return { message: arg.message, stack: arg.stack };
      try { return JSON.parse(JSON.stringify(arg)); } catch { return String(arg); }
    })
  };
  const { [STORAGE_KEYS.logs]: logs = [] } = await new Promise(resolve => chrome.storage.local.get(STORAGE_KEYS.logs, resolve));
  logs.unshift(newEntry);
  if (logs.length > MAX_LOG_ENTRIES) logs.length = MAX_LOG_ENTRIES;
  await new Promise(resolve => chrome.storage.local.set({ [STORAGE_KEYS.logs]: logs }, resolve));
}

function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    // Note: for multi-account, chrome.identity usually uses the primary profile account.
    // To support multiple specific accounts in the background, the user must have selected them.
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(token);
    });
  });
}

async function gmailApiRequest(path, token) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "no body");
    await log(`Gmail API Error [${res.status}]:`, errorBody);
    if (res.status === 401 || res.status === 403) throw new Error("auth_error");
    if (res.status === 429) {
      await log("Gmail rate limit (429). Waiting 60 seconds...");
      await new Promise(r => setTimeout(r, 60000));
      throw new Error("rate_limit");
    }
    throw new Error(`Gmail API error: ${res.status}`);
  }
  return res.json();
}

async function fetchGmailProfile(token) {
  const data = await gmailApiRequest("profile", token);
  return data && data.emailAddress ? data.emailAddress : "";
}

async function removeCachedToken(token) {
  if (!chrome.identity || !chrome.identity.removeCachedAuthToken) return;
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => resolve());
  });
}

function getHeader(headers, name) {
  if (!Array.isArray(headers)) return "";
  const found = headers.find(
    (h) => h && h.name && h.name.toLowerCase() === name.toLowerCase()
  );
  return found && found.value ? String(found.value) : "";
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

function base64UrlDecode(input) {
  if (!input) return "";
  const fixed = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = fixed.length % 4 === 0 ? "" : "=".repeat(4 - (fixed.length % 4));
  try {
    return atob(fixed + pad);
  } catch {
    return "";
  }
}

function extractTextFromPayload(payload) {
  if (!payload) return "";
  const mime = String(payload.mimeType || "").toLowerCase();
  if (mime.startsWith("text/plain") && payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }
  if (mime.startsWith("text/html") && payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const text = extractTextFromPayload(part);
      if (text) return text;
    }
  }
  return "";
}

function findOtpCode(text) {
  if (!text) return "";
  const cleaned = String(text)
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\r\n]+/g, " ");
  const numeric = cleaned.match(/\b\d{4,8}\b/);
  if (numeric) return numeric[0];
  const alphaNum = cleaned.match(/\b[A-Z0-9]{6,8}\b/i);
  return alphaNum ? alphaNum[0] : "";
}

function containsOtpKeywords(text) {
  if (!text) return false;
  return /otp|2fa|verification|verify|security|confirm|login|auth|код|подтверж|провер|вход/i.test(text);
}

function isLikelyPhoneOrOrder(text) {
  if (!text) return false;
  if (/\+?\d[\d\s\-()]{8,}/.test(text)) return true;
  if (/order|заказ|invoice|счет|tracking|доставка|shipment/i.test(text)) return true;
  if (/\b(id|номер|ref|reference|order)\b/i.test(text)) return true;
  return false;
}

function scoreCodeCandidate({ code, subject, from, snippet, body }) {
  let score = 0;
  const haystack = [subject, from, snippet, body].filter(Boolean).join("\n");
  const hasKeywords = containsOtpKeywords(haystack);
  if (hasKeywords) score += 3;
  if (containsOtpKeywords(subject)) score += 2;
  if (containsOtpKeywords(snippet)) score += 1;
  if (containsOtpKeywords(body)) score += 1;
  if (/\b\d{6}\b/.test(code)) score += 2;
  if (/\b\d{4}\b/.test(code)) score += 1;
  if (/^[A-Z0-9]{6,8}$/i.test(code)) score -= 1;
  if (isLikelyPhoneOrOrder(haystack)) score -= 3;
  return score;
}

function normalizeQuery(query) {
  const q = String(query || "").trim();
  if (!q) return "";
  return q;
}

function mergeQueryParts(query, extraParts = []) {
  const parts = [query, ...extraParts].filter(Boolean);
  return parts.join(" ").trim();
}

async function getStoredGmailQuery() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.query], (data) => {
      resolve(data && data[STORAGE_KEYS.query] ? String(data[STORAGE_KEYS.query]) : "");
    });
  });
}

async function getStoredGmailUnreadOnly() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.unreadOnly], (data) => {
      resolve(!!(data && data[STORAGE_KEYS.unreadOnly]));
    });
  });
}

async function getStoredSenderList(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (data) => {
      const list = data && Array.isArray(data[key]) ? data[key] : [];
      resolve(list.map((item) => String(item).toLowerCase()).filter(Boolean));
    });
  });
}

async function getStoredUnmatched() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.unmatched], (data) => {
      resolve(data && Array.isArray(data[STORAGE_KEYS.unmatched]) ? data[STORAGE_KEYS.unmatched] : []);
    });
  });
}

async function saveUnmatchedMessages(entries) {
  if (!entries.length) return;
  const existing = await getStoredUnmatched();
  const byId = new Map(existing.map((item) => [item.id, item]));
  entries.forEach((item) => {
    if (item && item.id && !byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });
  const merged = Array.from(byId.values()).slice(0, 40);
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.unmatched]: merged }, () => resolve());
  });
}

async function getStoredLastGmailId() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.lastMessageId], (data) => {
      resolve(data && data[STORAGE_KEYS.lastMessageId] ? String(data[STORAGE_KEYS.lastMessageId]) : "");
    });
  });
}

async function setStoredLastGmailId(id) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.lastMessageId]: id || null }, () => resolve());
  });
}

async function fetchLatestGmailCode(token, overrideQuery = "") {
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get([
      STORAGE_KEYS.query,
      STORAGE_KEYS.unreadOnly,
      STORAGE_KEYS.senderAllowlist,
      STORAGE_KEYS.senderBlocklist,
      STORAGE_KEYS.threshold
    ], (data) => resolve(data || {}));
  });

  const storedQuery = normalizeQuery(stored[STORAGE_KEYS.query]);
  const providedQuery = normalizeQuery(overrideQuery);
  const unreadOnly = !!stored[STORAGE_KEYS.unreadOnly];
  const senderAllowlist = Array.isArray(stored[STORAGE_KEYS.senderAllowlist]) ? stored[STORAGE_KEYS.senderAllowlist] : [];
  const senderBlocklist = Array.isArray(stored[STORAGE_KEYS.senderBlocklist]) ? stored[STORAGE_KEYS.senderBlocklist] : [];
  const threshold = typeof stored[STORAGE_KEYS.threshold] === "number" ? stored[STORAGE_KEYS.threshold] : 3;

  const baseQuery = providedQuery || storedQuery || "newer_than:1h subject:(code OR verification OR подтверждение OR код)";
  const extraParts = [];
  if (!/\bin:\w+/i.test(baseQuery)) extraParts.push("in:inbox");
  if (unreadOnly && !/\bis:unread\b/i.test(baseQuery)) extraParts.push("is:unread");
  const query = mergeQueryParts(baseQuery, extraParts);
  await log("Searching Gmail with query:", query);

  const data = await gmailApiRequest(`messages?maxResults=30&q=${encodeURIComponent(query)}`, token);
  if (!data.messages?.length) {
    await log("No messages matching query found.");
    return null;
  }

  await log(`Found ${data.messages.length} potential messages. Analyzing...`);
  let best = null;
  const unmatched = [];
  for (const item of data.messages) {
    if (!item || !item.id) continue;
    const msg = await gmailApiRequest(`messages/${item.id}?format=full`, token);
    const snippet = msg.snippet || "";
    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const date = getHeader(headers, "Date");
    const bodyText = extractTextFromPayload(msg.payload);
    const senderDomain = extractEmailDomain(from);
    
    if (senderDomain && senderBlocklist.includes(senderDomain)) continue;

    const code = findOtpCode(subject) || findOtpCode(snippet) || findOtpCode(bodyText);
    const senderBonus = senderDomain && senderAllowlist.includes(senderDomain) ? 3 : 0;
    
    if (!code) {
      if (containsOtpKeywords(subject) || containsOtpKeywords(snippet)) {
        unmatched.push({ id: item.id, from, subject, date, snippet, domain: senderDomain || "" });
      }
      continue;
    }
    
    let score = scoreCodeCandidate({ code, subject, from, snippet, body: bodyText }) + senderBonus;
    
    // Patch bonuses
    const codeLen = code.length;
    if (codeLen === 6 && /^\d{6}$/.test(code)) score += 3;
    if (codeLen >= 4 && codeLen <= 8) score += 1;
    if (bodyText && (bodyText.startsWith(code) || bodyText.endsWith(code))) score += 2;
    if (subject && (subject.includes(code) && subject.indexOf(code) < 20)) score += 2;

    if (score < threshold) continue;
    
    const entry = { code, id: item.id, snippet, subject, from, date, score };
    if (!best || entry.score > best.score) {
      best = entry;
      await log(`Candidate code found: ${code} (Score: ${score})`);
    }
  }

  if (!best) {
    await log("Analysis complete. No valid OTP codes identified.");
    await saveUnmatchedMessages(unmatched);
  } else {
    await log(`Best code identified: ${best.code}`);
  }
  return null;
}

async function runGmailWatch() {
  try {
    const { [STORAGE_KEYS.accounts]: accounts = [], [STORAGE_KEYS.history]: history = [] } = await new Promise(resolve => 
      chrome.storage.local.get([STORAGE_KEYS.accounts, STORAGE_KEYS.history], resolve)
    );
    if (!accounts.length) return;

    chrome.storage.local.set({ [STORAGE_KEYS.lastCheckTime]: Date.now() });

    // Iterate through all accounts
    for (const account of accounts) {
      try {
        // We attempt to get a token. For secondary accounts this might fail in background 
        // if not recently refreshed, but chrome.identity handles most of it.
        const token = await getAuthToken(false);
        const codeData = await fetchLatestGmailCode(token);
        
        if (codeData && codeData.id !== account.lastMessageId) {
          account.lastMessageId = codeData.id;
          codeData.account = account.email; // Tag with account email
          updateOtpContextMenu(codeData.code);   // обновляем контекстное меню
          
          let newHistory = [codeData, ...history].slice(0, 10);
          await new Promise(resolve => chrome.storage.local.set({ 
            [STORAGE_KEYS.accounts]: accounts,
            [STORAGE_KEYS.lastEntry]: codeData,
            [STORAGE_KEYS.history]: newHistory
          }, resolve));

          chrome.notifications.create(`otp-${account.email}`, {
            type: "basic",
            iconUrl: "icons/frogus-128.png",
            title: `Gmail OTP (${account.email})`,
            message: `Код: ${codeData.code}`,
            priority: 2
          });
        }
      } catch (err) {
        log(`[Watch] Error for ${account.email}:`, err.message);
        continue;
      }
    }
  } catch (e) {
    log("[GmailWatch] Global error:", e.message);
  }
}

const GMAIL_ALARM_NAME = "gmailWatch";
const GMAIL_ALARM_MINUTES = 1;

async function ensureAlarms() {
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.mode], (data) => resolve(data || {}));
  });
  const mode = stored[STORAGE_KEYS.mode] || "auto";
  updateAlarmState(mode);
}

function updateAlarmState(mode) {
  if (mode === "auto") {
    chrome.alarms.create(GMAIL_ALARM_NAME, { periodInMinutes: GMAIL_ALARM_MINUTES });
  } else {
    chrome.alarms.clear(GMAIL_ALARM_NAME);
  }
}

// === CONTEXT MENU ===
function updateOtpContextMenu(code) {
  if (!code) return;
  currentOtpCode = code;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "pasteOtp",
      title: `Вставить OTP: ${code}`,
      contexts: ["editable", "password", "text", "search", "tel", "url", "number"]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => ensureAlarms());
chrome.runtime.onStartup.addListener(() => ensureAlarms());
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === GMAIL_ALARM_NAME) runGmailWatch();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) return false;

  if (message.type === MSG.modeAuto) {
    chrome.storage.local.set({ [STORAGE_KEYS.mode]: "auto" }, () => {
      updateAlarmState("auto");
      log("Switched to Auto mode");
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === MSG.modeManual) {
    chrome.storage.local.set({ [STORAGE_KEYS.mode]: "manual" }, () => {
      updateAlarmState("manual");
      log("Switched to Manual mode");
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === MSG.getLogs) {
    chrome.storage.local.get(STORAGE_KEYS.logs, (data) => sendResponse({ logs: data[STORAGE_KEYS.logs] || [] }));
    return true;
  }

  if (message.type === MSG.clearLogs) {
    chrome.storage.local.remove(STORAGE_KEYS.logs, () => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === MSG.connect) {
    (async () => {
      try {
        const currentId = chrome.runtime.id;
        await log("Starting connect flow. Extension ID:", currentId);
        await log("Attempting to add account...");
        const token = await getAuthToken(true);
        if (!token) throw new Error("No token returned");
        
        await log("Token received, fetching profile...");
        const email = await fetchGmailProfile(token);
        if (email) {
          const { [STORAGE_KEYS.accounts]: accounts = [] } = await new Promise(r => chrome.storage.local.get(STORAGE_KEYS.accounts, r));
          if (accounts.some(a => a.email === email)) {
            await log("Account already exists:", email);
          } else if (accounts.length >= MAX_ACCOUNTS) {
            throw new Error(`Max ${MAX_ACCOUNTS} accounts allowed`);
          } else {
            accounts.push({ email, lastMessageId: null });
            await new Promise(r => chrome.storage.local.set({ [STORAGE_KEYS.accounts]: accounts }, r));
            await log("Account added:", email);
          }
          sendResponse({ ok: true, email, accounts });
        } else {
          throw new Error("Failed to fetch email");
        }
      } catch (error) {
        const errMsg = error.message || String(error);
        await log("Connect error:", errMsg);
        sendResponse({ ok: false, error: errMsg });
      }
    })();
    return true;
  }

  if (message.type === MSG.disconnect) {
    (async () => {
      try {
        const targetEmail = message.email;
        const { [STORAGE_KEYS.accounts]: accounts = [] } = await new Promise(r => chrome.storage.local.get(STORAGE_KEYS.accounts, r));
        const filtered = accounts.filter(a => a.email !== targetEmail);
        
        const token = await getAuthToken(false).catch(() => null);
        if (token) {
          await removeCachedToken(token);
          await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).catch(() => {});
        }
        
        await new Promise(r => chrome.storage.local.set({ [STORAGE_KEYS.accounts]: filtered }, r));
        log("Account removed:", targetEmail);
        sendResponse({ ok: true, accounts: filtered });
      } catch (e) {
        log("Disconnect error:", e);
        sendResponse({ ok: false });
      }
    })();
    return true;
  }

  if (message.type === MSG.fetch) {
    (async () => {
      try {
        const { [STORAGE_KEYS.accounts]: accounts = [] } = await new Promise(r => chrome.storage.local.get(STORAGE_KEYS.accounts, r));
        if (!accounts.length) throw new Error("No accounts");
        
        // Manual fetch checks ALL accounts and returns the best overall code
        let bestCode = null;
        for (const account of accounts) {
          const token = await getAuthToken(false).catch(() => null);
          if (!token) continue;
          const code = await fetchLatestGmailCode(token, message.query || "");
          if (code && (!bestCode || code.date > bestCode.date)) {
            bestCode = { ...code, account: account.email };
          }
        }
        if (bestCode) chrome.storage.local.set({ [STORAGE_KEYS.lastEntry]: bestCode });
        sendResponse({ ok: !!bestCode, code: bestCode });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});

// === КЛИК ПО КОНТЕКСТНОМУ МЕНЮ ===
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pasteOtp" && currentOtpCode && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "PASTE_OTP",
      code: currentOtpCode
    });
  }
});
