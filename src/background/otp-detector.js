export function findOtpCode(text) {
  if (!text) return "";
  const cleaned = String(text)
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\r\n]+/g, " ");
  
  // 1. Сначала ищем классику: 4-8 цифр
  const numeric = cleaned.match(/\b\d{4,8}\b/);
  if (numeric) return numeric[0];
  
  // 2. Буквенно-цифровые сочетания (4-10 символов)
  // Теперь разрешаем и чисто буквенные, но будем строже их оценивать в скоринге
  const alphaNum = cleaned.match(/\b[A-Z0-9]{4,10}\b/i);
  if (alphaNum) return alphaNum[0];
  
  return "";
}

export function containsOtpKeywords(text) {
  if (!text) return false;
  return /otp|2fa|verification|verify|security|confirm|login|auth|код|подтверж|провер|вход|password/i.test(text);
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
  const codeLower = code.toLowerCase();
  
  // 0. Жесткий бан для известных слов и брендов
  const stopWords = ['google', 'spotify', 'facebook', 'telegram', 'apple', 'amazon', 'microsoft', 'someone', 'binary', 'booking', 'uniqlo', 'github', 'shulgin', 'iaroslav'];
  if (stopWords.includes(codeLower)) return -100;

  // 1. Анализ формата
  const isPureAlpha = /^[A-Z]+$/i.test(code);
  const isPureNumeric = /^\d+$/.test(code);

  if (isPureNumeric) {
    if (code.length === 6) score += 4;
    else if (code.length === 4) score += 2;
    else score += 1;
  } else {
    // Буквенные или смешанные коды
    if (isPureAlpha) score -= 4; // Штраф за отсутствие цифр (чтобы не ловить someone)
    else score += 2; // Бонус за смесь букв и цифр (A1B2...)
  }

  // 2. КРИТИЧЕСКИЙ БОНУС: Контекст (префиксы перед кодом)
  // Ищем в тексте: "Code: ruhcm", "OTP is 1234" и т.д.
  const contextPattern = new RegExp(`(?:code|otp|password|is|verification|confirm|ваш код)\\s*[:=-]?\\s*${code}`, 'i');
  if (contextPattern.test(haystack)) {
    score += 7; // Огромный бонус, если перед словом стоит метка "Code"
  }

  // 3. Общие ключевые слова в письме
  if (containsOtpKeywords(subject)) score += 3;
  else if (containsOtpKeywords(haystack)) score += 1;

  // 4. Позиция (начало/конец письма)
  if (body && (body.trim().startsWith(code) || body.trim().endsWith(code))) score += 2;

  // 5. Отрицательные признаки
  if (isPureAlpha && !contextPattern.test(haystack)) score -= 10; // Почти гарантированный отсев обычных слов
  if (isLikelyPhoneOrOrder(haystack)) score -= 5;

  // 6. Whitelist/Blacklist
  if (senderDomain && senderAllowlist.includes(senderDomain)) score += 3;
  if (senderDomain && senderBlocklist.includes(senderDomain)) score -= 20;

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
