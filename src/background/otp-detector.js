export function findOtpCode(text) {
  if (!text) return "";
  const cleaned = String(text)
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\r\n]+/g, " ");
  const numeric = cleaned.match(/\b\d{4,8}\b/);
  if (numeric) return numeric[0];
  const alphaNum = cleaned.match(/\b[A-Z0-9]{6,8}\b/i);
  return alphaNum ? alphaNum[0] : "";
}

export function containsOtpKeywords(text) {
  if (!text) return false;
  return /otp|2fa|verification|verify|security|confirm|login|auth|код|подтверж|провер|вход/i.test(text);
}

export function isLikelyPhoneOrOrder(text) {
  if (!text) return false;
  if (/\+?\d[\d\s\-()]{8,}/.test(text)) return true;
  if (/order|заказ|invoice|счет|tracking|доставка|shipment/i.test(text)) return true;
  if (/\b(id|номер|ref|reference|order)\b/i.test(text)) return true;
  return false;
}

export function scoreCodeCandidate({ code, subject, from, snippet, body, senderAllowlist = [], senderBlocklist = [], senderDomain = "" }) {
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

  // 5. Whitelist/Blacklist
  if (senderDomain && senderAllowlist.includes(senderDomain)) score += 3;
  if (senderDomain && senderBlocklist.includes(senderDomain)) score -= 10;

  return score;
}

export function validateGmailQuery(query) {
  if (typeof query !== 'string') return "";
  const str = query.trim();
  if (str.length > 500) return str.substring(0, 500);
  const dangerous = ['script', 'eval', 'fetch', '<', '>'];
  if (dangerous.some(word => str.toLowerCase().includes(word))) return "";
  return str;
}
