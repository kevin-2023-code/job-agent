import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import YAML from 'yaml';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const p = (...parts) => join(ROOT, ...parts);

export const PATHS = {
  profile: p('profile', 'profile.yml'),
  cv: p('profile', 'cv.md'),
  stories: p('profile', 'stories.md'),
  portals: p('portals.yml'),
  tracker: p('data', 'applications.tsv'),
  pipeline: p('data', 'pipeline.md'),
  seen: p('data', 'seen.json'),
  knowledge: p('knowledge'),
  reports: p('reports'),
  output: p('output'),
};

export function readYaml(file) {
  if (!existsSync(file)) return null;
  return YAML.parse(readFileSync(file, 'utf8')) ?? {};
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

// "+7d" / "today" / "2026-12-01" -> yyyy-mm-dd
export function parseDate(s) {
  if (!s) return '';
  if (s === 'today') return today();
  const m = /^\+(\d+)d$/.exec(s);
  if (m) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + Number(m[1]));
    return d.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  throw new Error(`Not a date: ${s} (use yyyy-mm-dd, today or +Nd)`);
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}
