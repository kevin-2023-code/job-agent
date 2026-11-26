# job-agent

Turn the AI coding agent you already use (Claude Code, Codex, Cursor, Copilot, Gemini CLI) into a job-search assistant that runs in a folder on your machine.

It scores postings against what you actually want, scans your target companies' job boards for new roles, tailors your CV to each one without inventing anything, prepares every application form for you to submit, keeps a tracker, and preps you for the interviews that follow. Your CV, notes and tracker are plain files in this folder. Nothing is uploaded anywhere unless you connect something yourself.

[中文说明](README.zh-CN.md)

## Why

Most job-search advice comes down to: apply to fewer, better-matched roles, tailor every application, follow up, and prepare for the specific loop you're facing. All of it is tedious, which is why people skip it and spray applications instead. An agent is good at exactly this kind of tedious, careful work, as long as it knows you and is kept honest. This repo gives it the structure for both.

## What it does

| You say | Skill | What happens |
| --- | --- | --- |
| "Set me up" + your résumé | `job-setup` | Builds `profile/cv.md`, your targets and deal-breakers, draft STAR stories, and the list of companies to watch |
| "Is this worth applying to?" + a link | `job-evaluate` | A–F grade on six weighted dimensions, every must-have mapped to a line of your CV, gaps, red flags, and a 2-minute report in `reports/` |
| "Anything new?" | `job-scan` | Reads the public Greenhouse, Lever, Ashby and SmartRecruiters boards of your companies, filters by title, location and age, drops what you've seen, triages the rest |
| "Tailor my CV for this" | `job-tailor` | A tailored copy of your CV, with every change shown for approval, rendered to PDF; a cover letter when one is wanted |
| "Help me apply" | `job-apply` | Reads the form, answers each field from your profile, drafts the open questions, and hands you an answer sheet. You press Submit |
| "Stripe wants a screen next week" | `job-track` | Updates the tracker, sets follow-ups, and gives you honest numbers on what's working |
| "Prep me for the onsite" | `job-prep` | The loop round by round, likely questions, a day-by-day plan, story-to-question map, and mock interviews with real feedback |

## What it won't do

- Invent anything about you. Every line it writes traces to your files or to what you told it.
- Submit an application, send an email, or message anyone. It drafts; you send.
- Sign in, create accounts, handle passwords, or solve CAPTCHAs.
- Answer self-identification questions for you.

These rules live in [`AGENTS.md`](AGENTS.md), which every supported agent reads.

## Quick start

Needs Node 18+ and an agent that can read files and run commands.

```bash
git clone https://github.com/kevin-2023-code/job-agent.git
cd job-agent
npm install
npm run setup
```

Then open the folder in your agent and say **"set me up"**, with your résumé attached or pasted. After that, paste a job link.

- **Claude Code** picks up the skills in `.claude/skills/` automatically.
- **Codex, Cursor, Copilot, Gemini CLI** read `AGENTS.md`, which points them at each skill file.

## Your data

```
profile/     cv.md, profile.yml, stories.md      who you are and what you want
knowledge/   anything you drop in                interview notes, research, recruiter emails
portals.yml  companies to scan
data/        applications.tsv, pipeline.md       tracker and new postings
reports/     one evaluation per posting
output/      tailored CVs, letters, answer sheets, prep plans
```

All of it is git-ignored. The tracker is a TSV that opens in any spreadsheet.

The agent is only as good as what it knows about you. **`knowledge/` is where the value compounds**: interview notes from past loops, a brag doc, performance reviews, what a friend told you about a team. The agent searches it before answering anything about a company or your history.

## Scripts

The agent runs these; you can too.

```bash
npm run scan                          # new postings at your companies → data/pipeline.md
npm run scan -- --company stripe --days 7
npm run track -- list                 # the tracker
npm run track -- due                  # follow-ups due
npm run track -- stats                # funnel, reply rate, outcomes by grade
npm run pdf -- output/acme-swe/cv.md  # Markdown → HTML + PDF (uses your Chrome/Edge)
npm run kb -- search stripe onsite    # search your knowledge base
npm run kb -- index                   # write knowledge/INDEX.md
npm run doctor                        # check setup
```

## More data (optional)

On its own, the agent knows your files, the postings and whatever web search finds. What it can't know is what other candidates saw: how a company's loop runs this year and what it asks. Build that up in `knowledge/`, or connect a data source over MCP. [`docs/data-sources.md`](docs/data-sources.md) covers both, including [TrueInterview](https://trueinterview.io) (interview reports by company, a question bank, live postings and fit scores; needs an account). Nothing in this repo requires it.

## Customize

- **Scoring**: weights and grade bands are in [`docs/scoring.md`](docs/scoring.md). Change them to match your market.
- **CV look**: [`templates/cv.html`](templates/cv.html) is plain HTML and CSS.
- **Workflows**: each skill is one Markdown file in `.claude/skills/`. Edit it like a prompt.
- **New job boards**: add a fetcher to [`scripts/lib/boards.mjs`](scripts/lib/boards.mjs).

## Contributing

Issues and pull requests welcome, especially new ATS fetchers, CV templates, and skill improvements that come from real searches. Run `npm test` before opening a PR.

## License

MIT
