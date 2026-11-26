import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PATHS } from './paths.mjs';

export const COLUMNS = ['id', 'date', 'company', 'role', 'status', 'grade', 'url', 'report', 'next', 'next_date', 'notes'];
export const STATUSES = ['evaluated', 'applied', 'screen', 'interview', 'offer', 'rejected', 'withdrawn', 'skipped', 'ghosted'];

const clean = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();

export function readTracker(file = PATHS.tracker) {
  if (!existsSync(file)) return [];
  const [header, ...lines] = readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  if (!header) return [];
  const cols = header.split('\t');
  return lines.map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(cols.map((c, i) => [c, cells[i] ?? '']));
  });
}

export function writeTracker(rows, file = PATHS.tracker) {
  mkdirSync(dirname(file), { recursive: true });
  const body = rows.map((r) => COLUMNS.map((c) => clean(r[c])).join('\t'));
  writeFileSync(file, [COLUMNS.join('\t'), ...body].join('\n') + '\n');
}

export function nextId(rows) {
  return String(rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1);
}

export function findRows(rows, text) {
  const t = text.toLowerCase();
  return rows.filter((r) => r.id === text || `${r.company} ${r.role} ${r.url}`.toLowerCase().includes(t));
}

export function stats(rows) {
  const by = (k) => rows.reduce((m, r) => ((m[r[k] || '-'] = (m[r[k] || '-'] ?? 0) + 1), m), {});
  const sent = rows.filter((r) => !['evaluated', 'skipped'].includes(r.status));
  const replied = sent.filter((r) => ['screen', 'interview', 'offer', 'rejected'].includes(r.status));
  const advanced = sent.filter((r) => ['screen', 'interview', 'offer'].includes(r.status));
  const byGrade = {};
  for (const r of sent) {
    const g = r.grade || '-';
    byGrade[g] ??= { applied: 0, advanced: 0 };
    byGrade[g].applied++;
    if (['screen', 'interview', 'offer'].includes(r.status)) byGrade[g].advanced++;
  }
  return {
    total: rows.length,
    by_status: by('status'),
    applied: sent.length,
    reply_rate: sent.length ? replied.length / sent.length : 0,
    advance_rate: sent.length ? advanced.length / sent.length : 0,
    by_grade: byGrade,
  };
}
