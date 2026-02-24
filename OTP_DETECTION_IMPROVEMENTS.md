# OTP Detection Improvements Roadmap

## Implemented

- Multi-candidate extraction from `subject + snippet + body` instead of first-match behavior.
- Format-aware detection for numeric, alphanumeric, dashed, and label-based (`Code: ...`) patterns.
- Combined scoring model:
  - base format score,
  - context score (OTP keywords vs transactional context),
  - domain preference learning.
- False-positive reduction:
  - explicit stop words,
  - excluded generic tokens,
  - penalties for non-OTP-like words,
  - booking/travel contextual penalties.
- User feedback loop:
  - allowlist/blocklist actions,
  - code correction updates domain preferences,
  - ignore action appends user stop words.

## In Progress

- Broader multilingual keyword coverage beyond EN/RU.
- Better explainability in UI (why candidate was picked/rejected).

## Next Candidates

- Add dedicated regression corpus (real-world anonymized messages) in tests.
- Introduce confidence bands for UI decisions (high/medium/low confidence).
- Add optional domain-specific templates for high-volume providers.
