// content.js — Автозаполнение OTP (поддержка input, textarea и contenteditable)
// Исправлено: защита от XSS (отказ от innerHTML) и улучшенная эмуляция ввода

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PASTE_OTP" && message.code) {
    const activeEl = document.activeElement;

    if (!activeEl) {
      sendResponse({ success: false, reason: "no_active_element" });
      return;
    }

    let inserted = false;
    const codeStr = String(message.code);

    // 1. Обычные поля ввода (INPUT, TEXTAREA)
    if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") {
      const start = activeEl.selectionStart || 0;
      const end = activeEl.selectionEnd || 0;

      activeEl.value = activeEl.value.substring(0, start) + 
                      codeStr + 
                      activeEl.value.substring(end);

      const newPos = start + codeStr.length;
      activeEl.selectionStart = activeEl.selectionEnd = newPos;

      activeEl.dispatchEvent(new Event("input", { bubbles: true }));
      activeEl.dispatchEvent(new Event("change", { bubbles: true }));
      inserted = true;
    }
    // 2. contenteditable (div, p, span и т.д.)
    else if (activeEl.isContentEditable) {
      const sel = window.getSelection();
      if (sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        
        // БЕЗОПАСНО: вставляем как текстовый узел
        const textNode = document.createTextNode(codeStr);
        range.insertNode(textNode);
        
        // Перемещаем курсор после вставки
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
        inserted = true;
      } else {
        // Fallback: безопасное добавление в конец
        activeEl.appendChild(document.createTextNode(codeStr));
        inserted = true;
      }

      // Триггерим событие для React/Vue
      activeEl.dispatchEvent(new Event("input", { bubbles: true }));
    }

    sendResponse({ success: inserted });
  }
  return true;
});
