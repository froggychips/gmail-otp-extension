import { findOtpCode, scoreCodeCandidate, findBestOtpCode } from '../src/background/otp-detector.js';

const testCases = [
  {
    name: "Classic numeric 6 digits",
    subject: "Your OTP is 123456",
    snippet: "Use 123456 to login",
    body: "Hello, your verification code is 123456.",
    expectedCode: "123456"
  },
  {
    name: "Alphanumeric code (uppercase)",
    subject: "Security code",
    snippet: "Your code is AB12CD",
    body: "Please enter AB12CD in the app.",
    expectedCode: "AB12CD"
  },
  {
    name: "Multiple numbers (Order + OTP)",
    subject: "Order #987654 confirmed",
    snippet: "Your verification code: 112233",
    body: "Thanks for your order #987654. Your login code is 112233.",
    expectedCode: "112233"
  },
  {
      name: "Dashed format",
      subject: "Verification",
      snippet: "Your code: 123-456",
      body: "Enter 123-456",
      expectedCode: "123-456"
  },
  {
      name: "Mixed case alphanumeric (penalized)",
      subject: "Hi there",
      snippet: "Your code is Ab12Cd",
      body: "Ab12Cd",
      expectedCode: "Ab12Cd"
  },
  {
      name: "Pure word (penalized/ignored)",
      subject: "Please help",
      snippet: "Your message",
      body: "Please help me",
      expectedCode: null
  },
  {
    name: "ThaiFriendly (lowercase alpha)",
    subject: "Login code for ThaiFriendly",
    from: "support@thaifriendly.com",
    snippet: "Login Code: ftkdw",
    body: "Hi! You or someone else requested a login code for ThaiFriendly. Login Code: ftkdw If you did not request this...",
          expectedCode: "ftkdw"
      },
      {
        name: "hh.ru (4-digit numeric at start)",
        subject: "Код подтверждения",
        from: "noreply@hh.ru",
        snippet: "4855 — ваш код подтверждения email/входа для hh.ru",
        body: "4855 — ваш код подтверждения email/входа для hh.ru. Если нужна помощь...",
            expectedCode: "4855"
          },
          {
            name: "Facebook (8-digit, label after code)",
            subject: "95801673 — это ваш код безопасности",
            from: "security@facebookmail.com",
            snippet: "95801673 — это ваш код безопасности Facebook • Fri, 27 Jun 2025...",
            body: "95801673 — это ваш код безопасности. Если вы не запрашивали этот код...",
                expectedCode: "95801673"
              },
              {
                name: "Booking Confirmation (Should be ignored)",
                subject: "Ваше бронирование №778899 подтверждено",
                from: "noreply@booking.com",
                snippet: "Код подтверждения бронирования: 1234. Отель: Гранд Плаза.",
                body: "Здравствуйте! Ваш номер бронирования: 778899. ПИН-код: 1234. Ждем вас в отеле.",
                    expectedCode: null
                  },
                  {
                    name: "Steam Guard (5-char alphanumeric uppercase)",
                    subject: "Your Steam account: Access from new computer",
                    from: "noreply@steampowered.com",
                    snippet: "Here is the Steam Guard code you need to access your account: P4XX7",
                    body: "It looks like you are trying to log in from a new device. ... Germany P4XX7 If this wasn't you...",
                    expectedCode: "P4XX7"
                  },
                  {
                    name: "Email Verification Link",
                    subject: "Verify your email address",
                    from: "no-reply@service.com",
                    snippet: "Please click the link below to verify your email.",
                    body: "Welcome! To finish setting up your account, please verify your email: https://service.com/verify?token=abc123def456. This link expires in 24 hours.",
                    expectedCode: null,
                    expectedType: "link",
                    expectedLink: "https://service.com/verify?token=abc123def456"
                  }
                ];
                
                function runTests() {
  testCases.forEach(tc => {
    const haystack = [tc.subject, tc.snippet, tc.body].join(" ");
    const candidates = [
        ...findOtpCode(tc.subject),
        ...findOtpCode(tc.snippet),
        ...findOtpCode(tc.body)
    ];
    const uniqueCandidates = [...new Set(candidates)];
    
    console.log(`Test: ${tc.name}`);
    console.log(`Candidates found: ${JSON.stringify(uniqueCandidates)}`);
    
    const senderDomain = String(tc.from || "service@example.com").split("@")[1] || "";
    let best = findBestOtpCode({
      subject: tc.subject,
      from: tc.from || "service@example.com",
      snippet: tc.snippet,
      body: tc.body,
      senderDomain
    }) || { code: null, score: -Infinity };

    uniqueCandidates.forEach(code => {
      const score = scoreCodeCandidate({ code, senderDomain });
      console.log(`- Code: ${code}, Base Score: ${score}`);
    });
    
    console.log(`Result: ${best.code || best.link} (Score: ${best.score}, Type: ${best.type})`);
    
    if (tc.expectedType && best.type !== tc.expectedType) {
        console.log(`FAILED: Expected type ${tc.expectedType}, got ${best.type}`);
    } else if (tc.expectedLink && best.link !== tc.expectedLink) {
        console.log(`FAILED: Expected link ${tc.expectedLink}, got ${best.link}`);
    } else if (tc.expectedCode && best.code !== tc.expectedCode) {
        console.log(`FAILED: Expected code ${tc.expectedCode}`);
    } else if (!tc.expectedCode && !tc.expectedType && best.code && best.score > 0) {
        console.log(`FAILED: Should not have found a code with positive score`);
    }
    console.log('---');
  });
}

runTests();
