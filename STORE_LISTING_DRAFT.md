# Chrome Web Store Listing Draft (v1.1.3)

## Extension Name

Gmail OTP

## Short Description (132 chars max)

Find OTP codes in Gmail fast and paste safely on HTTPS sites with optional domain allowlist and clipboard auto-clear.

## Detailed Description

Gmail OTP helps you find one-time passwords (OTP) and verification codes in your Gmail inbox quickly.

### What it does

- Connects your Gmail account with user-authorized read-only access.
- Detects OTP codes in matching emails using local scoring logic.
- Shows latest code and history in a compact popup.
- Lets you copy and paste OTP into compatible form fields.

### Security-focused behavior

- OTP insertion is restricted to HTTPS pages.
- Optional domain allowlist for OTP insertion targets.
- Optional clipboard auto-clear timer after copying.
- OTP values are not logged in page console.
- CSV export includes formula-injection mitigation.

### Quality and reliability

- Detector regression tests for common OTP formats.
- Security validator tests and manifest smoke checks in CI.

### Permissions explained

- `identity`: Google OAuth sign-in for Gmail access.
- `https://gmail.googleapis.com/*`: Gmail API calls for authorized account.
- `storage`: local settings/history.
- `alarms`: periodic checks in Auto mode.
- `notifications`: new OTP alerts.
- `contextMenus`: user-triggered paste action.

## Category Suggestions

- Productivity
- Developer Tools (alternative)

## Privacy Highlights (for listing text)

- Processes Gmail data locally in your browser.
- No sale of personal data.
- No advertising use of personal data.
- No remote code execution.

## Support / Help Text

If OTP paste does not work, check:

1. The page is opened via HTTPS.
2. The domain is allowed (if allowlist is configured).
3. The page has a visible OTP-like input field.

## Suggested Changelog Snippet for “What’s new”

Version 1.1.3
- Improved OTP detection and reduced false positives.
- Added stronger security controls for OTP insertion.
- Added optional site allowlist and clipboard auto-clear settings.
- Improved popup responsiveness and quality gates in CI.
