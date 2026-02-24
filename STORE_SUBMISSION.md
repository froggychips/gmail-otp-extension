# Chrome Web Store Submission Notes (v1.1.3)

## Product Summary

**Name:** Gmail OTP  
**Version:** 1.1.3  
**Type:** Chrome Extension (Manifest V3)

This extension connects to user-authorized Gmail account(s), detects OTP codes from recent emails, and helps users paste OTP into compatible web forms.

## Core User Value

- Faster OTP retrieval from Gmail.
- Reduced copy/paste friction.
- Safer insertion flow with HTTPS-only and optional site allowlist.

## Permissions Rationale

### `identity`
Used for Google OAuth via Chrome Identity API so users can authorize Gmail access.

### `storage` / `unlimitedStorage`
Used to store:
- connected account metadata,
- user preferences (query, threshold, allowlist, clipboard timeout),
- local history and temporary logs.

### `alarms`
Used for periodic background checks in Auto mode.

### `notifications`
Used to notify users when a new OTP is detected.

### `contextMenus`
Used to provide user-triggered OTP paste action in editable fields.

### `scripting`
Reserved for extension runtime script behavior.

### Host Permissions
- `https://gmail.googleapis.com/*`  
Required to call Gmail API endpoints for user-authorized mailbox data.

## Data Access & Handling

### Data Read
- Email metadata and content needed for OTP detection (`subject`, `snippet`, parsed body text).

### Data Storage
- All operational data stored locally via `chrome.storage.local`.
- No external backend processing is required for OTP detection.

### Data Sharing
- No third-party data selling/sharing behavior is implemented.

## Security Controls Implemented

- Content script injection restricted to HTTPS pages only.
- OTP paste flow blocked on non-HTTPS pages.
- Optional site allowlist for OTP paste destination domains.
- OTP values are not logged in page console.
- Clipboard auto-clear option supported.
- CSV export includes formula-injection mitigation.
- Manifest smoke tests included in CI for security invariants.

## UX / Behavior Notes

- If allowlist is empty: OTP paste allowed on all HTTPS domains.
- If allowlist is set: OTP paste allowed only for matching domains/subdomains.
- OTP insertion targets visible OTP-like fields (`otp/code/pin/2fa`, `autocomplete=one-time-code`).

## Known Limitations

- OTP detection quality depends on sender formatting and language.
- Some websites with custom anti-automation inputs may reject synthetic paste events.
- Gmail API quota/rate limits may temporarily delay fetch operations.

## QA Evidence (Pre-release)

- Syntax checks for main modules (`node --check`).
- OTP detector regression tests (`tests/test-detector.js`).
- Security validator regression tests (`tests/test-security.js`).
- Manifest security smoke tests (`tests/test-manifest.js`).

## Store Listing Checklist

1. Prepare screenshots of popup UI (Code, Filters/Security, Tools).
2. Provide concise privacy disclosure aligned with `PRIVACY_POLICY.md`.
3. Include permission justifications from this document.
4. Verify extension description matches implemented behavior (HTTPS + allowlist security model).
