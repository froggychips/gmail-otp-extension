# Chrome Web Store Data Disclosure Checklist

Use this as a direct mapping when filling the Privacy section in Chrome Web Store.

## Data Types Accessed

- **Personal communications:** Yes (Gmail message content needed for OTP detection).
- **User activity / website content interaction:** Yes (OTP paste action into active form fields).
- **Personally identifiable information:** Limited (email sender/account metadata may contain identifiers).

## Purpose of Use

- Extension feature functionality (OTP detection, display, insertion).
- Security and fraud prevention (safe insertion controls and validation).

## Not Used For

- Advertising / ad targeting.
- Sale of user data.
- Creditworthiness or lending decisions.

## Data Handling Statements

- Data is processed locally in the browser.
- No transmission of Gmail content/OTP to developer-owned servers.
- Data is stored in `chrome.storage.local` for feature operation.

## Security Practices to Declare

- HTTPS-only OTP insertion flow.
- Optional site allowlist for insertion.
- Clipboard auto-clear option.
- No remote code execution.

## Retention

- Local-only retention until user clears extension data or uninstalls.

## Required Consistency Checks Before Submission

1. `PRIVACY_POLICY.md` reflects the same statements.
2. Chrome Web Store listing description does not contradict privacy statements.
3. Permissions rationale in `STORE_SUBMISSION.md` matches manifest and behavior.
