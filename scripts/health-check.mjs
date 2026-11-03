#!/usr/bin/env node
/**
 * Health-check for agent-home-recipes M0.
 * - Verifies recipe files exist
 * - If `dsh` is on PATH: checks version pin and optionally dump-config for plugins
 * - Dry-run friendly: missing dsh → clear message, exit 1 (still OK for `npm run check` via --dry)
 *
 * Usage:
 *   node scripts/health-check.mjs
 *   node scripts/health-check.mjs --dry
 *   DSH_HOME=/path node scripts/health-check.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dry = process.argv.includes('--dry');
const recipePath = join(root, 'profiles/default/recipe.json');

function fail(msg) {
  console.error(`[health] FAIL: ${msg}`);
  process.exit(1);
}
function ok(msg) {
  console.log(`[health] OK: ${msg}`);
}

if (!existsSync(recipePath)) fail(`missing ${recipePath}`);
const recipe = JSON.parse(readFileSync(recipePath, 'utf8'));
const expectedHost = recipe.host?.version ?? '0.2.1-rc.5';
const requiredPkgs = (recipe.plugins ?? []).map((p) => p.package);
const blocked = (recipe.doNotInstall ?? []).map((p) => p.package);

ok(`recipe loaded (${requiredPkgs.length} plugins, host ${recipe.host?.package}@${expectedHost})`);

for (const rel of [
  'profiles/default/soul.md',
  'profiles/default/COMPATIBILITY.md',
  'config/quota-router.schema.json',
  'config/quota-router.example.yaml',
  'docs/boundaries.md',
]) {
  if (!existsSync(join(root, rel))) fail(`missing ${rel}`);
}
ok('scaffold files present');

if (dry) {
  ok('dry-run complete (skipped live dsh)');
  process.exit(0);
}

const which = spawnSync('sh', ['-c', 'command -v dsh'], { encoding: 'utf8' });
if (which.status !== 0 || !which.stdout.trim()) {
  fail('`dsh` not found on PATH. Install @deepseek-ai/dsh@0.2.1-rc.5 or re-run with --dry');
}

const ver = spawnSync('dsh', ['--version'], { encoding: 'utf8' });
const version = (ver.stdout || ver.stderr || '').trim();
if (ver.status !== 0) fail(`dsh --version failed: ${version}`);
ok(`dsh version: ${version}`);
if (!version.includes(expectedHost)) {
  console.warn(`[health] WARN: expected host tip ${expectedHost}, got ${version}`);
}

const env = { ...process.env };
if (!env.DSH_HOME) {
  console.warn('[health] WARN: DSH_HOME unset; dump-config uses default home');
}

const dump = spawnSync('dsh', ['web', '--dump-config'], {
  encoding: 'utf8',
  env,
  maxBuffer: 8 * 1024 * 1024,
});
if (dump.status !== 0) {
  fail(`dsh web --dump-config failed:\n${dump.stderr || dump.stdout}`);
}
const tree = dump.stdout || '';
ok('dump-config succeeded');

const missing = [];
for (const pkg of requiredPkgs) {
  // dump-config lists package names in `name:` fields
  if (!tree.includes(pkg) && !tree.includes(pkg.replace(/^@[^/]+\//, ''))) {
    // soft: profile may not have plugins yet
    missing.push(pkg);
  }
}
if (missing.length) {
  console.warn(
    `[health] WARN: required plugins not seen in dump-config (install with npm run install:profile): ${missing.join(', ')}`,
  );
} else {
  ok('required plugin names appear in dump-config');
}

for (const pkg of blocked) {
  if (pkg === '@goodandready/dsh-key-rotation') continue; // optional alt; warn only if co-present with key-fallback
}
if (tree.includes('@omdp/dsh-key-fallback') && tree.includes('@goodandready/dsh-key-rotation')) {
  console.warn('[health] WARN: dual resolve-wrap detected (key-fallback + key-rotation). Prefer exactly one.');
}
if (tree.includes('dsh-subagent-progress') || tree.includes('dsh-bridges')) {
  console.warn('[health] WARN: blocked plugin appears in dump-config (progress/bridges not supported on 0.2.1-rc.5)');
}

ok('health-check finished');
process.exit(0);
