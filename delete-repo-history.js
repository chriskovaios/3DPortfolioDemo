#!/usr/bin/env node
// ⚠️  DESTRUCTIVE — rewrites git history. Zero dependencies (Node built-ins + git).
//
// Collapses ALL history (local + remote) into a single fresh commit of the
// current working tree, then force-pushes to origin. Use to scrub the demo repo
// of its past commits and anything that was once committed but shouldn't live in
// history (e.g. large raw exports). The end state: origin/main = one commit.
//
// Usage:
//   node delete-repo-history.js            # asks you to confirm first
//   node delete-repo-history.js --yes      # skip the confirmation prompt
//   node delete-repo-history.js "message"  # custom commit message
//   npm run clean-history

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

const BRANCH = 'main';
const TEMP = '__history_reset__';

const root = dirname(fileURLToPath(import.meta.url));
const flags = process.argv.slice(2).filter((a) => a.startsWith('-'));
const words = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const commitMsg = words.join(' ') || 'Initial commit';
const skipPrompt = flags.includes('--yes') || flags.includes('-y');

function git(args, { capture = false } = {}) {
  const r = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit'
  });
  if (r.error && r.error.code === 'ENOENT') {
    console.error('✗ git is not installed / not on PATH.');
    process.exit(1);
  }
  return { status: r.status == null ? 1 : r.status, out: (r.stdout || '').trim() };
}
const out = (args) => git(args, { capture: true }).out;
function die(m) { console.error(`\n✗ ${m}`); process.exit(1); }

// --- preflight -------------------------------------------------------------
if (!existsSync(join(root, '.git'))) die('Not a git repo here — run `npm run deploy` first.');
if (!out(['config', 'user.email'])) {
  die('git identity not set. Run:\n' +
      '    git config --global user.name  "Your Name"\n' +
      '    git config --global user.email "you@example.com"');
}

const origin = out(['remote', 'get-url', 'origin']) || '(no origin remote set)';
const commits = out(['rev-list', '--count', 'HEAD']) || '0';

// --- confirm ---------------------------------------------------------------
console.log(`
⚠️  This PERMANENTLY erases history and cannot be undone.
    Repo:     ${root}
    Origin:   ${origin}
    History:  ${commits} commit(s)  →  collapses to 1 fresh commit
    Action:   force-push a single "${commitMsg}" commit to origin/${BRANCH}
`);

if (!skipPrompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) => rl.question('Type "erase" to proceed: ', res));
  rl.close();
  if (answer.trim().toLowerCase() !== 'erase') die('Aborted — nothing changed.');
}

// --- rewrite ---------------------------------------------------------------
// An orphan branch has no parent commit → no history behind it.
git(['branch', '-D', TEMP], { capture: true }); // clear leftovers from a failed run (ok if absent)
if (git(['checkout', '--orphan', TEMP]).status !== 0) die('could not create a clean orphan branch.');

git(['add', '-A']);
if (git(['commit', '-m', commitMsg]).status !== 0) die('commit failed (empty working tree?).');

// Replace the old branch with the clean one.
git(['branch', '-D', BRANCH], { capture: true }); // ok if it doesn't exist yet
if (git(['branch', '-m', BRANCH]).status !== 0) die(`could not rename ${TEMP} → ${BRANCH}.`);

// Discard the now-orphaned old commits from local storage.
git(['reflog', 'expire', '--expire=now', '--all'], { capture: true });
git(['gc', '--prune=now'], { capture: true });

// --- push ------------------------------------------------------------------
if (origin.startsWith('(')) {
  console.log(`\n✓ Local history reset to a single commit on ${BRANCH}.`);
  console.log('  No origin remote is set — add one, then force-push:');
  console.log(`    git push -f -u origin ${BRANCH}`);
  process.exit(0);
}

console.log(`\n→ force-pushing clean history to origin/${BRANCH} …`);
if (git(['push', '-f', '-u', 'origin', BRANCH]).status !== 0) {
  die('force-push failed. Check push access / branch protection, then run:\n' +
      `    git push -f -u origin ${BRANCH}`);
}

console.log(`\n✓ Done. origin/${BRANCH} now has a single commit ("${commitMsg}"). All prior history is gone.`);
