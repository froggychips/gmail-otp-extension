// OTP Detector - "Entropy Mode" (Autonomous, format-based selection)

export function findOtpCode(text, userStopWords = []) {
  if (!text) return [];
  const cleaned = String(text)
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\r\n]+/g, " ");
  
  const candidates = new Set();
  const lowerStopWords = (userStopWords || []).map(w => w.toLowerCase());
  const excludedCandidates = new Set([
    "code", "login", "verify", "verification", "otp", "auth", "guard", "steam", "access"
  ]);
  
  const addCandidate = (val) => {
    const lowered = String(val || "").toLowerCase();
    if (val && !lowerStopWords.includes(lowered) && !excludedCandidates.has(lowered)) {
      candidates.add(val);
    }
  };
  
  // 1. Numeric (4-8)
  const numericMatches = cleaned.matchAll(/\b\d{4,8}\b/g);
  for (const match of numericMatches) addCandidate(match[0]);
  
  // 2. Alphanumeric (At least one digit AND one letter)
  const alphaNumMatches = cleaned.matchAll(/\b(?=[A-Z0-9]*[0-9])(?=[A-Z0-9]*[A-Z])[A-Z0-9]{4,10}\b/gi);
  for (const match of alphaNumMatches) addCandidate(match[0]);

  // 3. Dashed (e.g. 123-456)
  const dashedMatches = cleaned.matchAll(/\b[A-Z0-9]{1,4}-[A-Z0-9]{1,6}\b/gi);
  for (const match of dashedMatches) addCandidate(match[0]);

  // 4. Keyword-labeled codes (captures lower/alpha codes like "code: ftkdw")
  const labeledMatches = cleaned.matchAll(
    /\b(?:otp|code|pin|passcode|verification|verify|auth|код|подтверж\w*|пароль)\b(?:\s*(?::|#|-|—|is)\s*)?([A-Za-z0-9-]{4,10})\b/gi
  );
  for (const match of labeledMatches) addCandidate(match[1]);
  
  return Array.from(candidates);
}

export function containsOtpKeywords(text) {
  return /otp|code|verification|verify|confirm|login|auth|код|подтверж|пароль|sms/i.test(text);
}

/**
 * Оценивает "вероятность" того, что строка - это код.
 */
export function scoreCodeCandidate({ code, senderDomain = "", domainPrefs = {} }) {
  let score = 0;
  const codeLower = code.toLowerCase();
  
  const stopWords = [
    'google', 'spotify', 'facebook', 'telegram', 'apple', 'amazon', 'microsoft', 
    'someone', 'binary', 'booking', 'uniqlo', 'github', 'shulgin', 'iaroslav',
    'please', 'thanks', 'hello', 'regards', 'verify', 'account', 'security',
    'browser', 'device', 'location', 'address', 'support', 'message', 'center',
    'login', 'link', 'best', 'ignore', 'safely', 'request', 'requested',
    'click', 'email', 'phone', 'member', 'service', 'online', 'active', 'instagram',
    'itinerary', 'subject', 'details', 'information', 'one-time'
  ];
  if (stopWords.includes(codeLower)) return -100;

  const isPureNumeric = /^\d+$/.test(code);
  const hasDigit = /[0-9]/.test(code);
  const hasLetter = /[a-zA-Z]/.test(code);
  const isAllUpper = code === code.toUpperCase();
  const isCapitalized = /^[A-Z][a-z]+$/.test(code); // "Germany"

  // ПРИОРИТЕТ 1: Обучение
  if (senderDomain && domainPrefs[senderDomain]) {
    const pref = domainPrefs[senderDomain];
    if (pref.len === code.length && pref.isNum === isPureNumeric) return 100;
  }

  // ПРИОРИТЕТ 2: Чистые цифры (6 цифр - идеал)
  if (isPureNumeric) {
    if (code.length === 6) score = 60;
    else if (code.length === 4) score = 45;
    else score = 40;
    if (code.length === 4 && (code.startsWith("20") || code.startsWith("19"))) score -= 10;
  } 
  // ПРИОРИТЕТ 3: Смешанные коды (P4XX7)
  else if (hasDigit && hasLetter) {
    score = 55;
    if (isAllUpper) score += 5;
  }
  // ПРИОРИТЕТ 4: С дефисом (только если есть цифра)
  else if (code.includes("-")) {
    if (hasDigit) score = 58;
    else score = -50; // Игнорируем слова типа one-time
  }
  // ПРИОРИТЕТ 5: Чистые слова
  else {
    if (isAllUpper) score = 0;
    else if (isCapitalized) score = -20; // Обычные слова типа Germany
    else score = -10;
  }

  return score;
}

function scoreCandidateContext(candidate, messageData) {
  const { subject = "", snippet = "", body = "", senderDomain = "" } = messageData;
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");

  const otpNear = /otp|code|verification|verify|confirm|login|auth|pin|passcode|код|подтверж|пароль|вход/i;
  const transactionalNear = /order|booking|reservation|invoice|tracking|брони|бронир|заказ|доставк|отел|hotel|travel|trip/i;

  const scoreInSegment = (segment, otpBonus, transactionPenalty) => {
    const text = String(segment || "");
    if (!text) return 0;

    let localScore = 0;
    let match;
    const globalRegex = new RegExp(regex.source, "gi");
    while ((match = globalRegex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 24);
      const end = Math.min(text.length, match.index + candidate.length + 24);
      const windowText = text.slice(start, end);

      if (otpNear.test(windowText)) localScore += otpBonus;
      if (transactionalNear.test(windowText)) localScore -= transactionPenalty;
    }

    return localScore;
  };

  let total = 0;
  total += scoreInSegment(subject, 18, 40);
  total += scoreInSegment(snippet, 26, 30);
  total += scoreInSegment(body, 20, 25);

  const labelPattern = new RegExp(
    `(?:otp|code|pin|passcode|verification|verify|auth|код|подтверж\\w*|пароль)\\s*(?::|#|-|—|is)\\s*${escaped}\\b`,
    "i"
  );
  if (labelPattern.test(`${subject} ${snippet} ${body}`)) total += 25;

  if (/(booking|reservation|hotel|travel)/i.test(senderDomain || "")) {
    total -= 50;
  }

  return total;
}

export function findBestOtpCode(messageData, settings = {}) {
  const { subject = "", from = "", snippet = "", body = "", senderDomain = "" } = messageData;
  const { userStopWords = [], domainPrefs = {} } = settings;

  const fullText = [subject, snippet, body].join(" ");
  const candidates = findOtpCode(fullText, userStopWords);
  const uniqueCandidates = [...new Set(candidates)];

  if (uniqueCandidates.length === 0) return null;

  const scored = uniqueCandidates.map(code => ({
    code,
    baseScore: scoreCodeCandidate({
      code, senderDomain, domainPrefs
    }),
    contextScore: scoreCandidateContext(code, messageData)
  })).map(item => ({
    code: item.code,
    score: item.baseScore + item.contextScore,
    baseScore: item.baseScore,
    contextScore: item.contextScore
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.contextScore !== a.contextScore) return b.contextScore - a.contextScore;
    return b.baseScore - a.baseScore;
  });

  const best = scored[0];
  const others = scored.slice(1, 10).map(s => s.code);

  return { ...best, others };
}

export function validateGmailQuery(query) {
  if (typeof query !== 'string') return "";
  const str = query.trim();
  if (str.length > 500) return str.substring(0, 500);
  const dangerous = ['script', 'eval', 'fetch', '<', '>'];
  if (dangerous.some(word => str.toLowerCase().includes(word))) return "";
  return str;
}
