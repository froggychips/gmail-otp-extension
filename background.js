const GMAIL_QUERY_DEFAULT =
  "subject:(code OR verification OR подтверждение OR код)";
const GMAIL_ALARM_NAME = "gmailWatch";
const GMAIL_ALARM_MINUTES = 1;

const STORAGE_KEYS = {
  email: "gmailEmail",
  query: "gmailQuery",
  unreadOnly: "gmailUnreadOnly",
  lastEntry: "gmailLastEntry",
  lastMessageId: "gmailLastMessageId"
};

const MSG = {
  connect: "GMAIL_CONNECT",
  disconnect: "GMAIL_DISCONNECT",
  fetch: "GMAIL_FETCH_LAST_CODE"
};

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
  const storedQuery = normalizeQuery(await getStoredGmailQuery());
  const providedQuery = normalizeQuery(overrideQuery);
  const unreadOnly = await getStoredGmailUnreadOnly();
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
  for (const item of data.messages) {
    if (!item || !item.id) continue;
    const msg = await gmailApiRequest(`messages/${item.id}?format=full`, { token });
    const snippet = msg.snippet || "";
    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const date = getHeader(headers, "Date");
    const bodyText = extractTextFromPayload(msg.payload);
    const code =
      findOtpCode(subject) ||
      findOtpCode(snippet) ||
      findOtpCode(bodyText);
    if (!code) continue;
    const score = scoreCodeCandidate({ code, subject, from, snippet, body: bodyText });
    if (score < 3) continue;
    const entry = { code, id: item.id, snippet, subject, from, date, score };
    if (!best || entry.score > best.score) {
      best = entry;
    }
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
      chrome.storage.local.get([STORAGE_KEYS.email], (data) => resolve(data || {}));
    });
    if (!stored[STORAGE_KEYS.email]) return;

    if (!lastCodeId) {
      lastCodeId = await getStoredLastGmailId();
    }
    const codeData = await fetchLatestGmailCode();
    if (codeData && codeData.id !== lastCodeId) {
      lastCodeId = codeData.id;
      await setStoredLastGmailId(lastCodeId);
      chrome.storage.local.set({ [STORAGE_KEYS.lastEntry]: codeData }, () => {});

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
    console.warn("[GmailWatch] Skip check:", e.message);
  }
}

function ensureAlarms() {
  chrome.alarms.create(GMAIL_ALARM_NAME, { periodInMinutes: GMAIL_ALARM_MINUTES });
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

  if (message.type === MSG.connect) {
    (async () => {
      try {
        const token = await getAuthToken(true);
        const email = token ? await fetchGmailProfile(token) : "";
        if (email) {
          chrome.storage.local.set({ [STORAGE_KEYS.email]: email }, () => {});
        }
        sendResponse({ ok: true, email });
      } catch (error) {
        sendResponse({ ok: false, error: String(error || "failed") });
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
