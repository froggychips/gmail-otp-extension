# Maintainers Runbook

## Scope

This runbook is for maintainers of Gmail OTP extension and covers:

1. Incident triage
2. Fast diagnostics
3. Safe hotfix workflow
4. Release verification

## 1) Incident Severity

- **SEV-1**: Extension unusable for core flow (cannot fetch OTP, crash on popup open, broken auth for all users).
- **SEV-2**: Core flow works with degraded behavior (partial detection failures, intermittent paste failures).
- **SEV-3**: Non-critical UX/docs issues.

## 2) First 10 Minutes (Triage)

1. Reproduce with latest `main`.
2. Capture exact error text from popup/system logs.
3. Identify affected scope:
   - all users or specific websites/domains,
   - manual mode vs auto mode,
   - auth vs detection vs insertion.
4. Decide severity and assign owner.

## 3) Quick Diagnostic Commands

Run from repo root:

```bash
node --check background.js
node --check popup.js
node --check src/content/index.js
node --check src/background/otp-detector.js
node tests/test-detector.js
node tests/test-security.js
node tests/test-manifest.js
```

Interpretation:

- `test-manifest` fails: security/manifest invariant regression.
- `test-security` fails: validation/sanitization/allowlist regression.
- `test-detector` fails: OTP extraction/scoring regression.

## 4) Incident Decision Tree

### A. Auth failures (Google OAuth / Gmail API)

Check:

1. `identity` permission still present in manifest.
2. OAuth scopes and client ID unchanged.
3. Error logs for `auth_error` and token refresh path.

Action:

- If regression in recent commit: revert/cherry-pick fix as hotfix.

### B. OTP not detected

Check:

1. Query filters and threshold changes.
2. Domain allowlist/blocklist side effects.
3. Detector tests and recently changed scoring logic.

Action:

- Patch detector rules and add regression case before release.

### C. OTP not inserted on page

Check:

1. Page is HTTPS.
2. Site allowlist rules.
3. OTP-like input presence and visibility.

Action:

- If intended security block: document behavior.
- If false negative: adjust field matching logic + add tests.

## 5) Hotfix Workflow

1. Create branch: `codex/hotfix-<short-topic>`.
2. Implement minimal safe fix.
3. Add/update tests covering incident.
4. Run full local checks (section 3).
5. Commit with message: `hotfix: <issue summary>`.
6. Open PR to `main` (or apply directly if emergency policy allows).
7. Merge and tag patch version (`vX.Y.Z+1`).

## 6) Versioning Rules

- Patch (`X.Y.Z+1`): bugfix/security/doc-only functional fixes.
- Minor (`X.Y+1.0`): user-visible features.
- Keep `CHANGELOG.md` updated for every release.

## 7) Post-Hotfix Verification

1. Reload extension in Chrome (`chrome://extensions`).
2. Validate:
   - connect account,
   - manual fetch,
   - copy/paste on HTTPS page,
   - allowlist behavior,
   - clipboard auto-clear.
3. Confirm CI green on `main`.

## 8) Rollback Strategy

If hotfix introduces regression:

1. Revert hotfix commit.
2. Re-run CI and smoke tests.
3. Publish rollback patch tag.

## 9) Ownership Notes

- Keep security controls default-safe.
- Prefer fail-closed behavior for paste flow.
- Document intentional behavior changes in README + CHANGELOG.
