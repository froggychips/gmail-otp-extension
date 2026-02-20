import { STORAGE_KEYS, MAX_LOG_ENTRIES } from '../shared/constants.js';

class LogBuffer {
  constructor(maxSize = MAX_LOG_ENTRIES) {
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
export const log = (...args) => logBuffer.add(...args);
