import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { matchesFilters } from '../scripts/lib/boards.mjs';
import { readTracker, writeTracker, nextId, findRows, stats } from '../scripts/lib/tracker.mjs';
import { renderMarkdown } from '../scripts/lib/markdown.mjs';
import { parseDate } from '../scripts/lib/paths.mjs';

const job = (o) => ({ id: 'x', company: 'Co', title: 'Senior Software Engineer', location: 'New York, NY', url: 'u', posted: '2026-11-20', remote: false, salary: '', ...o });
const now = new Date('2026-11-26');

test('title include/exclude', () => {
  const f = { title_include: ['software engineer'], title_exclude: ['intern', 'manager'] };
  assert.equal(matchesFilters(job(), f, now), true);
  assert.equal(matchesFilters(job({ title: 'Software Engineer Intern' }), f, now), false);
  assert.equal(matchesFilters(job({ title: 'Engineering Manager' }), f, now), false);
  // word boundary: "intern" must not drop "internal"
  assert.equal(matchesFilters(job({ title: 'Software Engineer, Internal Tools' }), f, now), true);
});

test('location and remote', () => {
  const f = { locations: ['remote', 'seattle'] };
  assert.equal(matchesFilters(job(), f, now), false);
  assert.equal(matchesFilters(job({ remote: true }), f, now), true);
  assert.equal(matchesFilters(job({ location: 'Seattle, WA' }), f, now), true);
});

test('max age', () => {
  assert.equal(matchesFilters(job({ posted: '2026-09-01' }), { max_age_days: 30 }, now), false);
  assert.equal(matchesFilters(job({ posted: '' }), { max_age_days: 30 }, now), true);
});

test('tracker round trip strips tabs and newlines', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'ja-')), 'a.tsv');
  writeTracker([{ id: '1', company: 'A\tB', role: 'Eng\nII', status: 'applied', grade: 'B' }], file);
  const rows = readTracker(file);
  assert.equal(rows[0].company, 'A B');
  assert.equal(rows[0].role, 'Eng II');
  assert.equal(nextId(rows), '2');
  assert.equal(findRows(rows, 'a b').length, 1);
  assert.match(readFileSync(file, 'utf8'), /^id\tdate\tcompany/);
});

test('stats', () => {
  const s = stats([
    { status: 'applied', grade: 'B' }, { status: 'screen', grade: 'A' },
    { status: 'rejected', grade: 'C' }, { status: 'evaluated', grade: 'D' },
  ]);
  assert.equal(s.applied, 3);
  assert.equal(s.by_grade.A.advanced, 1);
  assert.ok(Math.abs(s.reply_rate - 2 / 3) < 1e-9);
});

test('markdown renderer', () => {
  const html = renderMarkdown('# Name\n\nA **bold** [link](https://x.y)\n\n- one\n- two <!-- hidden -->\n');
  assert.match(html, /<h1>Name<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<a href="https:\/\/x.y">link<\/a>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.doesNotMatch(html, /hidden/);
  assert.match(renderMarkdown('<script>'), /&lt;script&gt;/);
});

test('parseDate', () => {
  assert.equal(parseDate('2026-12-01'), '2026-12-01');
  assert.match(parseDate('+7d'), /^\d{4}-\d{2}-\d{2}$/);
  assert.throws(() => parseDate('next week'));
});

import { parseYaml } from '../scripts/lib/yaml-lite.mjs';
import { resolveWorkspace, PKG_ROOT } from '../scripts/lib/paths.mjs';
import { readFileSync as rf } from 'node:fs';

test('yaml-lite reads the example profile and portals', () => {
  const prof = parseYaml(rf(join(PKG_ROOT, 'examples', 'profile.example.yml'), 'utf8'));
  assert.equal(prof.name, 'Alex Chen');
  assert.deepEqual(prof.targets.roles.slice(0, 1), ['Senior Software Engineer']);
  assert.equal(prof.targets.min_grade, 'C');
  assert.deepEqual(prof.targets.industries, ['developer tools', 'AI infrastructure', 'fintech']);
  assert.equal(prof.compensation.base_min, 180000);
  assert.equal(prof.work_authorization.needs_sponsorship, true);
  assert.equal(prof.apply.fill_forms, true);
  assert.equal(prof.phone, '');
  assert.match(prof.targets.why, /^Want to own .* ships weekly\.$/);
  const portals = parseYaml(rf(join(PKG_ROOT, 'examples', 'portals.example.yml'), 'utf8'));
  assert.equal(portals.filters.max_age_days, 30);
  assert.ok(portals.filters.title_exclude.includes('intern'));
  assert.deepEqual(portals.companies[0], { name: 'Anthropic', ats: 'greenhouse', board: 'anthropic' });
});

test('yaml-lite: list of block maps, quotes, comments', () => {
  const y = parseYaml('a:\n  - name: x # c\n    n: 2\n  - name: "y: z"\n    n: 3\nb: \'it\'\'s\'\nc: [1, "two", {k: v}]\nd:\n- p\n- q\n');
  assert.deepEqual(y.a, [{ name: 'x', n: 2 }, { name: 'y: z', n: 3 }]);
  assert.equal(y.b, "it's");
  assert.deepEqual(y.c, [1, 'two', { k: 'v' }]);
  assert.deepEqual(y.d, ['p', 'q']);
});

test('workspace resolution', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ja-ws-'));
  assert.equal(resolveWorkspace({ JOB_AGENT_HOME: dir }, '/nowhere'), dir);
});

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

test('installer: file-based agents into a sandbox home, then uninstall', () => {
  const home = mkdtempSync(join(tmpdir(), 'ja-home-'));
  const env = { ...process.env, HOME: home, USERPROFILE: home, APPDATA: join(home, 'AppData'), JOB_AGENT_HOME: '' };
  delete env.JOB_AGENT_HOME;
  const bin = join(PKG_ROOT, 'bin', 'job-agent.mjs');
  const r = spawnSync(process.execPath, [bin, 'install', '--agents', 'cursor,gemini,windsurf,copilot', '--yes'], { env, encoding: 'utf8', input: '' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(home, '.agents', 'skills', 'job-apply', 'SKILL.md')));
  assert.ok(existsSync(join(home, '.job-agent', 'bin', 'job-agent.mjs')));
  const listed = spawnSync(process.execPath, [join(home, '.job-agent', 'bin', 'job-agent.mjs'), 'agent', 'qwen', '--message'], { env, encoding: 'utf8' });
  assert.equal(listed.status, 0, listed.stderr);
  assert.ok(existsSync(join(home, 'job-agent', 'profile', 'profile.yml')));
  const cursor = JSON.parse(rf(join(home, '.cursor', 'mcp.json'), 'utf8'));
  assert.equal(cursor.mcpServers.trueinterview.url, 'https://trueinterview.io/api/mcp');
  const gemini = JSON.parse(rf(join(home, '.gemini', 'settings.json'), 'utf8'));
  assert.equal(gemini.mcpServers.trueinterview.httpUrl, 'https://trueinterview.io/api/mcp');
  const u = spawnSync(process.execPath, [bin, 'uninstall', '--agents', 'cursor,gemini,windsurf,copilot'], { env, encoding: 'utf8', input: '' });
  assert.equal(u.status, 0, u.stderr);
  assert.ok(!existsSync(join(home, '.agents', 'skills', 'job-apply')));
  assert.equal(JSON.parse(rf(join(home, '.cursor', 'mcp.json'), 'utf8')).mcpServers.trueinterview, undefined);
  assert.ok(existsSync(join(home, 'job-agent', 'profile', 'profile.yml')), 'workspace kept');
});

import { readList, writeList, addRow, setSkip, putBack, waiting, ready, WAITING_MAX } from '../scripts/lib/apply-list.mjs';
import { loadRegistry, setupMessage, packRunProcedure, agentDoc, keyConfigText } from '../scripts/lib/agents.mjs';

test('to-apply list: own adds are approved, agent picks wait, duplicates and the waiting cap', () => {
  const rows = [];
  const a = addRow(rows, { company: 'Stripe', role: 'Backend Engineer', url: 'u1', date: '2026-11-28' });
  assert.equal(a.row.approved, 'yes');
  const b = addRow(rows, { company: 'Ramp', role: 'Data Engineer', by: 'agent', note: 'same stack', date: '2026-11-28' });
  assert.equal(b.row.approved, 'no');
  assert.deepEqual(waiting(rows).map((r) => r.id), [b.row.id]);
  assert.deepEqual(ready(rows).map((r) => r.id), [a.row.id]);
  assert.equal(addRow(rows, { company: 'stripe', role: 'backend engineer', date: 'x' }).added, false);
  for (let i = waiting(rows).length; i < WAITING_MAX; i++) addRow(rows, { company: `Co${i}`, role: 'R', by: 'agent', date: 'x' });
  assert.throws(() => addRow(rows, { company: 'One', role: 'Too many', by: 'agent', date: 'x' }), /waiting/);
  addRow(rows, { company: 'Own', role: 'Still fine', date: 'x' });
  setSkip(a.row, 'sign_in', 'needs an account');
  assert.equal(ready(rows).some((r) => r.id === a.row.id), false);
  assert.throws(() => setSkip(a.row, 'bored'), /kind/);
  putBack(a.row);
  assert.equal(a.row.state, 'open');
  const file = join(mkdtempSync(join(tmpdir(), 'ja-list-')), 'apply-list.tsv');
  writeList(rows, file);
  assert.equal(readList(file).length, rows.length);
});

test('agents: every agent has a page; chat agents get a self-contained skill pack', () => {
  const reg = loadRegistry();
  const ids = reg.agents.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['claude-code', 'codex', 'cursor', 'gemini', 'opencode', 'muse', 'qwen', 'manus', 'grok', 'workbuddy', 'other']) assert.ok(ids.includes(id), id);
  const proc = packRunProcedure();
  assert.match(proc, /get_shortlist/);
  assert.doesNotMatch(proc, /job-agent (list|scan|track)|portals\.yml|`job-apply`/);
  for (const a of reg.agents) {
    const doc = agentDoc(a, reg);
    assert.match(doc, new RegExp(`job-agent with ${a.label.replace(/[()]/g, '.')}`));
    if (a.skills === 'message') {
      const msg = setupMessage(a, { time: '8:15am' });
      assert.match(msg, /## Rules/);
      assert.match(msg, /### 8\. Summary/);
      assert.ok(!/Bearer/.test(msg), `${a.id}: the message must not carry a key`);
      if (a.schedule === 'daily') assert.match(msg, /every day at 8:15am/);
    }
    const cfg = keyConfigText(a);
    if (cfg) assert.match(cfg, /<your TrueInterview key>/);
  }
});

test('agent CLI: message only for agents without a skills folder', () => {
  const bin = join(PKG_ROOT, 'bin', 'job-agent.mjs');
  const ok = spawnSync(process.execPath, [bin, 'agent', 'muse', '--message', '--time', '7:00am'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /every day at 7:00am Pacific Time/);
  const no = spawnSync(process.execPath, [bin, 'agent', 'claude-code', '--message'], { encoding: 'utf8' });
  assert.equal(no.status, 1);
  const bad = spawnSync(process.execPath, [bin, 'agent', 'nope'], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
});
