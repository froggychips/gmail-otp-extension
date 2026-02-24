# Gmail OTP — Support FAQ

## 1) Why is OTP not inserted into the page?

Check these items in order:

1. The page is opened via `https://`.
2. If site allowlist is configured, current domain is included.
3. A visible OTP-like input exists (`otp`, `code`, `pin`, `2fa`, or `autocomplete=one-time-code`).
4. You clicked the OTP card in popup (user-triggered flow).

## 2) Why does extension say no code found?

Possible reasons:

1. Gmail query is too narrow.
2. Email does not contain OTP-like patterns.
3. Sender/domain is blocked by local preferences.
4. Threshold is set too high.

Try:

- Adjust query in Filters.
- Temporarily lower detection threshold.
- Check unmatched emails list and mark code/non-code.

## 3) Why paste works on one site but not another?

Sites differ in input implementations. Some custom components block synthetic events.

Try:

1. Focus OTP field manually.
2. Click code in popup again.
3. Paste manually from clipboard (`Ctrl/Cmd + V`).

## 4) Why is code copied but quickly disappears from clipboard?

Clipboard auto-clear is enabled.

Go to:

- Filters → Advanced settings → Security
- Set `Clipboard auto-clear (seconds)` to desired value (or `0` to disable)

## 5) Why extension asks for Gmail read permission?

The extension needs Gmail read-only access to detect OTP in your authorized mailbox.

It does not need send/delete permissions.

## 6) Does extension send my emails to developer servers?

No. OTP detection is processed locally in browser runtime.

See:

- `PRIVACY_POLICY.md`
- `WEBSTORE_DISCLOSURE_CHECKLIST.md`

## 7) How to reset everything?

In popup:

- Tools → Data → Reset All

This clears local extension data (accounts/settings/history).

## 8) Why popup layout looks broken or zoomed?

1. Reload extension in `chrome://extensions`.
2. Reopen popup.
3. Reset browser zoom (`Ctrl/Cmd + 0`).

Version `1.1.3` includes popup scaling improvements.

## 9) Why no background checks in auto mode?

Check:

1. At least one account is connected.
2. Mode is set to Auto.
3. You are not currently running deep test mode.

## 10) I changed allowlist but behavior didn’t update immediately

Close and reopen popup or trigger a manual fetch once.

Allowlist is stored locally and applied to paste flow checks.
