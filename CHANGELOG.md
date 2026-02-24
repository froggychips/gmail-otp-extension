# Changelog

## 1.1.3 - 2026-02-24

### Security
- Enforced HTTPS-only paste behavior for OTP insertion paths.
- Added optional site allowlist enforcement for OTP paste.
- Added clipboard auto-clear timer support in popup settings.
- Added CSV formula-injection mitigation for exports.
- Removed OTP value logging from content script.

### UX / UI
- Refreshed popup visual style and improved responsive behavior for narrow popup widths.
- Added security settings UI feedback (saved/error status, allowlist summary).
- Improved keyboard focus visibility and accessibility hints.

### Detection
- Improved OTP candidate extraction and scoring with contextual ranking.
- Reduced false positives for transactional/booking message contexts.

### Quality & CI
- Added validator security regression tests.
- Added manifest smoke tests for security invariants.
- CI now runs syntax checks + detector tests + security tests + manifest smoke tests.

## 1.1.2 - 2026-02-24

- Security hardening for OTP insertion flow.
- Added initial CI checks and security UX controls.

## 1.1.1

- Previous baseline release.
