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
let currentOtpCode = null;
let otpCodeTimer = null;

class RateLimiter {
  constructor() {
    this.backoff = new Map(); // email -> { retryAt, attempts }
  }

  check(email) {
    const status = this.backoff.get(email);
    if (status && status.retryAt > Date.now()) {
      return { limited: true, retryAt: status.retryAt };
    }
    return { limited: false };
  }

  limit(email) {
    const status = this.backoff.get(email) || { attempts: 0 };
    status.attempts++;
    const waitMs = Math.min(60000 * Math.pow(2, status.attempts - 1), 3600000);
    status.retryAt = Date.now() + waitMs;
    this.backoff.set(email, status);
    return waitMs;
  }

  reset(email) {
    this.backoff.delete(email);
  }
}

const rateLimiter = new RateLimiter();

class LogBuffer {
  constructor(maxSize = 50) {
    this.logs = [];
    this.maxSize = maxSize;
    this.flushTimer = null;
    this.isInitializing = true;
    this.loadExisting();
  }

  async loadExisting() {
    const data = await new Promise(r => chrome.storage.local.get(STORAGE_KEYS.logs, r));
    this.logs = data[STORAGE_KEYS.logs] || [];
    this.isInitializing = false;
  }

  add(...args) {
    const newEntry = {
      ts: Date.now(),
      msg: args.map(arg => {
        if (arg instanceof Error) return { message: arg.message };
        try {
          const str = JSON.stringify(arg);
          return str.length > 1000 ? str.substring(0, 1000) + "..." : JSON.parse(str);
        } catch { return String(arg); }
      })
    };
    this.logs.unshift(newEntry);
    if (this.logs.length > this.maxSize) this.logs.pop();
    clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.flush(), 500);
  }

  async flush() {
    if (this.isInitializing) return;
    chrome.storage.local.set({ [STORAGE_KEYS.logs]: this.logs });
  }
}

const logBuffer = new LogBuffer();
const log = (...args) => logBuffer.add(...args);

const CLIENT_ID = "629171495161-glvg17e0pshp9q15rbli2jd8b4pe4gkq.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email";

function getAuthToken(interactive = false, email = null) {
  return new Promise((resolve, reject) => {
    const redirectUrl = chrome.identity.getRedirectURL();

    let authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUrl)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `prompt=${interactive ? 'select_account consent' : 'none'}`;
    
    if (email) {
      authUrl += `&login_hint=${encodeURIComponent(email)}`;
    }

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: interactive
    }, (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : "Auth failed";
        reject(new Error(err));
        return;
      }

      try {
        const urlObj = new URL(responseUrl.replace("#", "?"));
        const token = urlObj.searchParams.get("access_token");

        if (token) {
          resolve(token);
        } else {
          const error = urlObj.searchParams.get("error");
          reject(new Error(error || "No access_token in response"));
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function gmailApiRequest(path, token, email = "unknown") {
  const status = rateLimiter.check(email);
  if (status.limited) {
    throw new Error("rate_limit_backoff");
  }

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (res.status === 429) {
    const waitMs = rateLimiter.limit(email);
    await log(`Rate limit hit for ${email}. Backing off for ${waitMs/1000}s`);
    throw new Error("rate_limit");
  }

  if (res.ok) {
    rateLimiter.reset(email);
  } else {
    const errorBody = await res.text().catch(() => "no body");
    await log(`Gmail API Error [${res.status}]:`, errorBody);
    if (res.status === 401 || res.status === 403) throw new Error("auth_error");
    throw new Error(`Gmail API error: ${res.status}`);
  }
  return res.json();
}

async function fetchGmailProfile(token) {
  const data = await gmailApiRequest("profile", token, "auth_flow");
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

function validateGmailQuery(query) {
  if (typeof query !== 'string') return "";
  const str = query.trim();
  if (str.length > 500) return str.substring(0, 500);
  // Basic injection check
  const dangerous = ['script', 'eval', 'fetch', '<', '>'];
  if (dangerous.some(word => str.toLowerCase().includes(word))) return "";
  return str;
}

function scoreCodeCandidate({ code, subject, from, snippet, body }) {
  let score = 0;
  const haystack = [subject, from, snippet, body].filter(Boolean).join("\n").toLowerCase();
  
  // 1. Keyword weight (max 4)
  const hasKeywords = containsOtpKeywords(haystack);
  if (hasKeywords) score += 2;
  if (containsOtpKeywords(subject)) score += 2;

  // 2. Format weight (max 4)
  if (/^\d{6}$/.test(code)) score += 4;      // 6 digits is gold standard
  else if (/^\d{4}$/.test(code)) score += 2; // 4 digits is common
  else if (/^[A-Z0-9]{6,8}$/i.test(code)) score += 1; // Alphanumeric

  // 3. Position weight (max 2)
  if (body && (body.trim().startsWith(code) || body.trim().endsWith(code))) score += 2;
  if (subject && subject.includes(code)) score += 1;

  // 4. Negative signs (max -5)
  if (isLikelyPhoneOrOrder(haystack)) score -= 4;
  if (code.length > 8) score -= 2;

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
  await new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.unmatched]: merged }, () => resolve());
  });
}

async function fetchLatestGmailCode(token, email = "unknown", overrideQuery = "") {
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
  const providedQuery = validateGmailQuery(overrideQuery);
  const unreadOnly = !!stored[STORAGE_KEYS.unreadOnly];
  const senderAllowlist = Array.isArray(stored[STORAGE_KEYS.senderAllowlist]) ? stored[STORAGE_KEYS.senderAllowlist] : [];
  const senderBlocklist = Array.isArray(stored[STORAGE_KEYS.senderBlocklist]) ? stored[STORAGE_KEYS.senderBlocklist] : [];
  const threshold = typeof stored[STORAGE_KEYS.threshold] === "number" ? stored[STORAGE_KEYS.threshold] : 3;

  const baseQuery = providedQuery || storedQuery || "newer_than:1h subject:(code OR verification OR подтверждение OR код)";
  const extraParts = [];
  if (!/\bin:\w+/i.test(baseQuery)) extraParts.push("in:inbox");
  if (unreadOnly && !/\bis:unread\b/i.test(baseQuery)) extraParts.push("is:unread");
  const query = mergeQueryParts(baseQuery, extraParts);
  await log(`Searching Gmail (${email}) with query:`, query);

  const data = await gmailApiRequest(`messages?maxResults=30&q=${encodeURIComponent(query)}`, token, email);
  if (!data.messages?.length) {
    await log(`No messages matching query found for ${email}.`);
    return null;
  }

  await log(`Found ${data.messages.length} potential messages for ${email}. Fetching details...`);
  
  // Parallel fetch for better performance
  const fullMessages = await Promise.all(
    data.messages.map(item => gmailApiRequest(`messages/${item.id}?format=full`, token, email).catch(() => null))
  );

  let best = null;
  const unmatched = [];
  
  for (const msg of fullMessages) {
    if (!msg) continue;
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
        unmatched.push({ id: msg.id, from, subject, date, snippet, domain: senderDomain || "" });
      }
      continue;
    }
    
    let score = scoreCodeCandidate({ code, subject, from, snippet, body: bodyText }) + senderBonus;

    if (score < threshold) {
      await log(`Code ${code} rejected. Score ${score} is below threshold ${threshold}`);
      continue;
    }
    
    const entry = { code, id: msg.id, snippet, subject, from, date, score };
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
  return best;
}

async function runGmailWatch() {
  try {
    // Re-fetch accounts to avoid race conditions
    const { [STORAGE_KEYS.accounts]: accounts = [], [STORAGE_KEYS.history]: history = [] } = await new Promise(resolve => 
      chrome.storage.local.get([STORAGE_KEYS.accounts, STORAGE_KEYS.history], resolve)
    );
    if (!accounts.length) return;

    chrome.storage.local.set({ [STORAGE_KEYS.lastCheckTime]: Date.now() });

    let updated = false;
    for (const account of accounts) {
      try {
        const token = await getAuthToken(false, account.email);
        const codeData = await fetchLatestGmailCode(token, account.email);
        
        if (codeData && codeData.id !== account.lastMessageId) {
          account.lastMessageId = codeData.id;
          codeData.account = account.email;
          updateOtpContextMenu(codeData.code);
          
          let newHistory = [codeData, ...history].slice(0, 10);
          
          // Re-fetch again just before set to be absolutely sure
          const fresh = await new Promise(r => chrome.storage.local.get([STORAGE_KEYS.accounts, STORAGE_KEYS.history], r));
          const accountsToSave = fresh[STORAGE_KEYS.accounts] || [];
          const target = accountsToSave.find(a => a.email === account.email);
          if (target) target.lastMessageId = codeData.id;

          await new Promise(resolve => chrome.storage.local.set({ 
            [STORAGE_KEYS.accounts]: accountsToSave,
            [STORAGE_KEYS.lastEntry]: codeData,
            [STORAGE_KEYS.history]: [codeData, ...(fresh[STORAGE_KEYS.history] || [])].slice(0, 10)
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
        if (err.message !== "Auth cancelled or failed") {
          await log(`[Watch] Error for ${account.email}:`, err.message);
        }
        continue;
      }
    }
  } catch (e) {
    await log("[GmailWatch] Global error:", e.message);
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

function updateOtpContextMenu(code) {
  if (!code) return;
  currentOtpCode = code;

  // TTL: Clear code after 5 minutes for security
  clearTimeout(otpCodeTimer);
  otpCodeTimer = setTimeout(() => {
    currentOtpCode = null;
    chrome.contextMenus.removeAll();
  }, 5 * 60 * 1000);

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
        
        await log("Attempting to add account (interactive picker)...");
        const token = await getAuthToken(true);
        if (!token) throw new Error("No token returned");
        
        await log("Token received, fetching profile...");
        const email = await fetchGmailProfile(token);
        if (email) {
          const { [STORAGE_KEYS.accounts]: accounts = [] } = await new Promise(r => chrome.storage.local.get(STORAGE_KEYS.accounts, r));
          
          if (accounts.some(a => a.email === email)) {
            await log("Duplicate account ignored:", email);
            throw new Error(`Account ${email} is already added`);
          } else if (accounts.length >= MAX_ACCOUNTS) {
            throw new Error(`Max ${MAX_ACCOUNTS} accounts allowed`);
          } else {
            accounts.push({ email, lastMessageId: null });
            await new Promise(r => chrome.storage.local.set({ [STORAGE_KEYS.accounts]: accounts }, r));
            await log("Account added successfully:", email);
          }
          sendResponse({ ok: true, email, accounts });
        } else {
          throw new Error("Failed to fetch email from profile");
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
        
        let bestCode = null;
        for (const account of accounts) {
          try {
            const token = await getAuthToken(false, account.email);
            const code = await fetchLatestGmailCode(token, account.email, message.query || "");
            if (code && (!bestCode || code.date > bestCode.date)) {
              bestCode = { ...code, account: account.email };
            }
          } catch (e) {}
        }
        if (bestCode) chrome.storage.local.set({ [STORAGE_KEYS.lastEntry]: bestCode });
        sendResponse({ ok: true, code: bestCode });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  return false;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pasteOtp" && currentOtpCode && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "PASTE_OTP",
      code: currentOtpCode
    });
  }
});
