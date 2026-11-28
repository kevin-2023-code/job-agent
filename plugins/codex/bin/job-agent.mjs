#!/usr/bin/env node
// job-agent <command> [args]
//   install   skills + TrueInterview MCP + sign-in for every agent on this machine
//   uninstall undo install
//   where     print the workspace folder
//   init      create the workspace from the examples (never overwrites)
//   scan      new postings at the companies in portals.yml
//   track     the local application tracker
//   list      the local to-apply list
//   agent     setup steps and the setup message for one agent
//   pdf       Markdown CV or letter → HTML + PDF
//   kb        search or index knowledge/
//   doctor    check the setup

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { PKG_ROOT, WORKSPACE } from '../scripts/lib/paths.mjs';

const COMMANDS = { changed: 'changed.mjs', install: 'install.mjs', uninstall: 'install.mjs', init: 'setup.mjs', setup: 'setup.mjs', scan: 'scan.mjs', track: 'track.mjs', list: 'apply-list.mjs', agent: 'agent-setup.mjs', pdf: 'cv-pdf.mjs', kb: 'kb.mjs', doctor: 'doctor.mjs' };
const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'where') {
  console.log(WORKSPACE);
} else if (COMMANDS[cmd]) {
  const r = spawnSync(process.execPath, [join(PKG_ROOT, 'scripts', COMMANDS[cmd]), ...(cmd === 'uninstall' ? ['uninstall'] : []), ...rest], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else {
  console.log(`job-agent <command>

  install   set up every agent here: skills, TrueInterview MCP, sign-in
  uninstall remove what install added
  where     print the workspace folder (${WORKSPACE})
  changed   local profile files not yet uploaded to TrueInterview
  init      create the workspace from the examples (never overwrites)
  scan      new postings at the companies in portals.yml
  track     the local application tracker (list, find, add, set, note, due, stats)
  list      the to-apply list (list, add, approve, done, skip, back, remove)
  agent     setup for one agent: Claude Code, Codex, Cursor, Gemini, OpenCode, Muse, Manus, Grok, Qwen, WorkBuddy
  pdf       Markdown CV or letter → HTML + PDF
  kb        search or index knowledge/
  doctor    check the setup`);
  process.exit(cmd && cmd !== 'help' && cmd !== '--help' ? 1 : 0);
}
