#!/usr/bin/env node
// Create your working files from the examples. Never overwrites anything.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { p, PATHS } from './lib/paths.mjs';
import { COLUMNS } from './lib/tracker.mjs';

const copies = [
  [p('examples', 'profile.example.yml'), PATHS.profile],
  [p('examples', 'cv.example.md'), PATHS.cv],
  [p('examples', 'stories.example.md'), PATHS.stories],
  [p('examples', 'portals.example.yml'), PATHS.portals],
  [p('examples', 'knowledge', 'README.md'), p('knowledge', 'README.md')],
];

for (const dir of ['profile', 'knowledge', 'data', 'reports', 'output']) mkdirSync(p(dir), { recursive: true });

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
Next: open this folder in your agent (Claude Code, Codex, Cursor…) and say
  "set me up" — it will turn your résumé into profile/cv.md and fill profile/profile.yml.
The files above still hold the example person until then.`);
