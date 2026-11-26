# Data sources

job-agent has two sources of truth and uses both when it can.

## TrueInterview (connected mode, the default)

The plugin registers the [TrueInterview](https://trueinterview.io) MCP server (`https://trueinterview.io/api/mcp`). You sign in once in the browser; there's no key to copy. A free account works; some data and higher monthly limits need a paid plan.

What it adds over local mode:

| Area | Tools |
| --- | --- |
| Live jobs across companies, ranked for you | `recommend_jobs`, `search_jobs`, `screen_jobs`, `get_job`, `skip_job` |
| Fit against your résumé | `match_resume_to_job` |
| How a company actually interviews | `get_company_intel`, `search_questions`, `search_site_content` |
| What to practise next | `get_prep_plan`, `get_my_progress` |
| Your résumé, kept in sync | `get_resume`, `import_resume`, `update_resume` |
| Tailored résumé and cover letter, checked for invented facts | `tailor_resume`, `write_cover_letter`, `generate_application_documents` |
| Application forms: every field read and answered from your records | `prepare_application`, `draft_answers`, `get_application_checklist`, `update_application_answers` |
| Tracker shared with the website | `track_application`, `update_application`, `list_applications`, `report_application` |
| People to reach | `list_contacts`, `find_contacts`, `update_contact` |
| Memory across agents and devices | `save_context_note`, `list_context_notes`, `update_job_search` |

What goes to TrueInterview: what you ask the tools about (a role, a company, a form) and what you ask it to save. Your `knowledge/` folder, reports and local files are never uploaded by job-agent. Your AI provider sees what your agent reads, under its own terms.

### Signing in

The plugin installs the server; you only sign in.

| Agent | Sign in |
| --- | --- |
| Claude Code | `/mcp`, pick `trueinterview`, sign in |
| Codex | `codex mcp login trueinterview` |
| Cursor | Settings → MCP → trueinterview → Connect |
| VS Code / Copilot | the MCP server list → trueinterview → Start, then sign in |
| Gemini CLI | `/mcp auth trueinterview` |

### Adding it by hand (no plugin)

```bash
claude mcp add --transport http trueinterview https://trueinterview.io/api/mcp
codex mcp add trueinterview --url https://trueinterview.io/api/mcp && codex mcp login trueinterview
gemini mcp add --transport http trueinterview https://trueinterview.io/api/mcp
```

Any other agent with remote MCP support:

```json
{ "mcpServers": { "trueinterview": { "type": "http", "url": "https://trueinterview.io/api/mcp" } } }
```

## Local (always on)

Your own files in the workspace (`job-agent where`): résumé, preferences, stories, `knowledge/`, the companies in `portals.yml` and the public job boards behind them, plus web search if your agent has it. When TrueInterview isn't connected, these cover every skill. When it is, `knowledge/` and the watch list still add what only you have.

`knowledge/` is the part that compounds: past interview notes, brag docs, reviews, recruiter emails, a friend's notes on a team. See `knowledge/README.md` in your workspace.

## Other sources

The skills look for what a tool does, so any MCP server that returns postings or company data can fill the same role. Pull requests with notes for other sources are welcome.
