// content.js — Автозаполнение OTP (поддержка input, textarea и contenteditable)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PASTE_OTP" && message.code) {
    const activeEl = document.activeElement;

    if (!activeEl) {
      sendResponse({ success: false, reason: "no_active_element" });
      return;
    }

    let inserted = false;

    // 1. Обычные поля ввода
    if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") {
      const start = activeEl.selectionStart || 0;
      const end = activeEl.selectionEnd || 0;

      activeEl.value = activeEl.value.substring(0, start) + 
                      message.code + 
                      activeEl.value.substring(end);

      const newPos = start + message.code.length;
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
        range.insertNode(document.createTextNode(message.code));
        
        // Перемещаем курсор после вставки
        range.setStart(range.endContainer, range.endOffset);
        range.setEnd(range.endContainer, range.endOffset);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        activeEl.innerHTML += message.code; // fallback
      }

      // Триггерим событие для React/Vue
      activeEl.dispatchEvent(new Event("input", { bubbles: true }));
      inserted = true;
    }

    sendResponse({ success: inserted });
  }
});
