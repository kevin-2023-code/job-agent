#!/usr/bin/env node
// Create your working files from the examples. Never overwrites anything.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { pkg, ws, PATHS, WORKSPACE } from './lib/paths.mjs';
import { COLUMNS } from './lib/tracker.mjs';

const copies = [
  [pkg('examples', 'profile.example.yml'), PATHS.profile],
  [pkg('examples', 'cv.example.md'), PATHS.cv],
  [pkg('examples', 'stories.example.md'), PATHS.stories],
  [pkg('examples', 'portals.example.yml'), PATHS.portals],
  [pkg('examples', 'knowledge', 'README.md'), ws('knowledge', 'README.md')],
];

for (const dir of ['profile', 'knowledge', 'data', 'reports', 'output']) mkdirSync(ws(dir), { recursive: true });

for (const [from, to] of copies) {
  if (existsSync(to)) { console.log(`keep    ${to}`); continue; }
  copyFileSync(from, to);
  console.log(`create  ${to}`);
}

if (!existsSync(PATHS.tracker)) {
  writeFileSync(PATHS.tracker, COLUMNS.join('\t') + '\n');
  console.log(`create  ${PATHS.tracker}`);
}

console.log(`
Workspace: ${WORKSPACE}

Next: in your agent (Claude Code, Codex, Cursor, Copilot, Gemini…) say "set me up".
With TrueInterview connected, your résumé and preferences are saved to your account;
otherwise the agent fills profile/ here. The files above hold an example person until then.`);
