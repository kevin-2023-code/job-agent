#!/usr/bin/env node
// Scan the public job boards in portals.yml for new matching postings.
//   node scripts/scan.mjs [--company <name>] [--days <n>] [--all] [--json] [--dry-run]

import { readFileSync, writeFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PATHS, readYaml, parseArgs, today } from './lib/paths.mjs';
import { FETCHERS, matchesFilters } from './lib/boards.mjs';
import { readTracker } from './lib/tracker.mjs';

const args = parseArgs(process.argv.slice(2));
const portals = readYaml(PATHS.portals);
if (!portals) {
  console.error('No portals.yml. Run `job-agent init`, then edit portals.yml.');
  process.exit(1);
}

const filters = { ...(portals.filters ?? {}) };
if (args.days) filters.max_age_days = Number(args.days);

let companies = portals.companies ?? [];
if (typeof args.company === 'string') {
  const want = args.company.toLowerCase();
  companies = companies.filter((c) => c.name?.toLowerCase().includes(want) || c.board?.toLowerCase() === want);
  if (!companies.length) { console.error(`No company matching "${args.company}" in portals.yml`); process.exit(1); }
}

const seen = new Set(existsSync(PATHS.seen) ? JSON.parse(readFileSync(PATHS.seen, 'utf8')) : []);
const trackedUrls = new Set(readTracker().map((r) => r.url).filter(Boolean));

const results = [];
const errors = [];
const CONCURRENCY = 4;
let i = 0;
async function worker() {
  while (i < companies.length) {
    const c = companies[i++];
    const fetcher = FETCHERS[c.ats];
    if (!fetcher) { errors.push({ company: c.name, error: `unknown ats "${c.ats}"` }); continue; }
    try {
      const jobs = await fetcher(c);
      const matched = jobs.filter((j) => matchesFilters(j, filters));
      const fresh = matched.filter((j) => args.all || (!seen.has(j.id) && !trackedUrls.has(j.url)));
      results.push({ company: c.name, total: jobs.length, matched: matched.length, fresh });
    } catch (e) {
      errors.push({ company: c.name, error: e.status === 404 ? 'board not found (404): check the board name or ATS' : e.message });
    }
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, companies.length) }, worker));
results.sort((a, b) => a.company.localeCompare(b.company));

const fresh = results.flatMap((r) => r.fresh);

if (args.json) {
  console.log(JSON.stringify({ date: today(), results: results.map(({ fresh, ...r }) => ({ ...r, new: fresh.length })), new: fresh, errors }, null, 2));
} else {
  for (const r of results) console.log(`${r.company.padEnd(22)} ${String(r.total).padStart(5)} open  ${String(r.matched).padStart(4)} match  ${String(r.fresh.length).padStart(4)} new`);
  for (const e of errors) console.log(`${e.company.padEnd(22)} ERROR ${e.error}`);
  console.log(`\n${fresh.length} new posting(s)${args['dry-run'] ? ' (dry run, nothing written)' : fresh.length ? ` → ${PATHS.pipeline}` : ''}`);
}

if (!args['dry-run'] && fresh.length) {
  mkdirSync(dirname(PATHS.pipeline), { recursive: true });
  if (!existsSync(PATHS.pipeline)) {
    writeFileSync(PATHS.pipeline, '# Pipeline\n\nNew postings from `job-agent scan`, one block per scan, newest postings first. Triage with the job-evaluate skill.\n');
  }
  const lines = fresh
    .sort((a, b) => (b.posted || '').localeCompare(a.posted || ''))
    .map((j) => `- [ ] **${j.company}** — [${j.title}](${j.url}) · ${j.location || 'location n/a'}${j.posted ? ` · posted ${j.posted}` : ''}${j.salary ? ` · ${j.salary}` : ''}`);
  appendFileSync(PATHS.pipeline, `\n## Scan ${today()}\n\n${lines.join('\n')}\n`);
  for (const j of fresh) seen.add(j.id);
  writeFileSync(PATHS.seen, JSON.stringify([...seen]));
}
if (errors.length && !results.length) process.exit(1);
