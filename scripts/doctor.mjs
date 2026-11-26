#!/usr/bin/env node
// Check that job-agent is ready to use.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { p, PATHS, readYaml } from './lib/paths.mjs';

let problems = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const warn = (m) => console.log(`  warn  ${m}`);
const bad = (m) => { problems++; console.log(`  fix   ${m}`); };

console.log('job-agent doctor\n');

const [major] = process.versions.node.split('.').map(Number);
major >= 18 ? ok(`Node ${process.versions.node}`) : bad(`Node ${process.versions.node}: needs 18 or newer`);
existsSync(p('node_modules', 'yaml')) ? ok('dependencies installed') : bad('run `npm install`');

const profile = existsSync(PATHS.profile) ? readYaml(PATHS.profile) : null;
if (!profile) bad('profile/profile.yml missing: run `npm run setup`');
else {
  if (profile.name === 'Alex Chen') warn('profile/profile.yml still holds the example person: ask your agent to "set me up"');
  else ok(`profile for ${profile.name ?? '(no name)'}`);
  if (!profile.targets?.roles?.length) warn('no targets.roles in profile.yml');
  if (!profile.work_authorization?.status) warn('work_authorization.status is empty: forms always ask');
}

if (!existsSync(PATHS.cv)) bad('profile/cv.md missing');
else if (readFileSync(PATHS.cv, 'utf8').includes('Acme Analytics')) warn('profile/cv.md is still the example CV');
else ok('profile/cv.md');

existsSync(PATHS.stories) ? ok('profile/stories.md') : warn('profile/stories.md missing: behavioral prep will be thinner');

const portals = readYaml(PATHS.portals);
if (!portals) warn('portals.yml missing: scanning is off until you add companies');
else ok(`portals.yml: ${(portals.companies ?? []).length} companies`);

const kb = existsSync(PATHS.knowledge) ? readdirSync(PATHS.knowledge).filter((f) => !f.startsWith('.') && f !== 'README.md' && f !== 'INDEX.md') : [];
kb.length ? ok(`knowledge/: ${kb.length} item(s)`) : warn('knowledge/ is empty: interview notes and research make every answer better');

existsSync(PATHS.tracker) ? ok('data/applications.tsv') : warn('no tracker yet: created on first `npm run track -- add`');

const chrome = ['ProgramFiles', 'ProgramFiles(x86)', 'LOCALAPPDATA'].some((k) => process.env[k] && (
  existsSync(`${process.env[k]}\\Google\\Chrome\\Application\\chrome.exe`) || existsSync(`${process.env[k]}\\Microsoft\\Edge\\Application\\msedge.exe`)))
  || ['/Applications/Google Chrome.app', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].some(existsSync)
  || existsSync(p('node_modules', 'playwright')) || Boolean(process.env.CHROME_PATH);
chrome ? ok('PDF backend found') : warn('no Chrome/Edge/Playwright found: `npm run pdf` will only write HTML');

console.log(problems ? `\n${problems} thing(s) to fix.` : '\nReady.');
process.exit(problems ? 1 : 0);
