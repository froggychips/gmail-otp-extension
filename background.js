import { STORAGE_KEYS, MSG, MAX_ACCOUNTS, DEFAULT_QUERY } from './src/shared/constants.js';
import { log } from './src/background/logger.js';
import { storageGet, storageSet } from './src/background/storage.js';
import { 
  findOtpCode, 
  containsOtpKeywords, 
  scoreCodeCandidate, 
  validateGmailQuery,
  findBestOtpCode
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

async function fetchLatestWithAuthRecovery(token, email, overrideQuery = "") {
  try {
    return await fetchLatestGmailCode(token, email, overrideQuery);
  } catch (err) {
    if (err?.message !== "auth_error") throw err;
    await log(`Auth token expired for ${email}, retrying with a fresh token`);
    await removeCachedToken(token).catch(() => {});
    const freshToken = await getAuthToken(false, email);
    return fetchLatestGmailCode(freshToken, email, overrideQuery);
  }
}

async function runWithAuthRecovery(email, task) {
  let token = await getAuthToken(false, email);
  try {
    return await task(token);
  } catch (err) {
    if (err?.message !== "auth_error") throw err;
    await log(`Auth token expired for ${email}, retrying operation`);
    await removeCachedToken(token).catch(() => {});
    token = await getAuthToken(false, email);
    return task(token);
  }
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

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isAllowedSiteHost(hostname, allowlist = []) {
  const normalizedHost = String(hostname || "").toLowerCase();
  if (!normalizedHost) return false;
  if (!Array.isArray(allowlist) || allowlist.length === 0) return true;
  return allowlist.some((entry) => {
    const domain = String(entry || "").trim().toLowerCase();
    if (!domain) return false;
    return normalizedHost === domain || normalizedHost.endsWith(`.${domain}`);
  });
}

function base64UrlDecode(input) {
  if (!input) return "";
  const fixed = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = fixed.length % 4 === 0 ? "" : "=".repeat(4 - (fixed.length % 4));
  try { return atob(fixed + pad); } catch { return ""; }
}

function cleanHtml(html) {
  if (!html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, noscript, iframe, object, embed")
      .forEach(el => el.remove());
    return (doc.body?.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

function extractTextFromPayload(payload) {
  if (!payload) return "";
  // Prefer plain text
  if (payload.mimeType?.toLowerCase() === "text/plain" && payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }
  // Fallback to HTML but clean it
  if (payload.mimeType?.toLowerCase() === "text/html" && payload.body?.data) {
    return cleanHtml(base64UrlDecode(payload.body.data));
  }
  if (Array.isArray(payload.parts)) {
    // Try to find plain text part first
    const plainPart = payload.parts.find(p => p.mimeType?.toLowerCase() === "text/plain");
    if (plainPart) return extractTextFromPayload(plainPart);
    
    // If no plain text, take the first available part (usually HTML)
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
    STORAGE_KEYS.senderAllowlist, STORAGE_KEYS.senderBlocklist, STORAGE_KEYS.threshold,
    STORAGE_KEYS.userStopWords, STORAGE_KEYS.domainPrefs
  ]);

  const threshold = stored[STORAGE_KEYS.threshold] || 3;
  const query = (validateGmailQuery(overrideQuery) || stored[STORAGE_KEYS.query] || DEFAULT_QUERY) + 
                (stored[STORAGE_KEYS.unreadOnly] ? " is:unread" : "") + " in:inbox";

  await log(`Searching Gmail (${email}) with query:`, query);
  // Fetch only top 10 for quick fetch
  const data = await gmailApiRequest(`messages?maxResults=10&q=${encodeURIComponent(query)}`, token, email);
  if (!data.messages?.length) return null;

  const unmatched = [];

  for (const item of data.messages) {
    const msg = await gmailApiRequest(`messages/${item.id}?format=full`, token, email).catch(() => null);
    if (!msg) continue;

    const headers = msg.payload?.headers || [];
    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const bodyText = extractTextFromPayload(msg.payload);
    const senderDomain = extractEmailDomain(from);
    
    if (senderDomain && (stored[STORAGE_KEYS.senderBlocklist] || []).includes(senderDomain)) continue;

    const result = findBestOtpCode({ 
      subject, from, snippet: msg.snippet, body: bodyText, senderDomain 
    }, { 
      senderAllowlist: stored[STORAGE_KEYS.senderAllowlist], 
      senderBlocklist: stored[STORAGE_KEYS.senderBlocklist],
      userStopWords: stored[STORAGE_KEYS.userStopWords],
      domainPrefs: stored[STORAGE_KEYS.domainPrefs]
    });

    if (!result) {
      if (containsOtpKeywords(subject) || containsOtpKeywords(msg.snippet)) {
        unmatched.push({ id: msg.id, from, subject, date: getHeader(headers, "Date"), snippet: msg.snippet, domain: senderDomain });
      }
      continue;
    }
    
    const { code, score, others } = result;

    if (score < threshold) {
      if (score > -5) {
        await log(`Code ${code} rejected for ${email} (Score ${score} < ${threshold})`);
      }
      continue;
    }
    
    const entry = { 
      code, others, id: msg.id, snippet: msg.snippet, subject, from, 
      date: getHeader(headers, "Date"), score, account: email, 
      domain: senderDomain, internalDate: msg.internalDate 
    };
    await log(`Valid code identified for ${email}: ${code} (Score: ${score})`);
    
    // Found a good code! Exit early.
    return entry;
  }

  if (unmatched.length) {
    const { [STORAGE_KEYS.unmatched]: existing = [] } = await storageGet(STORAGE_KEYS.unmatched);
    const merged = [...unmatched, ...existing].slice(0, 40);
    await storageSet({ [STORAGE_KEYS.unmatched]: merged });
  }
  return null;
}

async function sendToTelegram(codeData) {
  try {
    const stored = await storageGet([STORAGE_KEYS.tgEnabled, STORAGE_KEYS.tgBotToken, STORAGE_KEYS.tgChatId, STORAGE_KEYS.isPro]);
    if (!stored[STORAGE_KEYS.isPro] || !stored[STORAGE_KEYS.tgEnabled]) return;

    const token = stored[STORAGE_KEYS.tgBotToken];
    const chatId = stored[STORAGE_KEYS.tgChatId];
    if (!token || !chatId) return;

    const domain = codeData.domain || "Unknown";
    const text = `🐸 *Gmail OTP*\n\n` +
                 `📦 *Service:* ${domain}\n` +
                 `🔑 *Code:* \`${codeData.code}\`\n\n` +
                 `📧 *Account:* ${codeData.account}`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "MarkdownV2"
      })
    });
    await log(`Forwarded code ${codeData.code} to Telegram`);
  } catch (e) {
    await log("Telegram forward error:", e.message);
  }
}

async function runGmailWatch() {
  try {
    const { 
      [STORAGE_KEYS.accounts]: accounts = [], 
      [STORAGE_KEYS.isTestRunning]: isTestRunning = false 
    } = await storageGet([STORAGE_KEYS.accounts, STORAGE_KEYS.isTestRunning]);
    
    if (!accounts.length || isTestRunning) return;

    await storageSet({ [STORAGE_KEYS.lastCheckTime]: Date.now() });

    for (const account of accounts) {
      try {
        // Sequential auth to avoid Chrome Identity conflict
        const token = await Promise.race([
          getAuthToken(false, account.email),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000))
        ]);

        const codeData = await fetchLatestWithAuthRecovery(token, account.email);
        
        if (codeData && codeData.id !== account.lastMessageId) {
          updateOtpContextMenu(codeData.code);
          const fresh = await storageGet([STORAGE_KEYS.accounts, STORAGE_KEYS.history]);
          const accountsToSave = fresh[STORAGE_KEYS.accounts] || [];
          const target = accountsToSave.find(a => a.email === account.email);
          if (target) target.lastMessageId = codeData.id;

          const updatedHistory = [codeData, ...(fresh[STORAGE_KEYS.history] || [])];
          updatedHistory.sort((a, b) => parseInt(b.internalDate || 0) - parseInt(a.internalDate || 0));

          const { [STORAGE_KEYS.isPro]: isProStatus } = await storageGet(STORAGE_KEYS.isPro);
          const finalHistory = isProStatus ? updatedHistory : updatedHistory.slice(0, 50);

          await storageSet({ 
            [STORAGE_KEYS.accounts]: accountsToSave,
            [STORAGE_KEYS.lastEntry]: codeData,
            [STORAGE_KEYS.history]: finalHistory
          });

          chrome.notifications.create(`otp-${account.email}`, {
            type: "basic", iconUrl: "icons/frogus-128.png",
            title: `Gmail OTP (${account.email})`, message: `Код: ${codeData.code}`, priority: 2
          });

          // Pro feature: Forward to Telegram
          sendToTelegram(codeData);

          // Pro feature: Auto-magic fill (send to all tabs)
          const { [STORAGE_KEYS.isPro]: isPro, [STORAGE_KEYS.autofillEnabled]: autofill } = await storageGet([STORAGE_KEYS.isPro, STORAGE_KEYS.autofillEnabled]);
          if (isPro && autofill) {
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(tab => {
                if (tab.url?.startsWith("https://")) {
                  chrome.tabs.sendMessage(tab.id, { action: "AUTO_MAGIC_FILL", code: codeData.code }).catch(() => {});
                }
              });
            });
          }
        }
      } catch (err) {
        if (err.message !== "Auth failed" && err.message !== "rate_limit_backoff") {
          await log(`[Watch] Error for ${account.email}:`, err.message);
        }
      }
    }
  } catch (e) { await log("[GmailWatch] Global error:", e.message); }
}

// Accelerated Monitoring: trigger scan on tab switch for Pro users
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { [STORAGE_KEYS.isPro]: isPro } = await storageGet(STORAGE_KEYS.isPro);
  if (isPro) {
    // debounce to avoid spamming
    if (!globalThis._fastScanTimer) {
      globalThis._fastScanTimer = setTimeout(() => {
        runGmailWatch();
        delete globalThis._fastScanTimer;
      }, 5000);
    }
  }
});

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
      contexts: ["editable"]
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
    STORAGE_KEYS.senderAllowlist, STORAGE_KEYS.senderBlocklist, STORAGE_KEYS.threshold,
    STORAGE_KEYS.query, STORAGE_KEYS.unreadOnly, STORAGE_KEYS.userStopWords, STORAGE_KEYS.domainPrefs
  ]);
  const threshold = stored[STORAGE_KEYS.threshold] || 3;
  const userQuery = stored[STORAGE_KEYS.query];
  
  // Use user's query if available, otherwise default deep scan query
  let query = userQuery || "subject:(code OR verification OR подтверждение OR код)";
  if (stored[STORAGE_KEYS.unreadOnly]) query += " is:unread";
  query += " in:inbox";
  
  await log(`Starting DEEP TEST RUN for ${email} with query: ${query}`);
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
    let details = [];
    
    try {
      details = await Promise.all(
        batch.map(item => gmailApiRequest(`messages/${item.id}?format=full`, token, email))
      );
    } catch (err) {
      if (err.message === "rate_limit" || err.message === "rate_limit_backoff") {
        await log(`Test Run paused for 30s due to rate limit for ${email}`);
        await new Promise(r => setTimeout(r, 30000));
        i -= batchSize; // Retry this batch
        continue;
      }
      // Log other errors but try to continue with next batch
      await log(`Batch fetch error for ${email}:`, err.message);
    }

    for (const msg of details) {
      if (!msg) continue;
      const headers = msg.payload?.headers || [];
      const subject = getHeader(headers, "Subject");
      const from = getHeader(headers, "From");
      const bodyText = extractTextFromPayload(msg.payload);
      const senderDomain = extractEmailDomain(from);
      
      const result = findBestOtpCode({ 
        subject, from, snippet: msg.snippet, body: bodyText, senderDomain 
      }, { 
        senderAllowlist: stored[STORAGE_KEYS.senderAllowlist], 
        senderBlocklist: stored[STORAGE_KEYS.senderBlocklist],
        userStopWords: stored[STORAGE_KEYS.userStopWords],
        domainPrefs: stored[STORAGE_KEYS.domainPrefs]
      });

      if (!result) continue;

      const { code, score, others } = result;

      if (score >= threshold) {
        allFoundCodes.push({
          code, others, id: msg.id, snippet: msg.snippet, subject, from, 
          date: getHeader(headers, "Date"), score, account: email,
          domain: senderDomain, internalDate: msg.internalDate
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

function extractHtmlFromPayload(payload) {
  if (!payload) return "";
  if (payload.mimeType?.toLowerCase() === "text/html" && payload.body?.data) {
    return base64UrlDecode(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const html = extractHtmlFromPayload(part);
      if (html) return html;
    }
  }
  return "";
}

async function performFullExport(token, email = "unknown") {
  const query = "subject:(code OR verification OR подтверждение OR код) in:inbox";
  await log(`Starting MASSIVE EXPORT for ${email}...`);
  
  const data = await gmailApiRequest(`messages?maxResults=1000&q=${encodeURIComponent(query)}`, token, email);
  if (!data.messages?.length) return [];

  const results = [];
  const batchSize = 15; // Slightly smaller batch for heavy HTML content
  
  for (let i = 0; i < data.messages.length; i += batchSize) {
    const batch = data.messages.slice(i, i + batchSize);
    const details = await Promise.all(
      batch.map(item => gmailApiRequest(`messages/${item.id}?format=full`, token, email).catch(() => null))
    );

    for (const msg of details) {
      if (!msg) continue;
      const headers = msg.payload?.headers || [];
      const bodyText = extractTextFromPayload(msg.payload);
      const bodyHtml = extractHtmlFromPayload(msg.payload);
      
      // Permissive regex for export: find everything that looks like a code
      const allNumbers = (bodyText + getHeader(headers, "Subject")).match(/\b[A-Z0-9\-\s]{4,12}\b/gi) || [];
      
      results.push({
        email,
        subject: getHeader(headers, "Subject"),
        from: getHeader(headers, "From"),
        date: getHeader(headers, "Date"),
        snippet: msg.snippet,
        detectedCodes: [...new Set(allNumbers.map(n => n.trim()).filter(n => n.length >= 4))],
        html: bodyHtml
      });
    }
    await log(`Export progress: ${Math.min(i + batchSize, data.messages.length)}/1000`);
  }
  return results;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MSG.exportFull) {
    storageGet(STORAGE_KEYS.accounts).then(async data => {
      const accounts = data[STORAGE_KEYS.accounts] || [];
      const allResults = [];
      for (const account of accounts) {
        try {
          const results = await runWithAuthRecovery(
            account.email,
            (token) => performFullExport(token, account.email)
          );
          allResults.push(...results);
        } catch (e) {
          await log(`Full export failed for ${account.email}:`, e.message);
        }
      }
      sendResponse({ ok: true, data: allResults });
    });
    return true;
  }
  if (message.type === MSG.testRun) {
    // Respond immediately to popup
    sendResponse({ ok: true });
    
    // Start the process in background
    storageSet({ [STORAGE_KEYS.isTestRunning]: true }).then(async () => {
      try {
        const { [STORAGE_KEYS.accounts]: accounts = [] } = await storageGet(STORAGE_KEYS.accounts);
        let totalFound = 0;
        for (const account of accounts) {
          try {
            const results = await runWithAuthRecovery(
              account.email,
              (token) => performTestRun(token, account.email)
            );
            totalFound += results.length;
          } catch (e) {
            await log(`Background Test Run failed for ${account.email}:`, e.message);
          }
        }
        
        // Notify user when done
        chrome.notifications.create("test-run-done", {
          type: "basic", iconUrl: "icons/frogus-128.png",
          title: "Глубокий тест завершен",
          message: `Найдено кодов: ${totalFound}. Проверьте вкладку "История".`,
          priority: 2
        });
      } finally {
        await storageSet({ [STORAGE_KEYS.isTestRunning]: false });
      }
    });
    return true; // Keep channel open (optional but good practice)
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
      return storageGet([STORAGE_KEYS.accounts, STORAGE_KEYS.isPro]).then(data => {
        const accounts = data[STORAGE_KEYS.accounts] || [];
        const isPro = !!data[STORAGE_KEYS.isPro];
        const limit = isPro ? 999 : MAX_ACCOUNTS;

        if (accounts.some(a => a.email === email)) throw new Error("Duplicate");
        if (accounts.length >= limit) throw new Error("Limit reached");
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
      if (accounts.length === 0) {
        sendResponse({ ok: true, code: null });
        return;
      }

      // 1. Acquire tokens SEQUENTIALLY (Chrome Identity API limit)
      const accountsWithTokens = [];
      for (const account of accounts) {
        try {
          const token = await Promise.race([
            getAuthToken(false, account.email),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 5000))
          ]);
          accountsWithTokens.push({ ...account, token });
        } catch (e) {
          await log(`Auth failed for ${account.email}:`, e.message);
        }
      }

      // 2. Fetch from Gmail PARALLELLY (Fast)
      const results = await Promise.all(accountsWithTokens.map(async (acc) => {
        try {
          return await fetchLatestWithAuthRecovery(acc.token, acc.email, message.query);
        } catch (e) {
          await log(`Fetch failed for ${acc.email}:`, e.message);
          return null;
        }
      }));

      // Pick the best code among all results
      let bestCode = null;
      for (const code of results) {
        if (code && (!bestCode || parseInt(code.internalDate) > parseInt(bestCode.internalDate))) {
          bestCode = code;
        }
      }
      
      if (bestCode) {
        const fresh = await storageGet([STORAGE_KEYS.history, STORAGE_KEYS.accounts]);
        const existingHistory = fresh[STORAGE_KEYS.history] || [];
        const accountsToSave = fresh[STORAGE_KEYS.accounts] || [];
        const target = accountsToSave.find(a => a.email === bestCode.account);
        if (target) target.lastMessageId = bestCode.id;
        
        if (!existingHistory.some(h => h.id === bestCode.id)) {
          const updatedHistory = [bestCode, ...existingHistory];
          updatedHistory.sort((a, b) => parseInt(b.internalDate || 0) - parseInt(a.internalDate || 0));
          
          const { [STORAGE_KEYS.isPro]: isProStatus } = await storageGet(STORAGE_KEYS.isPro);
          const finalHistory = isProStatus ? updatedHistory : updatedHistory.slice(0, 50);

          await storageSet({ 
            [STORAGE_KEYS.accounts]: accountsToSave,
            [STORAGE_KEYS.lastEntry]: bestCode,
            [STORAGE_KEYS.history]: finalHistory
          });
        } else {
          await storageSet({ 
            [STORAGE_KEYS.accounts]: accountsToSave,
            [STORAGE_KEYS.lastEntry]: bestCode
          });
        }
      }

      // Reset alarm to 1 minute from now since we just checked
      const { [STORAGE_KEYS.mode]: mode = "auto" } = await storageGet(STORAGE_KEYS.mode);
      if (mode === "auto") {
        chrome.alarms.create("gmailWatch", { periodInMinutes: 1 });
      }

      sendResponse({ ok: true, code: bestCode });
    }).catch(err => {
      log("Global fetch error:", err.message);
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }
  if (message.type === MSG.markAsCode) {
    storageGet([STORAGE_KEYS.senderAllowlist, STORAGE_KEYS.unmatched]).then(data => {
      const allowlist = new Set(data[STORAGE_KEYS.senderAllowlist] || []);
      const unmatched = data[STORAGE_KEYS.unmatched] || [];
      if (message.domain) allowlist.add(message.domain);
      const filtered = unmatched.filter(m => m.id !== message.id);
      storageSet({ 
        [STORAGE_KEYS.senderAllowlist]: Array.from(allowlist),
        [STORAGE_KEYS.unmatched]: filtered
      }).then(() => {
        log(`Marked as code, added to allowlist: ${message.domain}`);
        sendResponse({ ok: true });
      });
    });
    return true;
  }
  if (message.type === MSG.markAsNoCode) {
    storageGet([STORAGE_KEYS.senderBlocklist, STORAGE_KEYS.unmatched]).then(data => {
      const blocklist = new Set(data[STORAGE_KEYS.senderBlocklist] || []);
      const unmatched = data[STORAGE_KEYS.unmatched] || [];
      if (message.domain) blocklist.add(message.domain);
      const filtered = unmatched.filter(m => m.id !== message.id);
      storageSet({ 
        [STORAGE_KEYS.senderBlocklist]: Array.from(blocklist),
        [STORAGE_KEYS.unmatched]: filtered
      }).then(() => {
        log(`Marked as no code, added to blocklist: ${message.domain}`);
        sendResponse({ ok: true });
      });
    });
    return true;
  }
  if (message.type === MSG.correctCode) {
    storageGet([STORAGE_KEYS.domainPrefs, STORAGE_KEYS.history]).then(async data => {
      const prefs = data[STORAGE_KEYS.domainPrefs] || {};
      const history = data[STORAGE_KEYS.history] || [];
      
      if (message.domain && message.code) {
        prefs[message.domain] = { 
          len: message.code.length, 
          isNum: /^\d+$/.test(message.code) 
        };
      }
      
      const item = history.find(h => h.id === message.id);
      if (item) {
        item.code = message.code;
        // Optionally swap with original code in 'others'
      }

      await storageSet({ 
        [STORAGE_KEYS.domainPrefs]: prefs,
        [STORAGE_KEYS.history]: history,
        [STORAGE_KEYS.lastEntry]: item || null
      });
      log(`Learned preference for ${message.domain}: ${message.code.length} chars`);
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message.type === MSG.ignoreCode) {
    storageGet([STORAGE_KEYS.userStopWords, STORAGE_KEYS.history]).then(async data => {
      const stopWords = new Set(data[STORAGE_KEYS.userStopWords] || []);
      const history = data[STORAGE_KEYS.history] || [];
      
      if (message.code) stopWords.add(message.code);
      
      const filteredHistory = history.filter(h => h.id !== message.id);

      await storageSet({ 
        [STORAGE_KEYS.userStopWords]: Array.from(stopWords),
        [STORAGE_KEYS.history]: filteredHistory,
        [STORAGE_KEYS.lastEntry]: null
      });
      log(`Added to user stop words: ${message.code}`);
      sendResponse({ ok: true });
    });
    return true;
  }
  return false;
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pasteOtp" && currentOtpCode && tab?.id) {
    if (!tab.url || !tab.url.startsWith("https://")) {
      log("Blocked OTP paste from context menu on non-HTTPS tab:", tab.url || "unknown");
      return;
    }
    const host = hostnameFromUrl(tab.url);
    storageGet(STORAGE_KEYS.siteAllowlist).then((data) => {
      const siteAllowlist = data[STORAGE_KEYS.siteAllowlist] || [];
      if (!isAllowedSiteHost(host, siteAllowlist)) {
        log("Blocked OTP paste for host not in site allowlist:", host);
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: "PASTE_OTP", code: currentOtpCode });
    });
  }
});
