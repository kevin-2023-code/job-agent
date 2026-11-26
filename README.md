# job-agent

Open-source job-search skills for the AI agent you already use: Claude Code, Codex, Cursor, VS Code / GitHub Copilot, Gemini CLI, Windsurf, OpenCode.

Tell it what you want and it finds the roles worth your time, scores each against your goals, tailors your résumé without inventing anything, fills in the application form in your browser up to the Submit button, keeps your tracker current, finds someone to refer you, and preps you for the loop that follows.

[中文说明](README.zh-CN.md)

## Install

One command. It finds the agents on your machine, adds the skills to each, connects the TrueInterview MCP and starts sign-in:

```bash
npx -y github:kevin-2023-code/job-agent install
```

Then open your agent anywhere and say **"set me up"**.

<details>
<summary>What the installer does, and options</summary>

- Copies job-agent to `~/.job-agent` (the scripts the skills run) and creates your workspace `~/job-agent` (your files; never overwritten).
- Skills go to `~/.claude/skills` (Claude Code), `~/.agents/skills` (the shared folder Codex, Cursor, Copilot, Gemini CLI and Windsurf read) and `~/.config/opencode/skills` (OpenCode).
- For each agent it finds: copies the skills to that agent's user skills folder, and registers the MCP server at user level (with the agent's own CLI, or by merging one entry into its JSON config after saving a `.bak-job-agent` copy).
- Signs in: runs the agent's own login where it has one (`claude mcp login`, `codex mcp login`, `opencode mcp auth`; each opens your browser), and for agents that sign in from inside the app (Cursor, VS Code, Gemini, Windsurf) opens TrueInterview once and prints the one click left.

| Flag | |
| --- | --- |
| `--agents claude,codex,cursor,vscode,copilot,gemini,windsurf,opencode` | only these |
| `--yes` | don't ask |
| `--dry-run` | print every file and command, change nothing |
| `--no-mcp` | skills only, local mode |
| `--no-login` | register the server, sign in later |

`npx -y github:kevin-2023-code/job-agent uninstall` removes the skills and the server entries; your workspace stays.
</details>

<details>
<summary>Prefer your agent's plugin system?</summary>

This repo is a plugin marketplace too. Each plugin bundles the skills and the MCP server.

| Agent | |
| --- | --- |
| Claude Code | `claude plugin marketplace add kevin-2023-code/job-agent` then `claude plugin install job-agent@job-agent` |
| Codex | `codex plugin marketplace add kevin-2023-code/job-agent`, then install `job-agent` from the plugin list |
| Copilot CLI | `copilot plugin marketplace add kevin-2023-code/job-agent` then `copilot plugin install job-agent@job-agent` |
| Cursor | Settings → Plugins → add marketplace `kevin-2023-code/job-agent` |
| Gemini CLI | `gemini extensions install https://github.com/kevin-2023-code/job-agent` |

Or clone it and open the folder: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` and the project MCP configs (`.mcp.json`, `.cursor/`, `.vscode/`, `.gemini/`, `.codex/`) are all in place.
</details>

## How it works

Two modes, and every skill works in both:

- **Connected.** With the [TrueInterview](https://trueinterview.io) MCP signed in, the agent gets live postings across companies ranked for you, how each company actually interviews (rounds, topics, recently reported questions), fit scores, your résumé and saved answers, every application form read and answered from your records, and a tracker shared with the website. A free account works.
- **Local.** Without it, everything runs from your own files: résumé, preferences, a `knowledge/` folder of your interview notes and research, and the public Greenhouse, Lever, Ashby and SmartRecruiters boards of the companies you list.

The agent checks which mode it's in and never stops because the server is missing. [`docs/data-sources.md`](docs/data-sources.md) has the details, including what is sent where.

## Skills

| You say | Skill | What happens |
| --- | --- | --- |
| "Set me up" + your résumé | `job-setup` | Résumé, targets, deal-breakers, work authorization and companies to watch on record; STAR stories drafted |
| "Find me roles" / "anything new?" | `job-scan` | Ranked roles across companies plus new postings at your watch list, screened and triaged in one table |
| "Is this worth it?" + a link | `job-evaluate` | A–F grade on six weighted dimensions, every must-have mapped to your résumé, the company's interview record, a two-minute report |
| "Tailor my résumé" | `job-tailor` | A tailored résumé (and letter) with every change shown, nothing invented, as an upload-ready PDF |
| "Apply to this" | `job-apply` | Every field answered from your records, open questions drafted, the form filled in your browser and the résumé attached. You review and press Submit |
| "I heard back from…" | `job-track` | Tracker updated, follow-ups drafted, honest weekly numbers |
| "Prep me for the onsite" | `job-prep` | The loop round by round, a day-by-day plan with practice links, story map, mock interviews with real feedback |
| "Who can refer me at…?" | `job-outreach` | The right two or three people and a short note for you to send |

## What it won't do

- Invent anything about you.
- Press the final Submit, send an email, or message anyone. It drafts and fills; you send.
- Sign in for you, create accounts, handle passwords, or solve CAPTCHAs.
- Answer self-identification questions unless you've told it to decline them.

Filling forms needs a browser tool in your agent; [`docs/browser.md`](docs/browser.md) has a one-line setup for each. Without one, you get an answer sheet to paste from.

## Your files

```
~/job-agent/
  profile/     cv.md, profile.yml, stories.md
  knowledge/   interview notes, research, recruiter emails, reviews
  portals.yml  companies whose job boards to watch
  data/        local tracker, new postings
  reports/     one evaluation per posting
  output/      tailored résumés, letters, answer sheets, prep plans
```

`knowledge/` is where it compounds: the agent searches it before answering anything about a company or your history, in both modes.

## Scripts

The skills run these; so can you (`node ~/.job-agent/bin/job-agent.mjs <command>`, or `npm run <command>` in a clone).

```bash
job-agent scan [--company stripe] [--days 7]   # new postings at your companies
job-agent track list | due | stats              # local tracker
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
