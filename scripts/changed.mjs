#!/usr/bin/env node
// Which local profile files changed since they were last uploaded to TrueInterview.
//   job-agent changed            list them, with the tool that uploads each
//   job-agent changed --mark     record the current state as uploaded (all files)
//   job-agent changed --mark cv  record one file (cv | profile)
//   job-agent changed --json

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PATHS, ws, parseArgs } from './lib/paths.mjs';

const STATE = ws('data', 'sync.json');
const FILES = {
  cv: { path: PATHS.cv, upload: 'import_resume (pass the whole file text)' },
  profile: { path: PATHS.profile, upload: 'update_job_search (targets, location_prefs, compensation), update_application_answers (work_authorization, saved_answers, apply, links), save_context_note (why, deal_breakers)' },
};
const EXAMPLE_MARKERS = ['Acme Analytics', 'name: Alex Chen'];

const args = parseArgs(process.argv.slice(2));
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

if (args.mark) {
  const which = typeof args.mark === 'string' ? [args.mark] : Object.keys(FILES);
  for (const k of which) {
    if (!FILES[k]) { console.error(`Unknown file "${k}" (cv | profile)`); process.exit(1); }
    if (existsSync(FILES[k].path)) state[k] = { hash: hash(FILES[k].path), at: new Date().toISOString() };
  }
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
  console.log(`Marked as uploaded: ${which.join(', ')}`);
  process.exit(0);
}

const out = [];
for (const [k, f] of Object.entries(FILES)) {
  if (!existsSync(f.path)) continue;
  const text = readFileSync(f.path, 'utf8');
  if (EXAMPLE_MARKERS.some((m) => text.includes(m))) continue; // still the example person
  if (state[k]?.hash !== hash(f.path)) out.push({ file: k, path: f.path, upload: f.upload, last: state[k]?.at ?? null });
}

if (args.json) console.log(JSON.stringify(out, null, 2));
else if (!out.length) console.log('Nothing to upload: TrueInterview has the latest of your local profile files.');
else {
  console.log('Changed since last upload to TrueInterview:');
  for (const o of out) console.log(`  ${o.path}${o.last ? ` (last upload ${o.last.slice(0, 10)})` : ' (never uploaded)'}\n    → ${o.upload}`);
  console.log('After uploading: job-agent changed --mark');
}
