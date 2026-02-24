import fs from 'node:fs';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run() {
  const raw = fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8');
  const manifest = JSON.parse(raw);

  assert(manifest.manifest_version === 3, 'manifest_version must be 3');
  assert(Array.isArray(manifest.content_scripts), 'content_scripts must exist');
  assert(manifest.content_scripts.length > 0, 'at least one content script must exist');

  const first = manifest.content_scripts[0];
  assert(Array.isArray(first.matches), 'content script matches must be an array');
  assert(first.matches.every((m) => String(m).startsWith('https://')), 'content script matches must be HTTPS-only');
  assert(first.all_frames === false, 'all_frames must be false');

  const csp = manifest.content_security_policy?.extension_pages || '';
  assert(!/unsafe-inline|unsafe-eval/i.test(csp), 'CSP must not include unsafe-inline/unsafe-eval');

  const hostPermissions = manifest.host_permissions || [];
  assert(hostPermissions.every((p) => String(p).startsWith('https://')), 'host_permissions must be HTTPS-only');

  console.log('Manifest smoke tests passed');
}

run();
