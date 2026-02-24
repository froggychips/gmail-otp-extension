export const VALIDATORS = {
  gmailQuery: (val) => {
    const str = String(val || "").trim();
    if (str.length > 500) throw new Error("Query too long");
    // Basic injection check
    const dangerous = ['script', 'eval', 'fetch', '<', '>'];
    if (dangerous.some(word => str.toLowerCase().includes(word))) throw new Error("Invalid characters");
    return str;
  },
  threshold: (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 10) throw new Error("Threshold out of range");
    return num;
  },
  parseDomainList: (value) => {
    const source = String(value || "");
    const chunks = source
      .split(/\n|,/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const valid = [];
    const invalid = [];

    for (const item of chunks) {
      if (/^[a-z0-9.-]+$/.test(item) && item.includes(".") && !item.startsWith(".") && !item.endsWith(".")) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    }

    return { valid: [...new Set(valid)], invalid: [...new Set(invalid)] };
  },
  isAllowedSiteHost: (hostname, allowlist = []) => {
    const normalizedHost = String(hostname || "").toLowerCase();
    if (!normalizedHost) return false;
    if (!Array.isArray(allowlist) || allowlist.length === 0) return true;
    return allowlist.some((entry) => {
      const domain = String(entry || "").trim().toLowerCase();
      if (!domain) return false;
      return normalizedHost === domain || normalizedHost.endsWith(`.${domain}`);
    });
  },
  clampClipboardSeconds: (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return 20;
    return Math.min(300, Math.max(0, parsed));
  },
  sanitizeCsvCell: (value) => {
    const str = String(value ?? "");
    if (/^[=+\-@]/.test(str)) return `'${str}`;
    return str;
  }
};
