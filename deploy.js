#!/usr/bin/env node
// Zero-dependency GitHub Pages deploy.
// Publishes this static site (index.html + src/ + assets/models) to the repo
// below on the `main` branch. There is NO build step and NO npm dependency —
// GitHub Pages serves the files verbatim, which is the whole point of this
// project's zero-dependency, importmap-from-CDN architecture.
//
// Prerequisites:
//   • git on PATH, with an identity set (user.name / user.email) and push
//     access to the repo (Git Credential Manager, SSH key, or `gh auth login`).
//   • (optional) GitHub CLI `gh` — if present, Pages is enabled automatically.
//
// Usage:
//   npm run deploy                 # commit + push everything
//   npm run deploy -- "message"    # with a custom commit message

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REMOTE_URL = 'https://github.com/chriskovaios/3DPortfolioDemo.git';
const BRANCH = 'main';

const root = dirname(fileURLToPath(import.meta.url));
const commitMsg = process.argv.slice(2).join(' ') || 'Deploy 3D portfolio';

// owner/repo → Pages URL, for the final message + optional gh call.
const parts = REMOTE_URL.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);
const owner = parts && parts[1];
const repo = parts && parts[2];
const pagesUrl = owner ? `https://${owner}.github.io/${repo}/` : '(your Pages URL)';

// --- helpers ---------------------------------------------------------------
function run(cmd, args, { capture = false } = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit'
  });
  if (r.error && r.error.code === 'ENOENT') return { missing: true, status: 1, out: '' };
  return { missing: false, status: r.status == null ? 1 : r.status, out: (r.stdout || '').trim() };
}
const git = (args, opts) => run('git', args, opts);
const gitOut = (args) => git(args, { capture: true }).out;
function die(m) { console.error(`\n✗ ${m}`); process.exit(1); }

// --- 0. git present? -------------------------------------------------------
if (git(['--version'], { capture: true }).missing) die('git is not installed / not on PATH.');

// --- 1. init repo ----------------------------------------------------------
if (!existsSync(join(root, '.git'))) {
  console.log('→ git init');
  git(['init']);
}

// --- 2. git identity -------------------------------------------------------
if (!gitOut(['config', 'user.email'])) {
  die('git identity not set. Run:\n' +
      '    git config --global user.name  "Your Name"\n' +
      '    git config --global user.email "you@example.com"');
}

// --- 3. Pages hygiene files ------------------------------------------------
function ensureFile(name, contents) {
  const p = join(root, name);
  if (!existsSync(p)) {
    writeFileSync(p, contents);
    console.log(`→ created ${name}`);
  }
}
// Append a pattern to .gitignore if it isn't already listed (works even when
// .gitignore already exists and was written by something other than this script).
function ensureIgnored(pattern) {
  const p = join(root, '.gitignore');
  let body = existsSync(p) ? readFileSync(p, 'utf8') : '';
  const listed = body.split(/\r?\n/).some((line) => line.trim() === pattern);
  if (!listed) {
    if (body && !body.endsWith('\n')) body += '\n';
    body += `${pattern}\n`;
    writeFileSync(p, body);
    console.log(`→ added "${pattern}" to .gitignore`);
  }
}
ensureFile('.nojekyll', ''); // tell Pages: serve files as-is, don't run Jekyll
ensureFile('.gitignore',
  '# Build inputs & local cruft — not part of the deployed site\n' +
  'node_modules/\n' +
  'raw/\n' +
  '*.log\n' +
  '.DS_Store\n' +
  'Thumbs.db\n' +
  'README.md\n');
// The README is a local dev note — keep it out of the published demo repo.
ensureIgnored('README.md');

// --- 4. remote -------------------------------------------------------------
const hasOrigin = gitOut(['remote']).split(/\s+/).filter(Boolean).includes('origin');
git(['remote', hasOrigin ? 'set-url' : 'add', 'origin', REMOTE_URL]);
console.log(`→ origin = ${REMOTE_URL}`);

// --- 5. commit -------------------------------------------------------------
git(['add', '-A']);
// Drop the README from the index in case an earlier deploy already tracked it.
git(['rm', '--cached', '--ignore-unmatch', 'README.md'], { capture: true });
const hasHead = git(['rev-parse', '--verify', 'HEAD'], { capture: true }).status === 0;
const dirty = gitOut(['status', '--porcelain']) !== '';
if (dirty || !hasHead) {
  if (git(['commit', '-m', commitMsg]).status !== 0) die('commit failed.');
} else {
  console.log('→ nothing to commit (working tree clean)');
}

// --- 6. branch + push ------------------------------------------------------
git(['branch', '-M', BRANCH]);
console.log(`→ pushing to origin/${BRANCH} …`);
if (git(['push', '-u', 'origin', BRANCH]).status !== 0) {
  die('push failed. Confirm the repo exists and you have push access.\n' +
      '  If the remote already has commits, reconcile first:\n' +
      `    git pull --rebase origin ${BRANCH}   (then re-run)`);
}

// --- 7. best-effort: enable Pages via gh -----------------------------------
if (!run('gh', ['--version'], { capture: true }).missing && owner) {
  console.log('→ enabling GitHub Pages (main / root) via gh …');
  const r = run('gh', [
    'api', '-X', 'POST', `repos/${owner}/${repo}/pages`,
    '-f', `source[branch]=${BRANCH}`, '-f', 'source[path]=/'
  ], { capture: true });
  console.log(r.status === 0
    ? '  Pages enabled.'
    : '  (Could not auto-enable — already on, or enable it manually below.)');
}

console.log(`
✓ Deployed to ${REMOTE_URL} (${BRANCH}).

If Pages isn't enabled yet:
  repo → Settings → Pages → Source: "Deploy from a branch" → ${BRANCH} / (root)

Live at:  ${pagesUrl}
(First build takes ~1 minute.)`);
