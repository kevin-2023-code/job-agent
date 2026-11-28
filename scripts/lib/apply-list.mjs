// The local to-apply list (data/apply-list.tsv): roles the candidate wants applied to, and
// the agent's picks waiting for their approval. Used in local mode, and connected when the
// server has no to-apply list yet.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PATHS } from './paths.mjs';

export const LIST_COLUMNS = ['id', 'added', 'company', 'role', 'url', 'added_by', 'note', 'approved', 'state', 'kind', 'reason'];
export const SKIP_KINDS = ['sign_in', 'not_a_fit', 'required_question', 'closed', 'other'];
export const WAITING_MAX = 40;

const clean = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();

export function readList(file = PATHS.applyList) {
  if (!existsSync(file)) return [];
  const [header, ...lines] = readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  if (!header) return [];
  const cols = header.split('\t');
  return lines.map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? '']));
  });
}

export function writeList(rows, file = PATHS.applyList) {
  mkdirSync(dirname(file), { recursive: true });
  const body = rows.map((r) => LIST_COLUMNS.map((c) => clean(r[c])).join('\t'));
  writeFileSync(file, [LIST_COLUMNS.join('\t'), ...body].join('\n') + '\n');
}

const nextId = (rows) => String(rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1);

// Picks the agent added that the candidate hasn't approved yet.
export const waiting = (rows) => rows.filter((r) => r.state === 'open' && r.added_by === 'agent' && r.approved !== 'yes');

// Rows the agent may apply to now: open and approved (the candidate's own adds are approved).
export const ready = (rows) => rows.filter((r) => r.state === 'open' && r.approved === 'yes');

export function addRow(rows, { company, role, url = '', by = 'candidate', note = '', date }) {
  if (!company || !role) throw new Error('add needs --company and --role');
  if (!['candidate', 'agent'].includes(by)) throw new Error('--by is candidate or agent');
  const dup = rows.find((r) => r.state === 'open' && ((url && r.url === url) || (r.company.toLowerCase() === company.toLowerCase() && r.role.toLowerCase() === role.toLowerCase())));
  if (dup) return { row: dup, added: false };
  if (by === 'agent' && waiting(rows).length >= WAITING_MAX) throw new Error(`${WAITING_MAX} picks are already waiting for approval`);
  const row = { id: nextId(rows), added: date, company, role, url, added_by: by, note, approved: by === 'candidate' ? 'yes' : 'no', state: 'open', kind: '', reason: '' };
  rows.push(row);
  return { row, added: true };
}

export function setSkip(row, kind, reason = '') {
  if (!SKIP_KINDS.includes(kind)) throw new Error(`--kind is one of: ${SKIP_KINDS.join(', ')}`);
  Object.assign(row, { state: 'skipped', kind, reason });
}

export function putBack(row) {
  Object.assign(row, { state: 'open', kind: '', reason: '' });
}
