#!/usr/bin/env node
// The local to-apply list (data/apply-list.tsv).
//   list [--all]                          open rows (--all: done and skipped too)
//   add --company C --role R [--url U] [--by candidate|agent] [--note text]
//   approve <id> | approve --all          approve an agent pick (or every waiting pick)
//   done <id>                             applied: leaves the list (log it with `track` too)
//   skip <id> --kind K [--note text]      couldn't apply; K: sign_in, not_a_fit, required_question, closed, other
//   back <id>                             put a skipped row back on the list
//   remove <id>

import { parseArgs, today } from './lib/paths.mjs';
import { readList, writeList, addRow, setSkip, putBack, waiting, ready, SKIP_KINDS, WAITING_MAX } from './lib/apply-list.mjs';

const [cmd = 'list', ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const rows = readList();
const fail = (msg) => { console.error(msg); process.exit(1); };

function show(list) {
  if (!list.length) { console.log('(none)'); return; }
  for (const r of list) {
    const tag = r.state === 'skipped' ? `skipped: ${r.kind}${r.reason ? ` (${r.reason})` : ''}`
      : r.state === 'done' ? 'done'
      : r.approved === 'yes' ? 'ready' : 'waiting for approval';
    const by = r.added_by === 'agent' ? ' [agent pick]' : '';
    console.log(`#${r.id.padEnd(4)} ${r.company} — ${r.role}${by}  · ${tag}${r.note ? `\n       ${r.note}` : ''}`);
  }
}

function getRow(id) {
  const row = rows.find((r) => r.id === String(id));
  if (!row) fail(`No row #${id}. Try: job-agent list --all`);
  return row;
}

try {
  switch (cmd) {
    case 'list': {
      const list = args.all ? rows : rows.filter((r) => r.state === 'open');
      show(list);
      console.log(`\n${ready(rows).length} ready · ${waiting(rows).length}/${WAITING_MAX} picks waiting for approval`);
      break;
    }
    case 'add': {
      const { row, added } = addRow(rows, { company: args.company, role: args.role, url: args.url || '', by: args.by || 'candidate', note: typeof args.note === 'string' ? args.note : '', date: today() });
      if (added) writeList(rows);
      console.log(added ? `Added #${row.id}` : `Already on the list as #${row.id}`);
      show([row]);
      break;
    }
    case 'approve': {
      const list = args.all ? waiting(rows) : [getRow(args._[0])];
      for (const r of list) r.approved = 'yes';
      writeList(rows);
      console.log(`Approved ${list.length}`);
      break;
    }
    case 'done': {
      const row = getRow(args._[0]);
      row.state = 'done';
      writeList(rows);
      console.log(`#${row.id} done`);
      break;
    }
    case 'skip': {
      const row = getRow(args._[0]);
      if (typeof args.kind !== 'string') fail(`skip <id> --kind <${SKIP_KINDS.join('|')}> [--note text]`);
      setSkip(row, args.kind, typeof args.note === 'string' ? args.note : '');
      writeList(rows);
      show([row]);
      break;
    }
    case 'back': {
      const row = getRow(args._[0]);
      putBack(row);
      writeList(rows);
      show([row]);
      break;
    }
    case 'remove': {
      const row = getRow(args._[0]);
      rows.splice(rows.indexOf(row), 1);
      writeList(rows);
      console.log(`Removed #${row.id}`);
      break;
    }
    default:
      fail(`Unknown command "${cmd}". Commands: list, add, approve, done, skip, back, remove`);
  }
} catch (e) {
  fail(e.message);
}
