#!/usr/bin/env node
// The application tracker (data/applications.tsv).
//   list [--status s] [--company c]
//   find <text>
//   add --company C --role R [--url U] [--status s] [--grade G] [--report path] [--next text] [--next-date d] [--notes text]
//   set <id> [--status s] [--grade G] [--url U] [--report path] [--next text] [--next-date d] [--date d]
//   note <id> <text>
//   due
//   stats [--json]

import { parseArgs, parseDate, today } from './lib/paths.mjs';
import { readTracker, writeTracker, nextId, findRows, stats, STATUSES } from './lib/tracker.mjs';

const [cmd = 'list', ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const rows = readTracker();

function checkStatus(s) {
  if (s && !STATUSES.includes(s)) {
    console.error(`Unknown status "${s}". One of: ${STATUSES.join(', ')}`);
    process.exit(1);
  }
}

function show(list) {
  if (!list.length) { console.log('(none)'); return; }
  for (const r of list) {
    const next = r.next ? `  → ${r.next}${r.next_date ? ` (${r.next_date})` : ''}` : '';
    console.log(`#${r.id.padEnd(4)} ${r.date}  ${r.status.padEnd(10)} ${(r.grade || '-').padEnd(2)} ${r.company} — ${r.role}${next}`);
  }
}

function getRow(id) {
  const row = rows.find((r) => r.id === String(id));
  if (!row) { console.error(`No row #${id}. Try: node scripts/track.mjs find <text>`); process.exit(1); }
  return row;
}

function apply(row) {
  if (args.status) { checkStatus(args.status); row.status = args.status; }
  if (args.grade) row.grade = String(args.grade).toUpperCase();
  if (args.url) row.url = args.url;
  if (args.report) row.report = args.report;
  if (args.next !== undefined) row.next = args.next === true ? '' : args.next;
  if (args['next-date'] !== undefined) row.next_date = args['next-date'] === true ? '' : parseDate(args['next-date']);
  if (args.date) row.date = parseDate(args.date);
  if (args.notes) row.notes = row.notes ? `${row.notes} | ${args.notes}` : args.notes;
}

switch (cmd) {
  case 'list': {
    let list = rows;
    if (args.status) list = list.filter((r) => r.status === args.status);
    if (args.company) list = list.filter((r) => r.company.toLowerCase().includes(String(args.company).toLowerCase()));
    show(list);
    break;
  }
  case 'find': {
    const text = args._.join(' ');
    if (!text) { console.error('find <text>'); process.exit(1); }
    show(findRows(rows, text));
    break;
  }
  case 'add': {
    if (!args.company || !args.role) { console.error('add needs --company and --role'); process.exit(1); }
    const dup = rows.find((r) => (args.url && r.url === args.url) ||
      (r.company.toLowerCase() === String(args.company).toLowerCase() && r.role.toLowerCase() === String(args.role).toLowerCase()));
    if (dup && !args.force) {
      console.error(`Already tracked as #${dup.id} (${dup.status}). Use \`set ${dup.id}\` to update, or --force to add anyway.`);
      process.exit(2);
    }
    const row = { id: nextId(rows), date: today(), company: args.company, role: args.role, status: 'evaluated' };
    apply(row);
    rows.push(row);
    writeTracker(rows);
    console.log(`Added #${row.id}`);
    show([row]);
    break;
  }
  case 'set': {
    const row = getRow(args._[0]);
    apply(row);
    writeTracker(rows);
    show([row]);
    break;
  }
  case 'note': {
    const row = getRow(args._[0]);
    const text = args._.slice(1).join(' ');
    if (!text) { console.error('note <id> <text>'); process.exit(1); }
    row.notes = row.notes ? `${row.notes} | ${today()}: ${text}` : `${today()}: ${text}`;
    writeTracker(rows);
    console.log(`Noted on #${row.id}`);
    break;
  }
  case 'due': {
    const t = today();
    const closed = ['rejected', 'withdrawn', 'skipped', 'offer'];
    show(rows.filter((r) => r.next_date && r.next_date <= t && !closed.includes(r.status))
      .sort((a, b) => a.next_date.localeCompare(b.next_date)));
    break;
  }
  case 'stats': {
    const s = stats(rows);
    if (args.json) { console.log(JSON.stringify(s, null, 2)); break; }
    const pct = (x) => `${Math.round(x * 100)}%`;
    console.log(`Tracked: ${s.total}   Applied: ${s.applied}   Reply rate: ${pct(s.reply_rate)}   Reached screen+: ${pct(s.advance_rate)}`);
    console.log('By status: ' + Object.entries(s.by_status).map(([k, v]) => `${k} ${v}`).join(', '));
    const g = Object.entries(s.by_grade).sort();
    if (g.length) console.log('By grade (applied → screen+): ' + g.map(([k, v]) => `${k} ${v.applied}→${v.advanced}`).join(', '));
    if (s.applied < 15) console.log('(Fewer than 15 applications: too few to read patterns from.)');
    break;
  }
  default:
    console.error(`Unknown command "${cmd}". Commands: list, find, add, set, note, due, stats`);
    process.exit(1);
}
