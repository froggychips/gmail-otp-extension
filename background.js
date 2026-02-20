const GMAIL_QUERY_DEFAULT =
  "subject:(code OR verification OR подтверждение OR код)";
const GMAIL_ALARM_NAME = "gmailWatch";
const GMAIL_ALARM_MINUTES = 1;

const STORAGE_KEYS = {
  email: "gmailEmail",
  query: "gmailQuery",
  unreadOnly: "gmailUnreadOnly",
  lastEntry: "gmailLastEntry",
  lastMessageId: "gmailLastMessageId",
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

const MAX_LOG_ENTRIES = 50;

async function log(...args) {
  const newEntry = {
    ts: Date.now(),
    msg: args.map(arg => {
      if (arg instanceof Error) {
        return { message: arg.message, stack: arg.stack };
      }
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    })
  };

  const { [STORAGE_KEYS.logs]: logs = [] } = await new Promise(resolve =>
    chrome.storage.local.get(STORAGE_KEYS.logs, resolve)
  );

  logs.unshift(newEntry);
  if (logs.length > MAX_LOG_ENTRIES) {
    logs.length = MAX_LOG_ENTRIES;
  }

  await new Promise(resolve =>
    chrome.storage.local.set({ [STORAGE_KEYS.logs]: logs }, resolve)
  );
}

function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(token);
    });
  });
}

async function gmailApiRequest(path, options = {}) {
  const token = options.token || (await getAuthToken());
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    }
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("auth_error");
    }
    throw new Error(`Gmail API error: ${res.status}`);
  }
  return res.json();
}

async function fetchGmailProfile(token) {
  const data = await gmailApiRequest("profile", { token });
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

async function fetchLatestGmailCode(overrideQuery = "") {
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

  const baseQuery = providedQuery || storedQuery || GMAIL_QUERY_DEFAULT;
  const extraParts = [];
  if (!/\bin:\w+/i.test(baseQuery)) extraParts.push("in:inbox");
  if (!/\bnewer_than:\w+/i.test(baseQuery)) extraParts.push("newer_than:2d");
  if (unreadOnly && !/\bis:unread\b/i.test(baseQuery)) extraParts.push("is:unread");
  const query = mergeQueryParts(baseQuery, extraParts);

  const token = await getAuthToken(false);
  const data = await gmailApiRequest(
    `messages?maxResults=5&q=${encodeURIComponent(query)}`,
    { token }
  );
  if (!data.messages?.length) return null;

  let best = null;
  const unmatched = [];
  for (const item of data.messages) {
    if (!item || !item.id) continue;
    const msg = await gmailApiRequest(`messages/${item.id}?format=full`, { token });
    const snippet = msg.snippet || "";
    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const date = getHeader(headers, "Date");
    const bodyText = extractTextFromPayload(msg.payload);
    const senderDomain = extractEmailDomain(from);
    
    if (senderDomain && senderBlocklist.includes(senderDomain)) {
      continue;
    }

    const code =
      findOtpCode(subject) ||
      findOtpCode(snippet) ||
      findOtpCode(bodyText);
      
    const senderBonus = senderDomain && senderAllowlist.includes(senderDomain) ? 3 : 0;
    
    if (!code) {
      if (containsOtpKeywords(subject) || containsOtpKeywords(snippet)) {
        unmatched.push({
          id: item.id,
          from,
          subject,
          date,
          snippet,
          domain: senderDomain || ""
        });
      }
      continue;
    }
    
    const score = scoreCodeCandidate({ code, subject, from, snippet, body: bodyText }) + senderBonus;
    
    if (score < threshold) continue;
    
    const entry = { code, id: item.id, snippet, subject, from, date, score };
    if (!best || entry.score > best.score) {
      best = entry;
    }
  }

  if (!best) {
    await saveUnmatchedMessages(unmatched);
  }
  if (best) {
    const { score, ...result } = best;
    return result;
  }
  return null;
}

let lastCodeId = null;

async function runGmailWatch() {
  try {
    const stored = await new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.email, STORAGE_KEYS.history], (data) => resolve(data || {}));
    });
    if (!stored[STORAGE_KEYS.email]) return;

    const now = Date.now();
    chrome.storage.local.set({ [STORAGE_KEYS.lastCheckTime]: now });

    if (!lastCodeId) {
      lastCodeId = await getStoredLastGmailId();
    }
    const codeData = await fetchLatestGmailCode();
    if (codeData && codeData.id !== lastCodeId) {
      lastCodeId = codeData.id;
      await setStoredLastGmailId(lastCodeId);
      
      // Update history
      let history = Array.isArray(stored[STORAGE_KEYS.history]) ? stored[STORAGE_KEYS.history] : [];
      history = [codeData, ...history].slice(0, 10);
      
      chrome.storage.local.set({ 
        [STORAGE_KEYS.lastEntry]: codeData,
        [STORAGE_KEYS.history]: history
      }, () => {});

      chrome.notifications.create("gmail-otp", {
        type: "basic",
        iconUrl: "icons/frogus-128.png",
        title: "Gmail OTP",
        message: `Найден код: ${codeData.code}.`,
        priority: 2
      });
    }
  } catch (e) {
    if (e && e.message === "auth_error") {
      try {
        const token = await getAuthToken(false);
        if (token) await removeCachedToken(token);
      } catch {}
    }
    log("[GmailWatch] Skip check:", e.message);
  }
}

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

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarms();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === GMAIL_ALARM_NAME) {
    runGmailWatch();
  }
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
    chrome.storage.local.get(STORAGE_KEYS.logs, (data) => {
      sendResponse({ logs: data[STORAGE_KEYS.logs] || [] });
    });
    return true;
  }

  if (message.type === MSG.clearLogs) {
    chrome.storage.local.remove(STORAGE_KEYS.logs, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === MSG.connect) {
    (async () => {
      try {
        log("Attempting to connect...");
        const token = await getAuthToken(true);
        if (!token) throw new Error("Token retrieval failed (empty)");
        log("Token retrieved, fetching profile...");
        const email = await fetchGmailProfile(token);
        if (email) {
          log("Connected as:", email);
          chrome.storage.local.set({ [STORAGE_KEYS.email]: email }, () => {});
        } else {
            throw new Error("Failed to fetch email from profile");
        }
        sendResponse({ ok: true, email });
      } catch (error) {
        const errStr = String(error || "failed");
        log("Connect error:", error);
        sendResponse({ ok: false, error: errStr });
      }
    })();
    return true;
  }

  if (message.type === MSG.disconnect) {
    (async () => {
      try {
        const token = await getAuthToken(false);
        if (token) {
          await removeCachedToken(token);
        }
      } catch {}
      chrome.storage.local.set({
        [STORAGE_KEYS.email]: null,
        [STORAGE_KEYS.lastEntry]: null,
        [STORAGE_KEYS.lastMessageId]: null
      }, () => {});
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === MSG.fetch) {
    fetchLatestGmailCode(message.query || "")
      .then((code) => {
        if (code) {
          chrome.storage.local.set({ [STORAGE_KEYS.lastEntry]: code }, () => {});
        }
        sendResponse({ ok: !!code, code });
      })
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  return false;
});
