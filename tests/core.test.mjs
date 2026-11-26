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
