// The agent registry (distribution/agents.json) and what job-agent gives each agent:
// the connection, how the skills get in, and the setup message for agents that have no
// skills folder ("skill pack injection"). The message is built from AGENTS.md and
// skills/job-run/SKILL.md, so it always says what the skills say.
import { existsSync, readFileSync } from 'node:fs';
import { PKG_ROOT } from './paths.mjs';

export const MCP_URL = 'https://trueinterview.io/api/mcp';
// The key-only door to the same server: no OAuth discovery, so a client keeps the key header
// instead of starting a sign-in (TrueInterview MCP 1.30). Every key config points here.
export const KEY_MCP_URL = 'https://trueinterview.io/api/mcp/key';
export const KEY_PLACEHOLDER = '<your TrueInterview key>';

export function loadRegistry(root = PKG_ROOT) {
  return JSON.parse(readFileSync(`${root}/distribution/agents.json`, 'utf8'));
}

export function findAgent(registry, id) {
  return registry.agents.find((a) => a.id === id) ?? null;
}

const read = (rel, root) => readFileSync(`${root}/${rel}`, 'utf8').replace(/\r\n/g, '\n');
const stripFrontmatter = (s) => s.replace(/^---\n[\s\S]*?\n---\n+/, '');

// A chat or desktop agent has no shell and no workspace: it works connected only, so the
// pack drops local-mode fragments and names the server's tools instead. Each pair must
// match, so an edit to the skill that breaks the pack fails `npm test` instead of drifting.
const PACK_REWRITES = [
  [/^# Run the job search\n\n> [^\n]*\n\n/, ''],
  ['- **Connected:** `get_shortlist`.', '- `get_shortlist`.'],
  ['- **Connected, but `get_shortlist` isn\'t in your tool list** (an older server): use the defaults below and keep the list in `data/apply-list.tsv` (`job-agent list`).',
    "- **`get_shortlist` isn't in your tool list** (an older server): use the defaults below, and keep the to-apply list in this conversation's notes."],
  [/- \*\*Local:\*\* the `agent:` block[^\n]*\n/, ''],
  [/Connected: `get_resume` \(and a résumé list, if the server offers one\)\. Local: [^\n]*?\. With more than one/,
    '`get_resume` (and a résumé list, if the server offers one). With more than one'],
  [/- Connected: `recommend_jobs` \(([^\n]*?)\), and `job-agent scan` for companies in `portals\.yml`\.\n- Local: `job-agent scan`\.\n/,
    '- `recommend_jobs` ($1), and `search_jobs` for anything specific the candidate asked for.\n'],
  ['(`match_resume_to_job` / `screen_jobs`, or `docs/scoring.md` locally)', '(`match_resume_to_job` / `screen_jobs`)'],
  ['`update_shortlist` with `action: "add"` (connected) or `job-agent list add --by agent --note "…"`.',
    '`update_shortlist` with `action: "add"`.'],
  ['Follow `job-apply` for each role, with the résumé from step 2.',
    'For each role, `prepare_application` gives the apply link, the résumé file and every field with its answer and status; `draft_answers` drafts open questions. Fill the form on the company site with those answers and the résumé from step 2.'],
  [/`report_application` with `submitted: true` \(connected; ([^)]*)\), or `job-agent track add[^\n]*?locally\./,
    '`report_application` with `submitted: true` ($1).'],
  [/`update_shortlist` with `action: "could_not_apply"` and a note that starts with the kind \(connected; a role not on the list is put on it\), or locally [^\n]*?`job-agent list skip[^`]*`\./,
    '`update_shortlist` with `action: "could_not_apply"` and a note that starts with the kind (a role not on the list is put on it).'],
];

export function packRunProcedure(root = PKG_ROOT) {
  let body = stripFrontmatter(read('skills/job-run/SKILL.md', root));
  for (const [from, to] of PACK_REWRITES) {
    const found = from instanceof RegExp ? from.test(body) : body.includes(from);
    if (!found) throw new Error(`skill pack: text to rewrite not found in skills/job-run/SKILL.md: ${String(from).slice(0, 70)}…`);
    body = from instanceof RegExp ? body.replace(from, to) : body.replace(from, () => to);
  }
  if (/job-agent (list|scan|track|pdf|kb|init)\b|`job-apply`|portals\.yml/.test(body)) {
    throw new Error('skill pack: the run procedure still names a local command or skill a chat agent does not have');
  }
  return body.trim().replace(/^## /gm, '### ');
}

export function packRules(root = PKG_ROOT) {
  // A clone or the installed pack has AGENTS.md; a plugin has the same text as the overview skill.
  const agentsMd = existsSync(`${root}/AGENTS.md`) ? read('AGENTS.md', root) : read('skills/job-agent/SKILL.md', root);
  const m = /## Rules that don't bend\n\n([\s\S]*?)\n## /.exec(agentsMd);
  if (!m) throw new Error('skill pack: "Rules that don\'t bend" not found in AGENTS.md');
  return m[1].trim()
    .replace(/ \(see `job-run`\)/g, ' (see the run procedure)')
    .replace(/ \(see `job-apply`\)/g, '');
}

function connectionLines(agent, url) {
  const k = agent.keyConfig ?? {};
  if (k.format === 'secret') {
    return `Connect to the TrueInterview MCP server at ${url}. It takes my TrueInterview key as a bearer token in the Authorization header: ask me for it in your secure credential prompt, never in this chat, and never repeat it back. (If you can only connect with a sign-in, use ${MCP_URL} instead.)`;
  }
  return 'Use the TrueInterview connector I added for my jobs, résumé, applications and to-apply list.';
}

function scheduleLines(agent, time) {
  if (agent.schedule !== 'daily') return 'Run it when I ask.';
  return `Then make this a daily ${agent.scheduleName || 'scheduled task'}: every day at ${time} ${agent.zone}, run my job search with the procedure above. Run it once now so I can see it work.`;
}

// The one message a chat or desktop agent gets: connection, rules, run procedure, schedule.
export function setupMessage(agent, { time, url = KEY_MCP_URL, root = PKG_ROOT } = {}) {
  const at = time || agent.defaultTime || '9:30am';
  const parts = [
    'Set me up with job-agent, an open-source job-search assistant that works from my TrueInterview account.',
    connectionLines(agent, url),
  ];
  if (agent.cloudBrowser) {
    parts.push("When a company site needs me to sign in or verify (an account, a code, a CAPTCHA), ask me to take over your cloud browser, then carry on with that application. If I don't answer, leave it and list it in your summary as waiting on me.");
  } else if (agent.kind !== 'chat') {
    parts.push('Use your browser connector to apply on company sites.');
  }
  parts.push('Follow the rules and the run procedure below every time you work on my job search. My settings on TrueInterview (mode, who sends, minimum match score, applications per day) decide each run; read them fresh each time.');
  parts.push(`## Rules\n\n${packRules(root)}`);
  parts.push(`## Run procedure\n\n${packRunProcedure(root)}`);
  parts.push(scheduleLines(agent, at));
  return parts.join('\n\n') + '\n';
}

export function keyConfigText(agent, { key = KEY_PLACEHOLDER, url = KEY_MCP_URL } = {}) {
  const k = agent.keyConfig ?? {};
  if (!k.text) return null;
  return k.text.replaceAll('{{URL}}', url).replaceAll('{{KEY}}', key);
}

const fence = (lang, s) => `\`\`\`${lang}\n${s}\n\`\`\``;

// agents/<id>.md: the steps for one agent, for people reading the repository.
export function agentDoc(agent, registry, { root = PKG_ROOT } = {}) {
  const k = agent.keyConfig ?? {};
  const lines = [`# job-agent with ${agent.label}`, '', `<!-- Generated from distribution/agents.json by scripts/gen-plugins.mjs. -->`, '', agent.note, ''];
  let n = 1;
  const stepH = (t) => `## ${n++}. ${t}`;
  if (agent.skills === 'folder') {
    lines.push(stepH('Install the skills and the TrueInterview connection'), '', fence('bash', agent.install), '', 'It copies the skills into this agent\'s skills folder and registers the TrueInterview MCP server at user level.', '');
    lines.push(stepH('Sign in'), '', agent.signIn, '', `Prefer a key, for example on a machine where the browser sign-in doesn't work? Make one for ${agent.label} on ${registry.keyPage} (shown once; available as that page rolls out). ${k.where}`, '', fence(k.format === 'command' ? 'bash' : k.format, keyConfigText(agent)), '', 'Keep the key out of chats and repositories. A new key for the same agent replaces the old one.', '');
    lines.push(stepH('Run it'), '', `Say: \`${agent.runPrompt}\` The \`job-run\` skill reads your mode and caps from your TrueInterview account each run.`, '');
  } else {
    if (k.text) {
      lines.push(stepH('Add the TrueInterview connector'), '', `Make a key for ${agent.label} on ${registry.keyPage} (shown once). ${k.where}`, '', fence(k.format, keyConfigText(agent)), '');
    }
    lines.push(stepH('Send it the setup message'), '', `Start a new chat and send this. It carries job-agent's rules and run procedure (the skill pack), ${agent.schedule === 'daily' ? 'and sets up the daily run' : 'and runs when you ask'}. Change the time if you like.`, '');
    if (!k.text) lines.push(`The message doesn't contain your key. ${k.where.replaceAll('{{URL}}', KEY_MCP_URL)}`, '');
    lines.push(fence('text', setupMessage(agent, { root }).trimEnd()), '');
  }
  lines.push(stepH('Choose how it works'), '', 'On TrueInterview, set your mode (find and apply / pick for your approval / only the roles you add), who sends, a minimum match score and applications per day. The agent reads them at the start of every run, so a change applies from the next run without a new message.', '');
  lines.push(`Print this setup any time with \`job-agent agent ${agent.id}\`${agent.schedule === 'daily' ? ' (add `--time 8:00am` for another run time)' : ''}.`, '');
  return lines.join('\n');
}

export function agentsIndex(registry) {
  const rows = registry.agents.map((a) => `| [${a.label}](${a.id}.md) | ${a.skills === 'folder' ? 'skills folder (installed)' : 'setup message (skill pack)'} | ${a.schedule === 'daily' ? `daily, ${a.zone}` : 'when you ask'} |`);
  return [
    '# Agents',
    '',
    '<!-- Generated from distribution/agents.json by scripts/gen-plugins.mjs. -->',
    '',
    'job-agent works with any agent that can call a remote MCP server. Pick yours for the exact steps.',
    '',
    '| Agent | How the skills get in | Runs |',
    '| --- | --- | --- |',
    ...rows,
    '',
    'Agents with a skills folder get the full skill set from `job-agent install`. Agents without one (chat and desktop apps) get one setup message that carries the rules and the run procedure, generated from the same skill files, so both stay in step.',
    '',
    `Connecting: agents that support MCP sign-in just sign in. Others take a per-agent key from ${registry.keyPage}, shown once and pasted into the agent's own connector or credential settings, never into a chat. A new key for the same agent replaces the old one.`,
    '',
    'Your mode, who sends, minimum match score and applications per day live on your TrueInterview account; every run reads them first, so changing them never needs a new setup message.',
    '',
  ].join('\n');
}

