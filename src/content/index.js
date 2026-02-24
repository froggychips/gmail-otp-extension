// content.js — Ультимативная вставка (v5)

let lastPendingCode = null;

function isSecurePage() {
  return window.location.protocol === "https:";
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

function isVisibleEditable(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el.disabled || el.readOnly) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function looksLikeOtpField(el) {
  if (!el) return false;
  const attrs = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute?.("autocomplete"),
    el.getAttribute?.("aria-label"),
    el.getAttribute?.("inputmode")
  ].join(" ").toLowerCase();

  if (/one-time-code/.test(attrs)) return true;
  return /otp|code|verification|verify|confirm|passcode|pin|2fa|two[-\s]?factor|auth/.test(attrs);
}

async function doInsert(el, value) {
  if (!el) return false;

  try {
    el.focus();
    
    // Пытаемся очистить поле
    try { el.value = ''; } catch(e) {}

    // Метод 1: document.execCommand (имитация вставки)
    document.execCommand('selectAll', false, null);
    const commandSuccess = document.execCommand('insertText', false, value);
    
    // Проверка результата
    if (!commandSuccess || (el.value !== value && !el.isContentEditable)) {
      // Метод 2: Прямая установка через нативный сеттер
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set || 
                           Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      
      if (nativeSetter) {
        nativeSetter.call(el, value);
      } else {
        el.value = value;
      }

      // Генерируем события
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Метод 3: Посимвольная эмуляция (для самых капризных полей)
      if (el.value !== value) {
        for (let char of value) {
          el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        }
      }
    }

    // Визуальная индикация
    el.style.outline = '2px solid #22c55e';
    setTimeout(() => el.style.outline = '', 1000);

    return true;
  } catch (e) {
    console.error("[Gmail OTP] Insert error:", e);
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PASTE_OTP" && message.code) {
    if (!isSecurePage()) {
      sendResponse({ success: false, reason: "insecure_page" });
      return true;
    }
    chrome.storage.local.get("gmailSiteAllowlist", (data) => {
      const allowlist = data?.gmailSiteAllowlist || [];
      if (!isAllowedSiteHost(window.location.hostname, allowlist)) {
        sendResponse({ success: false, reason: "site_not_allowed" });
        return;
      }

      lastPendingCode = String(message.code);
      
      let target = document.activeElement;
      if (!isVisibleEditable(target) || !looksLikeOtpField(target)) {
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input:not([type]), [contenteditable="true"]'));
        target = inputs.find(i => isVisibleEditable(i) && looksLikeOtpField(i)) || null;
      }

      if (target) {
        doInsert(target, lastPendingCode).then(ok => sendResponse({ success: ok }));
        if (target) lastPendingCode = null;
      } else {
        sendResponse({ success: false, reason: "no_input" });
      }
    });
  }

  if (message.action === "AUTO_MAGIC_FILL" && message.code) {
    // For auto-fill, we only do it if the page is currently visible to avoid surprising the user
    if (document.visibilityState !== 'visible') return;

    const code = String(message.code);
    const tryAutofill = () => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"], input:not([type]), [contenteditable="true"]'));
      const target = inputs.find(i => isVisibleEditable(i) && looksLikeOtpField(i));
      if (target) {
        doInsert(target, code);
        return true;
      }
      return false;
    };

    if (!tryAutofill()) {
      // If field not found immediately, watch for it for 10 seconds
      const observer = new MutationObserver(() => {
        if (tryAutofill()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 10000);
    }
  }
  return true;
});

document.addEventListener('mousedown', (e) => {
  if (lastPendingCode && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
    doInsert(e.target, lastPendingCode);
    lastPendingCode = null;
  }
}, true);
