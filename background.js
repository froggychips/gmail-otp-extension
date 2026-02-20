import { STORAGE_KEYS, MSG, MAX_ACCOUNTS, DEFAULT_QUERY } from './src/shared/constants.js';
import { log } from './src/background/logger.js';
import { storageGet, storageSet } from './src/background/storage.js';
import { 
  findOtpCode, 
  containsOtpKeywords, 
  scoreCodeCandidate, 
  validateGmailQuery 
} from './src/background/otp-detector.js';

let currentOtpCode = null;
let otpCodeTimer = null;
const RATE_LIMIT_BACKOFF = new Map(); // email -> { retryAt, attempts }

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
    
    if (email) authUrl += `&login_hint=${encodeURIComponent(email)}`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive }, (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        reject(new Error(chrome.runtime.lastError?.message || "Auth failed"));
        return;
      }
      try {
        const urlObj = new URL(responseUrl.replace("#", "?"));
        const token = urlObj.searchParams.get("access_token");
        if (token) resolve(token);
        else reject(new Error(urlObj.searchParams.get("error") || "No access_token in response"));
      } catch (e) { reject(e); }
    });
  });
}

async function gmailApiRequest(path, token, email = "unknown") {
  const backoff = RATE_LIMIT_BACKOFF.get(email);
  if (backoff && backoff.retryAt > Date.now()) throw new Error("rate_limit_backoff");

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (res.status === 429) {
    const attempts = (backoff?.attempts || 0) + 1;
    const waitMs = Math.min(60000 * Math.pow(2, attempts - 1), 3600000);
    RATE_LIMIT_BACKOFF.set(email, { retryAt: Date.now() + waitMs, attempts });
    await log(`Rate limit hit for ${email}. Backing off for ${waitMs/1000}s`);
    throw new Error("rate_limit");
  }

  if (res.ok) {
    RATE_LIMIT_BACKOFF.delete(email);
    return res.json();
  } else {
    const errorBody = await res.text().catch(() => "no body");
    await log(`Gmail API Error [${res.status}]:`, errorBody);
    if (res.status === 401 || res.status === 403) throw new Error("auth_error");
    throw new Error(`Gmail API error: ${res.status}`);
  }
}

async function fetchGmailProfile(token) {
  const data = await gmailApiRequest("profile", token, "auth_flow");
  return data?.emailAddress || "";
}

async function removeCachedToken(token) {
  if (!chrome.identity?.removeCachedAuthToken) return;
  return new Promise(resolve => chrome.identity.removeCachedAuthToken({ token }, resolve));
}

function getHeader(headers, name) {
  return headers?.find(h => h?.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

function extractEmailAddress(from) {
  const match = String(from || "").match(/<([^>]+)>/);
  if (match?.[1]) return match[1].trim().toLowerCase();
  const direct = String(from || "").trim().toLowerCase();
  return direct.includes("@") ? direct : "";
}

function extractEmailDomain(from) {
  const addr = extractEmailAddress(from);
  return addr ? addr.split("@")[1] || "" : "";
}

function base64UrlDecode(input) {
  if (!input) return "";
  const fixed = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = fixed.length % 4 === 0 ? "" : "=".repeat(4 - (fixed.length % 4));
  try { return atob(fixed + pad); } catch { return ""; }
}

function extractTextFromPayload(payload) {
  if (!payload) return "";
  if (payload.mimeType?.toLowerCase().startsWith("text/") && payload.body?.data) {
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

async function fetchLatestGmailCode(token, email = "unknown", overrideQuery = "") {
  const stored = await storageGet([
    STORAGE_KEYS.query, STORAGE_KEYS.unreadOnly, 
    STORAGE_KEYS.senderAllowlist, STORAGE_KEYS.senderBlocklist, STORAGE_KEYS.threshold
  ]);

  const threshold = stored[STORAGE_KEYS.threshold] || 3;
  const query = (validateGmailQuery(overrideQuery) || stored[STORAGE_KEYS.query] || DEFAULT_QUERY) + 
                (stored[STORAGE_KEYS.unreadOnly] ? " is:unread" : "") + " in:inbox";

  await log(`Searching Gmail (${email}) with query:`, query);
  const data = await gmailApiRequest(`messages?maxResults=30&q=${encodeURIComponent(query)}`, token, email);
  if (!data.messages?.length) return null;

  const fullMessages = await Promise.all(
    data.messages.map(item => gmailApiRequest(`messages/${item.id}?format=full`, token, email).catch(() => null))
  );

  const sortedMessages = fullMessages.filter(Boolean).sort((a, b) => parseInt(b.internalDate) - parseInt(a.internalDate));
  const unmatched = [];

  for (const msg of sortedMessages) {
    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const bodyText = extractTextFromPayload(msg.payload);
    const senderDomain = extractEmailDomain(from);
    
    if (senderDomain && (stored[STORAGE_KEYS.senderBlocklist] || []).includes(senderDomain)) continue;

    const code = findOtpCode(subject) || findOtpCode(msg.snippet) || findOtpCode(bodyText);
    if (!code) {
      if (containsOtpKeywords(subject) || containsOtpKeywords(msg.snippet)) {
        unmatched.push({ id: msg.id, from, subject, date: getHeader(headers, "Date"), snippet: msg.snippet, domain: senderDomain });
      }
      continue;
    }
    
    const score = scoreCodeCandidate({ 
      code, subject, from, snippet: msg.snippet, body: bodyText, 
      senderAllowlist: stored[STORAGE_KEYS.senderAllowlist], 
      senderBlocklist: stored[STORAGE_KEYS.senderBlocklist], 
      senderDomain 
    });

    if (score < threshold) {
      await log(`Code ${code} rejected (Score ${score} < ${threshold})`);
      continue;
    }
    
    const entry = { code, id: msg.id, snippet: msg.snippet, subject, from, date: getHeader(headers, "Date"), score, account: email };
    await log(`Valid code identified: ${code} (Score: ${score})`);
    return entry;
  }

  if (unmatched.length) {
    const { [STORAGE_KEYS.unmatched]: existing = [] } = await storageGet(STORAGE_KEYS.unmatched);
    const merged = [...unmatched, ...existing].slice(0, 40);
    await storageSet({ [STORAGE_KEYS.unmatched]: merged });
  }
  return null;
}

async function runGmailWatch() {
  try {
    const { [STORAGE_KEYS.accounts]: accounts = [], [STORAGE_KEYS.history]: history = [] } = await storageGet([STORAGE_KEYS.accounts, STORAGE_KEYS.history]);
    if (!accounts.length) return;

    await storageSet({ [STORAGE_KEYS.lastCheckTime]: Date.now() });

    for (const account of accounts) {
      try {
        const token = await getAuthToken(false, account.email);
        const codeData = await fetchLatestGmailCode(token, account.email);
        
        if (codeData && codeData.id !== account.lastMessageId) {
          updateOtpContextMenu(codeData.code);
          const fresh = await storageGet([STORAGE_KEYS.accounts, STORAGE_KEYS.history]);
          const accountsToSave = fresh[STORAGE_KEYS.accounts] || [];
          const target = accountsToSave.find(a => a.email === account.email);
          if (target) target.lastMessageId = codeData.id;

          await storageSet({ 
            [STORAGE_KEYS.accounts]: accountsToSave,
            [STORAGE_KEYS.lastEntry]: codeData,
            [STORAGE_KEYS.history]: [codeData, ...(fresh[STORAGE_KEYS.history] || [])].slice(0, 10)
          });

          chrome.notifications.create(`otp-${account.email}`, {
            type: "basic", iconUrl: "icons/frogus-128.png",
            title: `Gmail OTP (${account.email})`, message: `Код: ${codeData.code}`, priority: 2
          });
        }
      } catch (err) {
        if (err.message !== "Auth failed") await log(`[Watch] Error for ${account.email}:`, err.message);
      }
    }
  } catch (e) { await log("[GmailWatch] Global error:", e.message); }
}

function updateAlarmState(mode) {
  if (mode === "auto") chrome.alarms.create("gmailWatch", { periodInMinutes: 1 });
  else chrome.alarms.clear("gmailWatch");
}

function updateOtpContextMenu(code) {
  if (!code) return;
  currentOtpCode = code;
  clearTimeout(otpCodeTimer);
  otpCodeTimer = setTimeout(() => { currentOtpCode = null; chrome.contextMenus.removeAll(); }, 300000);
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "pasteOtp", title: `Вставить OTP: ${code}`,
      contexts: ["editable", "password", "text", "search", "tel", "url", "number"]
    });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const { [STORAGE_KEYS.mode]: mode = "auto" } = await storageGet(STORAGE_KEYS.mode);
  updateAlarmState(mode);
});
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === "gmailWatch") runGmailWatch(); });

async function performTestRun(token, email = "unknown") {
  const stored = await storageGet([
    STORAGE_KEYS.senderAllowlist, STORAGE_KEYS.senderBlocklist, STORAGE_KEYS.threshold
  ]);
  const threshold = stored[STORAGE_KEYS.threshold] || 3;
  // Deep scan: no newer_than, just OTP keywords
  const query = "subject:(code OR verification OR подтверждение OR код) in:inbox";
  
  await log(`Starting DEEP TEST RUN for ${email}...`);
  const data = await gmailApiRequest(`messages?maxResults=500&q=${encodeURIComponent(query)}`, token, email);
  if (!data.messages?.length) {
    await log("Test run: No messages found.");
    return [];
  }

  await log(`Test run: Found ${data.messages.length} messages. Fetching in batches...`);
  const allFoundCodes = [];
  
  // Process in batches of 20 to avoid overwhelming
  const batchSize = 20;
  for (let i = 0; i < data.messages.length; i += batchSize) {
    const batch = data.messages.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map(item => gmailApiRequest(`messages/${item.id}?format=full`, token, email).catch(() => null))
    );

    for (const msg of details) {
      if (!msg) continue;
      const headers = msg.payload?.headers || [];
      const subject = getHeader(headers, "Subject");
      const from = getHeader(headers, "From");
      const bodyText = extractTextFromPayload(msg.payload);
      const senderDomain = extractEmailDomain(from);
      
      const code = findOtpCode(subject) || findOtpCode(msg.snippet) || findOtpCode(bodyText);
      if (!code) continue;

      const score = scoreCodeCandidate({ 
        code, subject, from, snippet: msg.snippet, body: bodyText, 
        senderAllowlist: stored[STORAGE_KEYS.senderAllowlist], 
        senderBlocklist: stored[STORAGE_KEYS.senderBlocklist], 
        senderDomain 
      });

      if (score >= threshold) {
        allFoundCodes.push({
          code, id: msg.id, snippet: msg.snippet, subject, from, 
          date: getHeader(headers, "Date"), score, account: email,
          internalDate: msg.internalDate
        });
      }
    }
    await log(`Test run progress: ${Math.min(i + batchSize, data.messages.length)}/${data.messages.length}`);
  }

  // Sort by date before returning
  allFoundCodes.sort((a, b) => parseInt(b.internalDate) - parseInt(a.internalDate));
  
  const { [STORAGE_KEYS.history]: existingHistory = [] } = await storageGet(STORAGE_KEYS.history);
  // For deep test, we allow up to 1000 items in history to see all results
  const newHistory = [...allFoundCodes, ...existingHistory].slice(0, 1000); 
  await storageSet({ [STORAGE_KEYS.history]: newHistory });
  
  await log(`Test run complete. Found ${allFoundCodes.length} codes for ${email}.`);
  return allFoundCodes;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MSG.testRun) {
    storageGet(STORAGE_KEYS.accounts).then(async data => {
      const accounts = data[STORAGE_KEYS.accounts] || [];
      let totalFound = 0;
      for (const account of accounts) {
        try {
          const token = await getAuthToken(false, account.email);
          const results = await performTestRun(token, account.email);
          totalFound += results.length;
        } catch (e) {
          await log(`Test run failed for ${account.email}:`, e.message);
        }
      }
      sendResponse({ ok: true, count: totalFound });
    });
    return true;
  }
  if (message.type === MSG.modeAuto) {
    storageSet({ [STORAGE_KEYS.mode]: "auto" }).then(() => { updateAlarmState("auto"); log("Mode: Auto"); sendResponse({ ok: true }); });
    return true;
  }
  if (message.type === MSG.modeManual) {
    storageSet({ [STORAGE_KEYS.mode]: "manual" }).then(() => { updateAlarmState("manual"); log("Mode: Manual"); sendResponse({ ok: true }); });
    return true;
  }
  if (message.type === MSG.getLogs) {
    storageGet(STORAGE_KEYS.logs).then(data => sendResponse({ logs: data[STORAGE_KEYS.logs] || [] }));
    return true;
  }
  if (message.type === MSG.clearLogs) {
    chrome.storage.local.remove(STORAGE_KEYS.logs, () => sendResponse({ ok: true }));
    return true;
  }
  if (message.type === MSG.connect) {
    getAuthToken(true).then(token => fetchGmailProfile(token).then(email => {
      if (!email) throw new Error("No email");
      return storageGet(STORAGE_KEYS.accounts).then(data => {
        const accounts = data[STORAGE_KEYS.accounts] || [];
        if (accounts.some(a => a.email === email)) throw new Error("Duplicate");
        if (accounts.length >= MAX_ACCOUNTS) throw new Error("Limit reached");
        accounts.push({ email, lastMessageId: null });
        return storageSet({ [STORAGE_KEYS.accounts]: accounts }).then(() => {
          log("Account added:", email);
          sendResponse({ ok: true, accounts });
        });
      });
    })).catch(err => { log("Connect error:", err.message); sendResponse({ ok: false, error: err.message }); });
    return true;
  }
  if (message.type === MSG.disconnect) {
    storageGet(STORAGE_KEYS.accounts).then(data => {
      const filtered = (data[STORAGE_KEYS.accounts] || []).filter(a => a.email !== message.email);
      storageSet({ [STORAGE_KEYS.accounts]: filtered }).then(() => sendResponse({ ok: true, accounts: filtered }));
    });
    return true;
  }
  if (message.type === MSG.fetch) {
    storageGet(STORAGE_KEYS.accounts).then(async data => {
      const accounts = data[STORAGE_KEYS.accounts] || [];
      let bestCode = null;
      for (const account of accounts) {
        try {
          const token = await getAuthToken(false, account.email);
          const code = await fetchLatestGmailCode(token, account.email, message.query);
          if (code && (!bestCode || code.date > bestCode.date)) bestCode = code;
        } catch (e) {}
      }
      if (bestCode) storageSet({ [STORAGE_KEYS.lastEntry]: bestCode });
      sendResponse({ ok: true, code: bestCode });
    });
    return true;
  }
  return false;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pasteOtp" && currentOtpCode && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { action: "PASTE_OTP", code: currentOtpCode });
  }
});
