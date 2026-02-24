import { VALIDATORS } from '../src/shared/validators.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const parsed = VALIDATORS.parseDomainList('example.com\n api.example.com, bad domain, .oops,ok.io');
  assert(parsed.valid.includes('example.com'), 'expected example.com to be valid');
  assert(parsed.valid.includes('api.example.com'), 'expected api.example.com to be valid');
  assert(parsed.valid.includes('ok.io'), 'expected ok.io to be valid');
  assert(parsed.invalid.includes('bad domain'), 'expected bad domain to be invalid');

  assert(VALIDATORS.isAllowedSiteHost('app.example.com', ['example.com']), 'subdomain should be allowed');
  assert(!VALIDATORS.isAllowedSiteHost('evil-example.com', ['example.com']), 'lookalike domain should not be allowed');

  assert(VALIDATORS.clampClipboardSeconds('500') === 300, 'clipboard seconds should clamp to upper bound');
  assert(VALIDATORS.clampClipboardSeconds('-10') === 0, 'clipboard seconds should clamp to lower bound');

  assert(VALIDATORS.sanitizeCsvCell('=2+2') === "'=2+2", 'formula should be prefixed');
  assert(VALIDATORS.sanitizeCsvCell('+SUM(A1:A2)') === "'+SUM(A1:A2)", 'plus-formula should be prefixed');
  assert(VALIDATORS.sanitizeCsvCell('normal') === 'normal', 'normal text should be unchanged');

  console.log('Security validator tests passed');
}

run();
