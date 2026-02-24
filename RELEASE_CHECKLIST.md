# Release Checklist

## Pre-Release

1. Ensure working tree is clean:
   - `git status --short`
2. Run local quality gates:
   - `node --check background.js`
   - `node --check popup.js`
   - `node --check src/content/index.js`
   - `node --check src/background/otp-detector.js`
   - `node tests/test-detector.js`
   - `node tests/test-security.js`
   - `node tests/test-manifest.js`
3. Verify manifest version bump:
   - `manifest.json` `version` must be incremented.
4. Smoke test in Chrome (`Load unpacked`):
   - Connect Gmail account.
   - Fetch latest OTP manually.
   - Copy/paste OTP on an HTTPS page.
   - Verify allowlist restrictions and clipboard auto-clear behavior.
   - Verify history and unmatched actions.

## Documentation

1. Update `CHANGELOG.md`.
2. Ensure README reflects current security behavior and troubleshooting.

## Release

1. Commit:
   - `git commit -m "release: vX.Y.Z"`
2. Push:
   - `git push origin main`
3. Tag:
   - `git tag vX.Y.Z`
   - `git push origin vX.Y.Z`

## Post-Release

1. Confirm CI is green on main.
2. Verify extension loads with new version in Chrome.
3. Archive any local-only artifacts not intended for repository.
