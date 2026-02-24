const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function normalizeDomain(input) {
  return String(input || "").trim().toLowerCase();
}

function parseDomainList(input) {
  const valid = [];
  const invalid = [];

  const parts = String(input || "")
    .split(/[\n,]/)
    .map(normalizeDomain)
    .filter(Boolean);

  for (const domain of parts) {
    if (DOMAIN_REGEX.test(domain)) {
      valid.push(domain);
    } else {
      invalid.push(domain);
    }
  }

  return { valid, invalid };
}

function isAllowedSiteHost(hostname, allowlist = []) {
  const host = normalizeDomain(hostname);
  if (!host) return false;

  if (!Array.isArray(allowlist) || allowlist.length === 0) {
    return true;
  }

  return allowlist.some(entry => {
    const domain = normalizeDomain(entry);
    if (!DOMAIN_REGEX.test(domain)) return false;

    return host === domain || host.endsWith("." + domain);
  });
}

function clampClipboardSeconds(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(300, Math.floor(num)));
}

function sanitizeCsvCell(value) {
  const str = String(value || "");
  if (/^[=+\-@]/.test(str)) {
    return "'" + str;
  }
  return str;
}

export const VALIDATORS = {
  parseDomainList,
  isAllowedSiteHost,
  clampClipboardSeconds,
  sanitizeCsvCell
};
