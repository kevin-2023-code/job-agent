# job-agent

Open-source job-search skills for the AI agent you already use: Claude Code, Codex, Cursor, VS Code / GitHub Copilot, Gemini CLI, Windsurf, OpenCode, and chat agents such as Meta Muse, Manus, Grok, Qwen (千问办公) and WorkBuddy.

Tell it what you want and it finds the roles worth your time, scores each against your goals, tailors your résumé without inventing anything, applies on company sites the way you set it (it submits, or stops at the Submit button for you), keeps your tracker current, finds someone to refer you, preps you for the loop that follows, and drills you every day on what you're weakest at.

[中文说明](README.zh-CN.md)

## Install

Copy one line into a terminal and press Enter. It needs no answers from you.

**Windows**: open **PowerShell** (Start menu → type "PowerShell" → Enter), paste:

```powershell
irm https://raw.githubusercontent.com/kevin-2023-code/job-agent/main/install.ps1 | iex
```

**macOS / Linux**: open **Terminal**, paste:

```bash
curl -fsSL https://raw.githubusercontent.com/kevin-2023-code/job-agent/main/install.sh | sh
```

Already have Node.js 18+? This one line works on any system:

```bash
npx -y github:kevin-2023-code/job-agent install
```

It finds every AI agent on your machine (Claude Code, Codex, Cursor, VS Code / Copilot, Copilot CLI, Gemini CLI, Windsurf, OpenCode), adds the skills to each, connects TrueInterview and opens the sign-in page. When it finishes it prints the next line to run, for example:

```bash
claude "set me up"
```

The agent signs you in if you aren't yet (new users create a free account on the same page), reads your résumé, asks the few things it can't work out in one message, and saves your résumé and application preferences to your account. From then on, every change you make (an edited résumé, a new preference, an application sent) is uploaded as part of the work.

<details>
<summary>What exactly it changes, options, uninstall</summary>

- Installs Node.js if it's missing (winget on Windows, Homebrew on macOS).
- Copies job-agent to `~/.job-agent` and creates your workspace `~/job-agent` (your files; never overwritten).
- Skills go to `~/.claude/skills` (Claude Code), `~/.agents/skills` (the shared folder Codex, Cursor, Copilot, Gemini CLI and Windsurf read) and `~/.config/opencode/skills` (OpenCode).
- Registers the TrueInterview MCP server (`https://trueinterview.io/api/mcp`) at user level in each agent, with the agent's own CLI or by merging one entry into its JSON config after saving a `.bak-job-agent` copy.
- Signs in with the agent's own login where it has one (`claude mcp login`, `codex mcp login`, `opencode mcp auth`; each opens your browser). Cursor, VS Code, Gemini CLI and Windsurf ask on first use; the installer prints the one click for each.

| Option (add after `install`) | |
| --- | --- |
| `--local` | use only your own files, no TrueInterview |
| `--agents claude,codex` | only these agents |
| `--dry-run` | print every file and command, change nothing |
| `--no-login` | connect now, sign in later |

With the one-line installers: PowerShell `$env:JOB_AGENT_ARGS="--local"; irm … | iex`, Terminal `curl … | sh -s -- --local`.

Uninstall: `npx -y github:kevin-2023-code/job-agent uninstall` (skills and server entries go; your workspace stays).
</details>

<details>
<summary>Install as a plugin instead</summary>

Each plugin bundles the skills and the TrueInterview MCP server.

| Agent | Where to run | Command |
| --- | --- | --- |
| Claude Code | terminal | `claude plugin marketplace add kevin-2023-code/job-agent && claude plugin install job-agent@job-agent` |
| Codex | terminal | `codex plugin marketplace add kevin-2023-code/job-agent`, then install `job-agent` from `/plugins` |
| Copilot CLI | terminal | `copilot plugin marketplace add kevin-2023-code/job-agent && copilot plugin install job-agent@job-agent` |
| VS Code | settings.json | `"chat.plugins.marketplaces": ["kevin-2023-code/job-agent"]` |
| Cursor | Settings → Plugins | add marketplace `kevin-2023-code/job-agent`, install `job-agent` |
| Gemini CLI | terminal | `gemini extensions install https://github.com/kevin-2023-code/job-agent` |

Or clone the repo and open the folder in your agent: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and the project MCP configs are in place.
</details>

## How it works

**TrueInterview is the default** and connects without asking. Every skill also works without it:

- **Connected.** With the [TrueInterview](https://trueinterview.io) MCP signed in, the agent gets live postings across companies ranked for you, how each company actually interviews (rounds, topics, recently reported questions), fit scores, your résumé and saved answers, every application form read and answered from your records, and a tracker shared with the website. A free account works.
- **Local.** Without it, everything runs from your own files: résumé, preferences, a `knowledge/` folder of your interview notes and research, and the public Greenhouse, Lever, Ashby and SmartRecruiters boards of the companies you list.

The agent checks which mode it's in and never stops because the server is missing.

**When it isn't sure, it looks it up instead of guessing or asking you.** A form field it can't answer, a fact about you, how a company interviews: connected, it checks your saved answers, résumé, notes, earlier conversations and the company's record on TrueInterview first, then your local files, and only then asks you, once, and saves the answer so no form asks again. [`docs/data-sources.md`](docs/data-sources.md) has the details, including what is sent where.

## Use it with Muse, Qwen, Manus…

Chat and desktop agents have no skills folder, so job-agent gives each one **a single setup message**: it connects the agent to TrueInterview, carries the rules and the run procedure (the same text as the `job-run` skill, generated from it), and sets up a daily run at a time you pick. Your settings stay on your TrueInterview account, so changing them later never needs a new message.

| Agent | Steps | Runs |
| --- | --- | --- |
| Meta Muse | [agents/muse.md](agents/muse.md) | every day, in the cloud |
| Manus | [agents/manus.md](agents/manus.md) | every day, in the cloud (asks you to take over its browser for sign-ins) |
| Grok | [agents/grok.md](agents/grok.md) | every day |
| Qwen (千问办公) | [agents/qwen.md](agents/qwen.md) | every day while your computer is on |
| WorkBuddy | [agents/workbuddy.md](agents/workbuddy.md) | every day while your computer is on |
| Any other MCP agent | [agents/other.md](agents/other.md) | daily, or when you ask |
| Claude Code, Codex, Cursor, Gemini CLI, OpenCode | [agents/](agents/README.md) | when you ask (skills installed by the one-line install) |

The pattern for each:

1. **Connect.** Agents that support MCP sign-in just sign in. The others take a key you make for that agent on [trueinterview.io/agent/start](https://trueinterview.io/agent/start): it's shown once, goes into the agent's connector or credential settings, and never into a chat. A new key for the same agent replaces the old one.
2. **Send the setup message**, printed by `job-agent agent <id> --message --time 8:00am` or copied from the agent's page.
3. **Choose how it works** on TrueInterview: **find and apply**, **pick for my approval** (it adds picks to your to-apply list with a one-line reason; it applies only to the ones you approve), or **only the roles I add**; who presses Submit (your agent, or you); a minimum match score; and applications per day. Every run reads them first.

Each run ends with a short summary: what it applied to, what it prepared for you, picks waiting for your approval, and what it couldn't do and why (a site that needs you signed in, a question only you can answer, a closed role).

## Skills

| You say | Skill | What happens |
| --- | --- | --- |
| "Set me up" | `job-setup` | Signs you in, then saves your résumé, job search, every application-form answer and your goals to your account in one pass; drafts STAR stories |
| "I updated my résumé" / "sync" | `job-sync` | Uploads whatever changed (résumé file, preferences, answers, tracker) |
| "Run my job search" (or a daily schedule) | `job-run` | The whole loop by your mode: new roles, fit, your to-apply list, applications with the résumé that fits each role, a log of what it couldn't do, your daily cap, a short summary |
| "Find me roles" / "anything new?" | `job-scan` | Ranked roles across companies plus new postings at your watch list, screened and triaged in one table |
| "Is this worth it?" + a link | `job-evaluate` | A–F grade on six weighted dimensions, every must-have mapped to your résumé, the company's interview record, a two-minute report |
| "Tailor my résumé" | `job-tailor` | A tailored résumé (and letter) with every change shown, nothing invented, as an upload-ready PDF |
| "Apply to this" | `job-apply` | Every field answered from your records, open questions drafted, the form filled in your browser and the résumé that fits the role attached. Submitted by your agent or left for you to press, as you set it |
| "I heard back from…" | `job-track` | Tracker updated, follow-ups drafted, honest weekly numbers |
| "Prep me for the onsite" | `job-prep` | The loop round by round, a day-by-day plan with practice links, story map, mock interviews with real feedback |
| "Who can refer me at…?" | `job-outreach` | The right two or three people and a short note for you to send |
| "Give me a problem" / "mock me" | `job-practice` | What to practise next (due revision, your pipeline's companies, your weak topics), coaching with hints instead of answers, timed mock rounds, and a log of the mistakes to fix next |

## Data and services

What the skills talk to, and what goes there:

| Service | When | What is sent |
| --- | --- | --- |
| TrueInterview MCP (`https://trueinterview.io/api/mcp`) | Connected mode (the default) | What you ask about (a role, a company, a form), and what you ask it to save: résumé, job-search preferences, application-form answers, notes, tracker updates. Never self-identification answers, ID or card numbers, or passwords. [Privacy policy](https://trueinterview.io/privacy) |
| Employer application pages (in your agent's browser) | When you ask it to apply, or on a run in a mode that applies | The answers for that form and your résumé file; submitted by your agent only when you've set it to send |
| Public job-board APIs (Greenhouse, Lever, Ashby, SmartRecruiters) | `job-agent scan` | Nothing about you: it only reads public postings for the companies in `portals.yml` |
| GitHub (raw.githubusercontent.com, npm via npx) | Only when you run the installer | Nothing about you: it downloads job-agent |

Your `knowledge/` folder, reports, stories and local files are never uploaded by job-agent. Your AI provider sees what your agent reads, under its own terms.

**Another AI model writes some answers.** The TrueInterview server is run by TrueCode Technologies Inc. Its résumé reading and tailoring, cover letters, drafted form answers, fit scores and people search send your request to an AI model that writes the result: Anthropic's Claude, with DeepSeek models through OpenRouter as the fallback. Under the API terms TrueInterview uses, your inputs are not used to train those models.

**People search (`find_contacts`).** Only when you ask, it looks for people at one employer you could contact about a role. Sources: Google search results for public LinkedIn profiles, fetched through Apify, and, when that finds too few, an AI model's web search (through OpenRouter) of public pages such as LinkedIn profiles, company team and careers pages, engineering blog author pages and conference talk pages. It keeps a name, a headline, the public profile link and the page it was found on, never an email address or phone number, stored only in the account of the person who searched. Legal basis (where the GDPR applies): TrueInterview's legitimate interest in helping a candidate research an employer, limited to public professional information ([privacy policy](https://trueinterview.io/privacy), sections 2(d) and 3). Anyone listed can ask to be removed by emailing kevin@trueinterview.io with the link to their profile.

## What it won't do

- Invent anything about you.
- Press the final Submit unless you've set your agent to send applications. Send an email or message anyone: it drafts; you send.
- Sign in for you, create accounts, handle passwords, or solve CAPTCHAs.
- Answer self-identification questions unless you've told it to decline them.

Filling forms needs a browser tool in your agent; [`docs/browser.md`](docs/browser.md) has a one-line setup for each. Without one, you get an answer sheet to paste from.

## Your files

```
~/job-agent/
  profile/     cv.md, profile.yml, stories.md, resumes/ (one per kind of role or language)
  knowledge/   interview notes, research, recruiter emails, reviews
  portals.yml  companies whose job boards to watch
  data/        local tracker, to-apply list, new postings
  reports/     one evaluation per posting
  output/      tailored résumés, letters, answer sheets, prep plans
```

`knowledge/` is where it compounds: the agent searches it before answering anything about a company or your history, in both modes.

## Scripts

The skills run these; so can you (`node ~/.job-agent/bin/job-agent.mjs <command>`, or `npm run <command>` in a clone).

```bash
job-agent scan [--company stripe] [--days 7]   # new postings at your companies
job-agent track list | due | stats              # local tracker
job-agent list | add | approve | skip | back     # local to-apply list
job-agent agent muse --message --time 8:00am    # setup message for a chat agent
job-agent pdf <file.md>                          # Markdown → PDF via your Chrome/Edge
job-agent kb search stripe onsite                # search knowledge/
job-agent doctor                                 # check setup
```

Node 18+, no dependencies.

## Customize

Scoring weights: [`docs/scoring.md`](docs/scoring.md). Résumé look: [`templates/cv.html`](templates/cv.html). Workflows: one Markdown file per skill in [`skills/`](skills). New job boards: [`scripts/lib/boards.mjs`](scripts/lib/boards.mjs). After editing skills or `AGENTS.md`, run `npm run gen:plugins`.

## Contributing

Issues and pull requests welcome: ATS fetchers, résumé templates, installer support for more agents, and skill changes that come from real searches. `npm test` before a PR.

## License

MIT
