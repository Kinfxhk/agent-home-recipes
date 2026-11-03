#!/usr/bin/env node
/**
 * Local M0 gate: validate recipe + schema parse + health --dry + no obvious secrets.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function fail(m) {
  console.error(`[check] FAIL: ${m}`);
  process.exit(1);
}
function ok(m) {
  console.log(`[check] OK: ${m}`);
}

const required = [
  'LICENSE',
  'NOTICE',
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'THIRD_PARTY_NOTICES.md',
  '.env.example',
  'package.json',
  'profiles/default/recipe.json',
  'profiles/default/soul.md',
  'profiles/default/COMPATIBILITY.md',
  'config/quota-router.schema.json',
  'config/quota-router.example.yaml',
  'docs/boundaries.md',
  'scripts/health-check.mjs',
  'scripts/install-profile.mjs',
];
for (const rel of required) {
  if (!existsSync(join(root, rel))) fail(`missing ${rel}`);
}
ok('required files');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (pkg.name !== 'agent-home-recipes') fail(`package.json name is ${pkg.name}`);
const recipe = JSON.parse(readFileSync(join(root, 'profiles/default/recipe.json'), 'utf8'));
JSON.parse(readFileSync(join(root, 'config/quota-router.schema.json'), 'utf8'));
ok('JSON parse');

const wraps = (recipe.plugins ?? []).filter((p) => p.role === 'resolve-wrap');
if (wraps.length !== 1 || wraps[0].package !== '@omdp/dsh-key-fallback') {
  fail('resolve-wrap must be exactly @omdp/dsh-key-fallback');
}
const names = (recipe.plugins ?? []).map((p) => p.package);
for (const need of ['dsh-soul-md', '@omdp/dsh-key-fallback', 'dsh-llm-fallbacks', '@nanmicoder/dsh-agent-teams']) {
  if (!names.includes(need)) fail(`recipe missing ${need}`);
}
if (names.includes('@goodandready/dsh-key-rotation')) fail('key-rotation must not be in default plugins');
if (names.includes('dsh-subagent-progress') || names.includes('dsh-bridges')) fail('blocked plugin in recipe');
if (recipe.host?.version !== '0.2.1-rc.5') fail('host pin must be 0.2.1-rc.5');
ok('recipe policy');

// crude secret / key material scan on text files
const suspicious = /(?:sk-[a-zA-Z0-9]{20,}|api[_-]?key\s*[:=]\s*['\"][^'\"]+['\"]|BEGIN (?:RSA |OPENSSH )?PRIVATE KEY)/i;
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(md|json|ya?ml|mjs|js|example|toml|txt)$/i.test(name) || name === 'LICENSE' || name === 'NOTICE') out.push(p);
  }
  return out;
}
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8');
  if (suspicious.test(text)) fail(`suspicious secret-like material in ${file}`);
}
ok('no obvious secrets');

const health = spawnSync(process.execPath, [join(root, 'scripts/health-check.mjs'), '--dry'], {
  encoding: 'utf8',
});
if (health.status !== 0) {
  console.error(health.stdout);
  console.error(health.stderr);
  fail('health --dry failed');
}
ok('health --dry');

console.log('[check] all green');
