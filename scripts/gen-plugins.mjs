#!/usr/bin/env node
// Maintainers only. Builds one self-contained plugin per agent under plugins/, plus each
// agent's marketplace file at the repository root, from one source:
//   AGENTS.md          → skills/job-agent/SKILL.md (the overview skill every plugin loads)
//   skills/, bin/, scripts/, templates/, examples/, docs/, LICENSE → copied into each plugin
//   distribution/plugin.source.json → manifests and marketplace entries
//   distribution/agents.json + AGENTS.md + skills/job-run → agents/<id>.md, agents/README.md
//     (per-agent steps, and the setup message that carries the skill pack to chat agents)
//
//   node scripts/gen-plugins.mjs           write everything
//   node scripts/gen-plugins.mjs --check   exit 1 if anything on disk differs (CI)

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRegistry, agentDoc, agentsIndex } from './lib/agents.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HARNESSES = ['claude', 'codex', 'cursor', 'copilot'];
const COPY_DIRS = ['skills', 'bin', 'scripts', 'templates', 'examples', 'docs', 'assets'];
const SKIP = new Set(['scripts/gen-plugins.mjs']);

const src = JSON.parse(readFileSync(join(ROOT, 'distribution', 'plugin.source.json'), 'utf8'));
const posix = (p) => p.split(sep).join('/');
const json = (v) => JSON.stringify(v, null, 2) + '\n';

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out.sort();
}

// The overview skill: AGENTS.md with skill frontmatter.
function overviewSkill() {
  const body = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8').replace(/^# job-agent\n/, '# job-agent: how to work\n');
  return `---\nname: job-agent\ndescription: ${JSON.stringify(src.overviewDescription)}\n---\n\n<!-- Generated from AGENTS.md by scripts/gen-plugins.mjs. Edit AGENTS.md instead. -->\n\n${body}`;
}

function base() {
  return {
    name: src.name,
    version: src.version,
    description: src.description,
    author: src.author,
    homepage: src.homepage,
    repository: src.repository,
    license: 'MIT',
    keywords: src.keywords,
  };
}

function manifests(h) {
  const url = src.mcp.url;
  const server = src.mcp.serverName;
  switch (h) {
    case 'claude':
      return {
        // The Claude directory accepts only Markdown, JSON, YAML and images from
        // unverified publishers, so this plugin carries no scripts (skills run
        // them through npx) and declares the MCP server inline.
        '.claude-plugin/plugin.json': {
          $schema: 'https://json.schemastore.org/claude-code-plugin-manifest.json',
          ...base(),
          icon: './assets/logo.png',
          documentationUrl: src.homepage,
          supportUrl: src.urls.support,
          privacyPolicyUrl: src.urls.privacyPolicy,
          termsOfServiceUrl: src.urls.termsOfService,
          mcpServers: { [server]: { type: 'http', url } },
        },
      };
    case 'codex':
      return {
        '.codex-plugin/plugin.json': {
          ...base(),
          skills: './skills/',
          mcpServers: './.mcp.json',
          interface: {
            displayName: src.displayName,
            shortDescription: src.shortDescription,
            longDescription: src.description,
            developerName: src.author.name,
            category: 'Productivity',
            capabilities: ['Read', 'Write'],
            websiteURL: src.homepage,
            supportURL: src.urls.support,
            privacyPolicyURL: src.urls.privacyPolicy,
            termsOfServiceURL: src.urls.termsOfService,
            defaultPrompt: src.defaultPrompts,
            composerIcon: './assets/logo.svg',
            logo: './assets/logo.png',
          },
        },
        '.mcp.json': { mcpServers: { [server]: { type: 'http', url } } },
      };
    case 'cursor':
      return {
        '.cursor-plugin/plugin.json': { ...base(), logo: 'assets/logo.svg' },
        'mcp.json': { mcpServers: { [server]: { url } } },
      };
    case 'copilot':
      return {
        'plugin.json': { $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json', ...base() },
        'mcp.json': { $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json', mcpServers: { [server]: { type: 'streamable-http', url } } },
      };
  }
}

function rootFiles() {
  const owner = src.author;
  const entry = (h) => ({ name: src.name, source: `./plugins/${h}`, description: src.description, version: src.version });
  return {
    '.claude-plugin/marketplace.json': {
      $schema: 'https://json.schemastore.org/claude-code-marketplace.json',
      name: src.marketplaceName,
      description: src.description,
      owner,
      plugins: [{ ...entry('claude'), category: 'productivity' }],
    },
    '.agents/plugins/marketplace.json': {
      name: src.marketplaceName,
      interface: { displayName: src.displayName },
      plugins: [{
        name: src.name,
        source: { source: 'local', path: './plugins/codex' },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: 'Productivity',
      }],
    },
    '.cursor-plugin/marketplace.json': {
      name: src.marketplaceName,
      owner,
      metadata: { description: src.description, version: src.version },
      plugins: [{ ...entry('cursor'), category: 'productivity' }],
    },
    '.github/plugin/marketplace.json': {
      name: src.marketplaceName,
      owner,
      metadata: { description: src.description, version: src.version },
      plugins: [entry('copilot')],
    },
    // Gemini CLI installs the repository itself as an extension.
    'gemini-extension.json': {
      name: src.name,
      version: src.version,
      description: src.description,
      contextFileName: 'AGENTS.md',
      mcpServers: { [src.mcp.serverName]: { httpUrl: src.mcp.url } },
    },
  };
}

// The Claude directory refuses a plugin whose text tells Claude or the user to add an MCP
// server the plugin doesn't declare, and the publisher attests that the plugin runs no
// code outside its declared MCP servers. So the Claude build ships no scripts and its
// text runs none: no installer, no local Node scripts, no browser-MCP setup notes, and
// sign-in only for the one server it declares. Each entry is [from, to]; `from` is a
// string or a RegExp, and must match.
const CLAUDE_SCRIPTS_SECTION = `## Scripts

This build of the plugin ships no code and runs none. Where a skill says \`job-agent <command>\`, do that step with your own tools instead:

- \`where\` / \`init\`: the workspace is the current folder if it holds \`profile/\`, else \`~/job-agent\`; create \`profile/\`, \`knowledge/\`, \`data/\`, \`reports/\` and \`output/\` there when they're missing.
- \`scan\`: fetch the public job-board API of each company in \`portals.yml\` (Greenhouse \`https://boards-api.greenhouse.io/v1/boards/<board>/jobs\`, Lever \`https://api.lever.co/v0/postings/<board>?mode=json\`, Ashby \`https://api.ashbyhq.com/posting-api/job-board/<board>\`), keep the postings that match its filters and that \`data/applications.tsv\` doesn't already hold, and list them.
- \`track\`: keep \`data/applications.tsv\` as a tab-separated table with the columns id, date, company, role, status, grade, url, report, next, next_date, notes.
- \`kb\`: search \`knowledge/\` and \`profile/\` with your own search tools.
- \`pdf\`: write the résumé or letter as Markdown in \`output/\` and tell the candidate to print it to PDF from their browser.
- \`changed\`: compare \`profile/cv.md\` and \`profile/profile.yml\` with what the account already holds.
- \`list\`: keep \`data/apply-list.tsv\` as a tab-separated table with the columns id, added, company, role, url, added_by, note, approved, state, kind, reason; connected, use \`get_shortlist\` and \`update_shortlist\` instead.
- \`agent\`: the steps per agent are at https://github.com/kevin-2023-code/job-agent/tree/main/agents.
`;

const CLAUDE_REWRITES = {
  'skills/job-agent/SKILL.md': [
    [/## Running the scripts\n\n[^\n]*\n/, CLAUDE_SCRIPTS_SECTION],
    [
      '- The tool isn\'t there at all → local mode, and offer the one-line install (`npx -y github:kevin-2023-code/job-agent install`) once.',
      "- The tool isn't there at all → local mode.",
    ],
    [
      "tell the candidate the one step for their agent (Claude Code: run `claude mcp login trueinterview` or type `/mcp` and pick trueinterview; Codex: `codex mcp login trueinterview`; Gemini CLI: `/mcp auth trueinterview`; OpenCode: `opencode mcp auth trueinterview`; Cursor / VS Code / Windsurf: the sign-in prompt, or the MCP panel → trueinterview → Connect)",
      'tell the candidate the one step (in Claude Code, type `/mcp` and pick trueinterview; in the Claude apps, connect TrueInterview under Settings → Connectors)',
    ],
  ],
  'skills/job-apply/SKILL.md': [
    [
      "Filling needs a browser tool: Claude in Chrome, a built-in browser, Cursor's browser, Chrome DevTools MCP or Playwright MCP. A browser where the candidate is already signed in to job sites is best. If you have none, offer to add one (`docs/browser.md` has a one-line command per agent) and, meanwhile, hand over the answer sheet from step 4 for them to paste.",
      'Filling needs a browser tool you already have, such as Claude in Chrome or a built-in browser. A browser where the candidate is already signed in to job sites is best. If you have none, hand over the answer sheet from step 4 for them to paste.',
    ],
  ],
};

function claudeText(rel, content) {
  for (const [from, to] of CLAUDE_REWRITES[rel] ?? []) {
    const found = from instanceof RegExp ? from.test(content) : content.includes(from);
    if (!found) throw new Error(`claudeText: text to rewrite not found in ${rel}: ${String(from).slice(0, 60)}…`);
    content = content.replace(from, () => to);
  }
  return content;
}

function generate() {
  const files = new Map();
  files.set('skills/job-agent/SKILL.md', overviewSkill());
  const registry = loadRegistry(ROOT);
  files.set('agents/README.md', agentsIndex(registry));
  for (const a of registry.agents) files.set(`agents/${a.id}.md`, agentDoc(a, registry, { root: ROOT }));
  for (const [p, v] of Object.entries(rootFiles())) files.set(p, json(v));

  const shared = [];
  for (const d of COPY_DIRS) {
    for (const abs of walk(join(ROOT, d))) {
      const rel = posix(relative(ROOT, abs));
      if (SKIP.has(rel) || rel === 'skills/job-agent/SKILL.md') continue;
      shared.push([rel, rel.endsWith('.png') ? readFileSync(abs) : readFileSync(abs, 'utf8')]);
    }
  }
  shared.push(['skills/job-agent/SKILL.md', files.get('skills/job-agent/SKILL.md')]);
  shared.push(['LICENSE', readFileSync(join(ROOT, 'LICENSE'), 'utf8')]);
  shared.push(['distribution/agents.json', readFileSync(join(ROOT, 'distribution', 'agents.json'), 'utf8')]);
  const readme = readFileSync(join(ROOT, 'distribution', 'PLUGIN_README.md'), 'utf8');

  // Claude directory: no scripts, no HTML, no SVG other than the icon, no maintainer docs.
  const CLAUDE_SKIP = /^(bin|scripts|templates|examples)\/|^docs\/(publishing|browser|data-sources)\.md$|^assets\/logo\.svg$/;
  for (const h of HARNESSES) {
    for (const [rel, content] of shared) {
      if (h === 'claude' && CLAUDE_SKIP.test(rel)) continue;
      if (rel === 'docs/publishing.md') continue;
      files.set(`plugins/${h}/${rel}`, h === 'claude' ? claudeText(rel, content) : content);
    }
    for (const [p, v] of Object.entries(manifests(h))) files.set(`plugins/${h}/${p}`, json(v));
    files.set(`plugins/${h}/README.md`, readme.replaceAll('{{AGENT}}', src.labels[h]));
  }
  return files;
}

const files = generate();
const check = process.argv.includes('--check');
let drift = 0;

// Files under plugins/ and agents/ that are no longer generated.
const stale = ['plugins', 'agents'].flatMap((d) => existsSync(join(ROOT, d))
  ? walk(join(ROOT, d)).map((a) => posix(relative(ROOT, a))).filter((p) => !files.has(p))
  : []);

for (const [p, content] of files) {
  const abs = join(ROOT, p);
  const same = existsSync(abs) && (Buffer.isBuffer(content)
    ? readFileSync(abs).equals(content)
    : readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') === content.replace(/\r\n/g, '\n'));
  if (same) continue;
  drift++;
  if (check) { console.error(`differs: ${p}`); continue; }
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}
for (const p of stale) {
  drift++;
  if (check) console.error(`stale: ${p}`);
  else rmSync(join(ROOT, p));
}

if (check && drift) { console.error(`\n${drift} generated file(s) out of date: run node scripts/gen-plugins.mjs`); process.exit(1); }
console.log(check ? 'plugins up to date' : `${files.size} files generated, ${drift} changed`);
