#!/usr/bin/env node
// One-stop install: the skill pack, the TrueInterview MCP and sign-in, for every agent on
// this machine.
//
//   job-agent install [--agents claude,codex,...] [--dry-run] [--local] [--no-login] [--url <mcp url>]
// No prompts: TrueInterview is connected by default; --local skips it.
//   job-agent uninstall [--agents ...] [--dry-run]
//
// What it does, in order:
//   1. copies job-agent to ~/.job-agent (the scripts the skills run) and creates the
//      workspace ~/job-agent (your files; never overwritten)
//   2. finds the agents installed here and, for each one you keep:
//      - copies the skills to that agent's user skills folder (~/.claude/skills for Claude
//        Code; ~/.agents/skills, the shared folder Codex, Cursor, Copilot, Gemini and
//        Windsurf/Devin read; ~/.config/opencode/skills for OpenCode)
//      - registers the TrueInterview MCP server at user level (its CLI, or its JSON config
//        with a .bak copy first)
//   3. signs in: runs the agent's own login where it has one (Claude Code, Codex,
//      OpenCode), opens TrueInterview in
//      your browser once so every later sign-in prompt is one click, and prints the one
//      step left per agent.
// Everything is user-level and reversible with `job-agent uninstall`.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir, platform } from 'node:os';
import { spawnSync } from 'node:child_process';
import { PKG_ROOT, parseArgs } from './lib/paths.mjs';

const args = parseArgs(process.argv.slice(2));
// --local: the candidate wants their own data only, no TrueInterview.
if (args.local) args['no-mcp'] = true;
const MODE = args._[0] === 'uninstall' ? 'uninstall' : 'install';
const HOME = homedir();
const WIN = platform() === 'win32';
const MAC = platform() === 'darwin';
const URL_ = typeof args.url === 'string' ? args.url : 'https://trueinterview.io/api/mcp';
const SERVER = 'trueinterview';
const PACK_HOME = join(HOME, '.job-agent');
const WORKSPACE = process.env.JOB_AGENT_HOME || join(HOME, 'job-agent');
const DRY = Boolean(args['dry-run']);
const SKILLS = readdirSync(join(PKG_ROOT, 'skills')).filter((d) => existsSync(join(PKG_ROOT, 'skills', d, 'SKILL.md')));
const APPDATA = process.env.APPDATA || join(HOME, 'AppData', 'Roaming');
const vscodeUser = WIN ? join(APPDATA, 'Code', 'User') : MAC ? join(HOME, 'Library', 'Application Support', 'Code', 'User') : join(HOME, '.config', 'Code', 'User');

const log = (s = '') => console.log(s);
const step = (s) => console.log(`  ${DRY ? '[dry-run] ' : ''}${s}`);

function which(cmd) {
  const r = spawnSync(WIN ? 'where' : 'sh', WIN ? [cmd] : ['-c', `command -v ${cmd}`], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() ? r.stdout.trim().split(/\r?\n/)[0] : null;
}

function run(cmd, cmdArgs, { interactive = false } = {}) {
  step(`$ ${cmd} ${cmdArgs.join(' ')}`);
  if (DRY) return { status: 0, stdout: '' };
  // npm-installed CLIs are .cmd shims on Windows, which need a shell. Our arguments are
  // fixed words and a URL, so nothing here needs quoting.
  const opts = { stdio: interactive ? 'inherit' : 'pipe', encoding: 'utf8' };
  return WIN ? spawnSync([cmd, ...cmdArgs].join(' '), { ...opts, shell: true }) : spawnSync(cmd, cmdArgs, opts);
}

// JSON config edit: back up, merge one entry, keep everything else.
function mergeJson(path, keyPath, name, entry) {
  let data = {};
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf8');
    try { data = raw.trim() ? JSON.parse(raw) : {}; } catch {
      step(`skip ${path}: it isn't plain JSON (comments?). Add this by hand under "${keyPath.join('.')}": ${JSON.stringify({ [name]: entry })}`);
      return false;
    }
  }
  let node = data;
  for (const k of keyPath) node = node[k] ??= {};
  if (JSON.stringify(node[name]) === JSON.stringify(entry)) { step(`ok   ${path} already has ${name}`); return true; }
  node[name] = entry;
  step(`write ${path}`);
  if (DRY) return true;
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path)) copyFileSync(path, `${path}.bak-job-agent`);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  return true;
}

function removeJson(path, keyPath, name) {
  if (!existsSync(path)) return;
  let data;
  try { data = JSON.parse(readFileSync(path, 'utf8')); } catch { return; }
  let node = data;
  for (const k of keyPath) { node = node?.[k]; }
  if (!node || !(name in node)) return;
  delete node[name];
  step(`edit ${path} (remove ${name})`);
  if (!DRY) { copyFileSync(path, `${path}.bak-job-agent`); writeFileSync(path, JSON.stringify(data, null, 2) + '\n'); }
}

// ---------- agents ----------
// skills: user-level skills folder. mcp: how to register. login: what signs in.
const AGENTS = {
  claude: {
    label: 'Claude Code',
    detect: () => which('claude') || existsSync(join(HOME, '.claude')),
    skills: join(HOME, '.claude', 'skills'),
    addMcp() {
      if (!which('claude')) { step('claude CLI not on PATH: run later `claude mcp add --scope user --transport http trueinterview ' + URL_ + '`'); return; }
      // A project-level .mcp.json in the current folder also answers `mcp get`; only a
      // user-level entry counts, since the skills are used from any folder.
      const has = run('claude', ['mcp', 'get', SERVER]);
      if (has.status === 0 && /Scope:\s*User/i.test(has.stdout ?? '') && !DRY) { step('ok   trueinterview already registered for your user'); return; }
      run('claude', ['mcp', 'add', '--scope', 'user', '--transport', 'http', SERVER, URL_]);
    },
    removeMcp() { if (which('claude')) run('claude', ['mcp', 'remove', '--scope', 'user', SERVER]); },
    login() { if (which('claude')) return run('claude', ['mcp', 'login', SERVER], { interactive: true }).status === 0; return false; },
    signIn: 'Run `claude mcp login trueinterview` (or /mcp inside Claude Code).',
  },
  codex: {
    label: 'Codex',
    detect: () => which('codex') || existsSync(join(HOME, '.codex')),
    skills: join(HOME, '.agents', 'skills'),
    addMcp() {
      const cfg = join(HOME, '.codex', 'config.toml');
      const text = existsSync(cfg) ? readFileSync(cfg, 'utf8') : '';
      if (/^\[mcp_servers\.trueinterview\]/m.test(text)) { step('ok   trueinterview already in ~/.codex/config.toml'); return; }
      if (which('codex')) { run('codex', ['mcp', 'add', SERVER, '--url', URL_]); return; }
      step(`append ${cfg}`);
      if (!DRY) { mkdirSync(dirname(cfg), { recursive: true }); writeFileSync(cfg, `${text}${text && !text.endsWith('\n') ? '\n' : ''}\n[mcp_servers.${SERVER}]\nurl = "${URL_}"\n`); }
    },
    removeMcp() { if (which('codex')) run('codex', ['mcp', 'remove', SERVER]); },
    login() { if (which('codex')) return run('codex', ['mcp', 'login', SERVER], { interactive: true }).status === 0; return false; },
    signIn: 'Run `codex mcp login trueinterview`.',
  },
  cursor: {
    label: 'Cursor',
    detect: () => existsSync(join(HOME, '.cursor')) || which('cursor'),
    skills: join(HOME, '.agents', 'skills'),
    addMcp: () => mergeJson(join(HOME, '.cursor', 'mcp.json'), ['mcpServers'], SERVER, { url: URL_ }),
    removeMcp: () => removeJson(join(HOME, '.cursor', 'mcp.json'), ['mcpServers'], SERVER),
    signIn: 'In Cursor: Settings → MCP → trueinterview → Connect.',
  },
  vscode: {
    label: 'VS Code (GitHub Copilot)',
    detect: () => existsSync(vscodeUser) || which('code'),
    skills: join(HOME, '.agents', 'skills'),
    addMcp: () => mergeJson(join(vscodeUser, 'mcp.json'), ['servers'], SERVER, { type: 'http', url: URL_ }),
    removeMcp: () => removeJson(join(vscodeUser, 'mcp.json'), ['servers'], SERVER),
    signIn: 'In VS Code: open Copilot Chat (Agent mode); allow the trueinterview sign-in when it asks.',
  },
  copilot: {
    label: 'GitHub Copilot CLI',
    detect: () => which('copilot') || existsSync(join(HOME, '.copilot')),
    skills: join(HOME, '.agents', 'skills'),
    addMcp: () => mergeJson(join(HOME, '.copilot', 'mcp-config.json'), ['mcpServers'], SERVER, { type: 'http', url: URL_, tools: ['*'] }),
    removeMcp: () => removeJson(join(HOME, '.copilot', 'mcp-config.json'), ['mcpServers'], SERVER),
    signIn: 'Start `copilot`; it asks you to sign in to trueinterview the first time.',
  },
  gemini: {
    label: 'Gemini CLI',
    detect: () => which('gemini') || existsSync(join(HOME, '.gemini')),
    skills: join(HOME, '.agents', 'skills'),
    addMcp: () => mergeJson(join(HOME, '.gemini', 'settings.json'), ['mcpServers'], SERVER, { httpUrl: URL_ }),
    removeMcp: () => removeJson(join(HOME, '.gemini', 'settings.json'), ['mcpServers'], SERVER),
    signIn: 'In Gemini CLI, type /mcp auth trueinterview.',
  },
  windsurf: {
    label: 'Windsurf',
    detect: () => existsSync(join(HOME, '.codeium', 'windsurf')),
    skills: join(HOME, '.agents', 'skills'),
    addMcp: () => mergeJson(join(HOME, '.codeium', 'windsurf', 'mcp_config.json'), ['mcpServers'], SERVER, { serverUrl: URL_ }),
    removeMcp: () => removeJson(join(HOME, '.codeium', 'windsurf', 'mcp_config.json'), ['mcpServers'], SERVER),
    signIn: 'In Windsurf: Cascade → MCP servers → trueinterview → sign in.',
  },
  opencode: {
    label: 'OpenCode',
    detect: () => which('opencode') || existsSync(join(HOME, '.config', 'opencode')),
    skills: join(HOME, '.config', 'opencode', 'skills'),
    addMcp() {
      if (which('opencode')) { run('opencode', ['mcp', 'add', SERVER, '--url', URL_, '--global']); return; }
      const dir = join(HOME, '.config', 'opencode');
      if (existsSync(join(dir, 'opencode.jsonc'))) { step(`add to ${join(dir, 'opencode.jsonc')} by hand: "mcp": { "${SERVER}": { "type": "remote", "url": "${URL_}" } }`); return; }
      mergeJson(join(dir, 'opencode.json'), ['mcp'], SERVER, { type: 'remote', url: URL_, enabled: true });
    },
    login() { if (which('opencode')) return run('opencode', ['mcp', 'auth', SERVER], { interactive: true }).status === 0; return false; },
    removeMcp: () => removeJson(join(HOME, '.config', 'opencode', 'opencode.json'), ['mcp'], SERVER),
    signIn: 'Run `opencode mcp auth trueinterview`.',
  },
};

function copyPack() {
  if (PKG_ROOT === PACK_HOME) return;
  step(`copy job-agent → ${PACK_HOME}`);
  if (DRY) return;
  for (const d of ['bin', 'scripts', 'templates', 'examples', 'docs', 'skills', 'assets']) {
    rmSync(join(PACK_HOME, d), { recursive: true, force: true });
    cpSync(join(PKG_ROOT, d), join(PACK_HOME, d), { recursive: true });
  }
  for (const f of ['AGENTS.md', 'LICENSE', 'package.json']) copyFileSync(join(PKG_ROOT, f), join(PACK_HOME, f));
  // `job-agent agent` reads the agent registry.
  mkdirSync(join(PACK_HOME, 'distribution'), { recursive: true });
  copyFileSync(join(PKG_ROOT, 'distribution', 'agents.json'), join(PACK_HOME, 'distribution', 'agents.json'));
}

const doneDirs = new Set();
function installSkills(dir) {
  if (doneDirs.has(dir)) { step(`skills already in ${dir}`); return; }
  doneDirs.add(dir);
  for (const s of SKILLS) {
    step(`skill ${join(dir, s)}`);
    if (DRY) continue;
    rmSync(join(dir, s), { recursive: true, force: true });
    cpSync(join(PKG_ROOT, 'skills', s), join(dir, s), { recursive: true });
  }
}

function removeSkills(dir) {
  for (const s of SKILLS) {
    if (!existsSync(join(dir, s))) continue;
    step(`remove ${join(dir, s)}`);
    if (!DRY) rmSync(join(dir, s), { recursive: true, force: true });
  }
}

function openBrowser(url) {
  step(`open ${url}`);
  if (DRY) return;
  const [cmd, a] = WIN ? ['cmd', ['/c', 'start', '', url]] : MAC ? ['open', [url]] : ['xdg-open', [url]];
  spawnSync(cmd, a, { stdio: 'ignore' });
}

async function chooseAgents() {
  const all = Object.keys(AGENTS);
  if (typeof args.agents === 'string') {
    const want = args.agents.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = want.filter((w) => !AGENTS[w]);
    if (bad.length) { console.error(`Unknown agent(s): ${bad.join(', ')}. Known: ${all.join(', ')}`); process.exit(1); }
    return want;
  }
  const found = all.filter((k) => AGENTS[k].detect());
  if (!found.length) {
    log('No supported agent found. Install one (Claude Code, Codex, Cursor, VS Code, Copilot CLI, Gemini CLI, Windsurf, OpenCode) and run this again,');
    log('or pick explicitly: --agents claude,codex');
    process.exit(1);
  }
  log(`Found: ${found.map((k) => AGENTS[k].label).join(', ')}`);
  // No questions: every agent found gets everything. --agents narrows it.
  return found;
}

// ---------- main ----------
log(`job-agent ${MODE}${DRY ? ' (dry run: nothing is changed)' : ''}\n`);
const chosen = await chooseAgents();

if (MODE === 'uninstall') {
  for (const k of chosen) {
    log(`\n${AGENTS[k].label}`);
    removeSkills(AGENTS[k].skills);
    if (!args['keep-mcp']) AGENTS[k].removeMcp();
  }
  log(`\nRemoved. Your workspace (${WORKSPACE}) and ${PACK_HOME} are left in place; delete them yourself if you want them gone.`);
  process.exit(0);
}

log('\nPack and workspace');
copyPack();
if (!DRY) spawnSync(process.execPath, [join(PKG_ROOT, 'scripts', 'setup.mjs')], { stdio: 'ignore', env: { ...process.env, JOB_AGENT_HOME: WORKSPACE } });
step(`workspace ${WORKSPACE} (your files; existing ones are kept)`);

const left = [];
for (const k of chosen) {
  const a = AGENTS[k];
  log(`\n${a.label}`);
  installSkills(a.skills);
  if (args['no-mcp']) continue;
  a.addMcp();
  if (!args['no-login'] && a.login && process.stdin.isTTY && !DRY) {
    log(`  Signing in to TrueInterview for ${a.label} (a browser window opens)…`);
    if (a.login()) { step('signed in'); continue; }
  }
  left.push(`${a.label}: ${a.signIn}`);
}

if (!args['no-mcp'] && !args['no-login'] && left.length) {
  log('\nTrueInterview account');
  const opened = process.stdin.isTTY && !DRY;
  if (opened) openBrowser('https://trueinterview.io/connect');
  step(`Sign in (or create a free account) ${opened ? 'in the page that just opened' : 'at https://trueinterview.io/connect'}. Each agent's sign-in prompt is then one click.`);
}

log('\nDone.');
if (left.length && !args['no-mcp']) {
  log('\nFinish connecting TrueInterview (one step each; the agent also prompts you on first use):');
  for (const l of left) log(`  • ${l}`);
}
const first = ['claude', 'codex', 'gemini', 'copilot', 'opencode'].find((k) => chosen.includes(k));
log(`\nNext: ${first ? `run   ${first} "set me up"   (or open any of your agents and say "set me up")` : 'open your agent and say "set me up"'}.`);
log(args['no-mcp']
  ? 'It builds your profile from your résumé in your local workspace.'
  : 'It signs you in if needed, then saves your résumé and application preferences to your TrueInterview account.');
log(`Your files: ${WORKSPACE}    Remove everything: npx -y github:kevin-2023-code/job-agent uninstall`);
