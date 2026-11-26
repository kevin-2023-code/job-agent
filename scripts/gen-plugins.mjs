#!/usr/bin/env node
// Maintainers only. Builds one self-contained plugin per agent under plugins/, plus each
// agent's marketplace file at the repository root, from one source:
//   AGENTS.md          → skills/job-agent/SKILL.md (the overview skill every plugin loads)
//   skills/, bin/, scripts/, templates/, examples/, docs/, LICENSE → copied into each plugin
//   distribution/plugin.source.json → manifests and marketplace entries
//
//   node scripts/gen-plugins.mjs           write everything
//   node scripts/gen-plugins.mjs --check   exit 1 if anything on disk differs (CI)

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  return `---\nname: job-agent\ndescription: ${src.overviewDescription}\n---\n\n<!-- Generated from AGENTS.md by scripts/gen-plugins.mjs. Edit AGENTS.md instead. -->\n\n${body}`;
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

function generate() {
  const files = new Map();
  files.set('skills/job-agent/SKILL.md', overviewSkill());
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
  const readme = readFileSync(join(ROOT, 'distribution', 'PLUGIN_README.md'), 'utf8');

  // Claude directory: no scripts, no HTML, no SVG other than the icon, no maintainer docs.
  const CLAUDE_SKIP = /^(bin|scripts|templates|examples)\/|^docs\/publishing\.md$|^assets\/logo\.svg$/;
  for (const h of HARNESSES) {
    for (const [rel, content] of shared) {
      if (h === 'claude' && CLAUDE_SKIP.test(rel)) continue;
      if (rel === 'docs/publishing.md') continue;
      files.set(`plugins/${h}/${rel}`, content);
    }
    for (const [p, v] of Object.entries(manifests(h))) files.set(`plugins/${h}/${p}`, json(v));
    files.set(`plugins/${h}/README.md`, readme.replaceAll('{{AGENT}}', src.labels[h]));
  }
  return files;
}

const files = generate();
const check = process.argv.includes('--check');
let drift = 0;

// Files under plugins/ that are no longer generated.
const stale = existsSync(join(ROOT, 'plugins'))
  ? walk(join(ROOT, 'plugins')).map((a) => posix(relative(ROOT, a))).filter((p) => !files.has(p))
  : [];

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
