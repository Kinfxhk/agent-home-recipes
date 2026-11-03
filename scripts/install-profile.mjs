#!/usr/bin/env node
/**
 * Print / optionally run reversible plugin install into a DSH web profile.
 * Never writes secrets. Requires DSH_HOME for real installs.
 *
 *   node scripts/install-profile.mjs            # print commands
 *   node scripts/install-profile.mjs --apply    # run dsh plugin add (needs dsh + DSH_HOME)
 *   node scripts/install-profile.mjs --uninstall
 *   node scripts/install-profile.mjs --uninstall --apply
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const apply = process.argv.includes('--apply');
const uninstall = process.argv.includes('--uninstall');
const recipe = JSON.parse(readFileSync(join(root, 'profiles/default/recipe.json'), 'utf8'));
const profile = recipe.profile || 'web';
const pkgs = (recipe.plugins ?? []).map((p) => p.package);
const host = `${recipe.host.package}@${recipe.host.version}`;

console.log(`# agent-home-recipes · ${uninstall ? 'uninstall' : 'install'} (${profile})`);
console.log(`# Host tip: ${host}`);
console.log(`# Resolve-wrap policy: exactly-one → default ${recipe.resolveWrap.default}`);
console.log('# Credentials: set in $DSH_HOME/.credentials.yaml — never in this repo.');
console.log('');
console.log('# 0) Set a dedicated home (reversible: delete the directory)');
console.log('export DSH_HOME="${DSH_HOME:-$HOME/.agent-home-recipes-dsh}"');
console.log('mkdir -p "$DSH_HOME"');
console.log('');
console.log('# 1) Ensure host');
console.log(`npm i -g ${host}`);
console.log('');

const action = uninstall ? 'remove' : 'add';
for (const pkg of pkgs) {
  const cmd = `dsh plugin --profile ${profile} ${action} ${pkg}`;
  console.log(cmd);
}

console.log('');
console.log('# 2) Verify');
console.log('dsh web --dump-config | head');
console.log('npm run healthcheck');
console.log('');
console.log('# Reverse: npm run uninstall:profile -- --apply');
console.log('# or: rm -rf "$DSH_HOME"  (wipes that profile home only)');
console.log('');
console.log('# Optional alternative resolve-wrap (NOT with key-fallback):');
for (const alt of recipe.resolveWrap?.optionalAlternatives ?? []) {
  console.log(`#   dsh plugin --profile ${profile} remove ${recipe.resolveWrap.default}`);
  console.log(`#   dsh plugin --profile ${profile} add ${alt.package}`);
  console.log(`#   # ${alt.note}`);
}
console.log('');
console.log('# Do NOT install: ' + (recipe.doNotInstall ?? []).map((d) => d.package).join(', '));

if (!apply) {
  console.log('\n# Dry print only. Re-run with --apply to execute plugin ' + action + '.');
  process.exit(0);
}

if (!process.env.DSH_HOME) {
  console.error('[install] Refusing --apply without DSH_HOME (set a dedicated directory).');
  process.exit(1);
}

const which = spawnSync('sh', ['-c', 'command -v dsh'], { encoding: 'utf8' });
if (which.status !== 0) {
  console.error('[install] dsh not on PATH. Install host first, then retry --apply.');
  process.exit(1);
}

for (const pkg of pkgs) {
  console.log(`[install] ${action} ${pkg} …`);
  const r = spawnSync('dsh', ['plugin', '--profile', profile, action, pkg], {
    encoding: 'utf8',
    env: process.env,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error(`[install] failed on ${pkg}`);
    process.exit(r.status ?? 1);
  }
}
console.log(`[install] done (${action}). Run: npm run healthcheck`);
