import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { parseYaml } from './yaml-lite.mjs';

// Where job-agent itself is installed (a clone, a plugin cache, or an npx copy).
export const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const pkg = (...parts) => join(PKG_ROOT, ...parts);

const isWorkspace = (dir) => existsSync(join(dir, 'profile')) || existsSync(join(dir, 'portals.yml'));

// Where the candidate's files live. In order: $JOB_AGENT_HOME, the current folder if it
// already is a workspace, the job-agent folder itself if it is one (a clone), ~/job-agent.
export function resolveWorkspace(env = process.env, cwd = process.cwd()) {
  if (env.JOB_AGENT_HOME) return resolve(env.JOB_AGENT_HOME);
  if (isWorkspace(cwd)) return resolve(cwd);
  if (isWorkspace(PKG_ROOT)) return PKG_ROOT;
  return join(homedir(), 'job-agent');
}

export const WORKSPACE = resolveWorkspace();
export const ws = (...parts) => join(WORKSPACE, ...parts);

export const PATHS = {
  profile: ws('profile', 'profile.yml'),
  cv: ws('profile', 'cv.md'),
  stories: ws('profile', 'stories.md'),
  portals: ws('portals.yml'),
  tracker: ws('data', 'applications.tsv'),
  applyList: ws('data', 'apply-list.tsv'),
  resumes: ws('profile', 'resumes'),
  pipeline: ws('data', 'pipeline.md'),
  seen: ws('data', 'seen.json'),
  knowledge: ws('knowledge'),
  reports: ws('reports'),
  output: ws('output'),
};

export function readYaml(file) {
  if (!existsSync(file)) return null;
  return parseYaml(readFileSync(file, 'utf8')) ?? {};
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
