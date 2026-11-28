# Publishing the plugin (maintainers)

job-agent ships as **one plugin per agent, each with the TrueInterview MCP built in**. Users who install the plugin get the skills and the server in one step and only sign in. Publishing therefore means getting these plugins into each platform's directory. The MCP server is also listed on its own in MCP directories, for people who want only the server.

## Before every release

```bash
npm test                      # unit tests + generated plugins up to date
npm run gen:plugins           # after editing AGENTS.md, skills/, scripts/ or distribution/ (also rebuilds agents/)
```

Bump `version` in `distribution/plugin.source.json` and `package.json`, regenerate, commit, push to `main`. The self-hosted marketplaces below pick the change up from the repository; directory listings are re-reviewed per platform.

## What is where

| Path | For |
| --- | --- |
| `plugins/claude/` (`.claude-plugin/plugin.json`, `.mcp.json`) | Claude Code |
| `plugins/codex/` (`.codex-plugin/plugin.json`, `.mcp.json`) | Codex and the ChatGPT/Codex plugin directory |
| `plugins/cursor/` (`.cursor-plugin/plugin.json`, `mcp.json`) | Cursor |
| `plugins/copilot/` (`plugin.json`, `mcp.json`) | GitHub Copilot CLI and VS Code |
| `gemini-extension.json` (repo root) | Gemini CLI |
| `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, `.cursor-plugin/marketplace.json`, `.github/plugin/marketplace.json` | Each agent's self-hosted marketplace (this repo) |
| `assets/logo.svg`, `assets/logo.png` (512×512) | Listing icons |
| `agents/` (generated from `distribution/agents.json`, `AGENTS.md`, `skills/job-run/SKILL.md`) | Per-agent steps, and the setup message (skill pack) for chat and desktop agents without a skills folder: Meta Muse, Manus, Grok, Qwen, WorkBuddy, others. Add an agent by adding an entry to `distribution/agents.json` and running `npm run gen:plugins`. |

## 1. Live now: the repo is the marketplace

Nothing to submit; anyone can install today.

| Platform | User runs |
| --- | --- |
| Claude Code | `claude plugin marketplace add kevin-2023-code/job-agent` then `claude plugin install job-agent@job-agent` |
| Codex | `codex plugin marketplace add kevin-2023-code/job-agent`, install from `/plugins` |
| Copilot CLI | `copilot plugin marketplace add kevin-2023-code/job-agent` then `copilot plugin install job-agent@job-agent` |
| VS Code | `"chat.plugins.marketplaces": ["kevin-2023-code/job-agent"]` |
| Cursor | Settings → Plugins → add marketplace `kevin-2023-code/job-agent` |
| Gemini CLI | `gemini extensions install https://github.com/kevin-2023-code/job-agent` |
| Any agent | the one-line installers in the README |

## 2. Official directories (owner submits; needs logins)

Order by reach and effort. Each needs the owner's account; everything else is prepared in this repo.

### Anthropic: Claude directory (Claude, Claude Code, Cowork)
- Needs a paid claude.ai plan (Pro is enough); the listing belongs to the organization you submit from.
- **First the connector** (the MCP server): claude.ai/directory/manage → **Submit new** → **MCP connector** → URL `https://trueinterview.io/api/mcp`. Listing text, use cases, privacy/terms URLs, 7 compliance acknowledgments, Submit. Auto-scan, then listed as Community by default. Every tool needs a `title` and `readOnlyHint` / `destructiveHint` (check the Tools step for flags; fixes are on the server).
- **Then the plugin**: same page → **Submit new** → plugin → the public GitHub repo `kevin-2023-code/job-agent` (plugin folder `plugins/claude`), paired with the connector. (From the 11-14 research; check the form's current fields when you get there.)
- Details and the full field list: `research/mcp-launch-2026-11-22/first-party-routes.md` §1.

### OpenAI: plugin directory (ChatGPT and Codex)
- One upload covers both. Owner: identity verification in OpenAI org settings, then platform.openai.com/plugins → **Upload new plugin**.
- Build the ZIP from `plugins/codex/` (it already has `.codex-plugin/plugin.json` with the interface fields and `.mcp.json` with the remote server; the MCP server must be in the first ZIP):
  ```powershell
  Compress-Archive -Path plugins\codex\* -DestinationPath job-agent-codex.zip -Force
  ```
- Also needed: the domain token served at `https://trueinterview.io/.well-known/openai-apps-challenge`, a demo TrueInterview account with sample data and a password login (no email codes or magic links), 5 positive and 3 negative test cases, a short screen-recording URL, release notes. Then Submit for review → Publish once approved.
- Watch: no pricing or upgrade promotion inside tool results; every tool needs explicit `readOnlyHint`, `destructiveHint`, `openWorldHint`.

### Cursor Marketplace
- cursor.com/marketplace/publish → submit `https://github.com/kevin-2023-code/job-agent` (marketplace file `.cursor-plugin/marketplace.json` → `plugins/cursor`). Manual review, also for every update. Free.

### Gemini CLI extensions gallery
- Automatic: a public repo with `gemini-extension.json` at the root is crawled daily once it has the topic `gemini-cli-extension`:
  ```bash
  gh repo edit kevin-2023-code/job-agent --add-topic gemini-cli-extension
  ```

### GitHub Copilot
- VS Code and Copilot CLI already install from this repo's marketplace. For discovery, a PR adding job-agent to `github/awesome-copilot` (plugins section) is the community route (requirements unverified).

### Smaller directories (public repo required, free)
- Cline MCP Marketplace: GitHub issue on `cline/mcp-marketplace` with the repo link and the 512×512 logo.
- Kiro: web form with the public repo URL.

## 3. The MCP server on its own

Already done for TrueInterview (2026-11-22): the official MCP Registry entry `io.trueinterview/trueinterview` (bump `server.json` and re-publish after server changes), plus PRs to Docker's catalog and awesome lists. Remaining owner-only items (Claude connector, OpenAI, Google Connected Console, GitHub registry nomination, web-form directories) are in `research/reports/2026-11-22_MCP上架_手动操作清单.pdf`.

For people who want only the server, the install links that need no listing:
- Cursor: `cursor://anysphere.cursor-deeplink/mcp/install?name=trueinterview&config=eyJ1cmwiOiJodHRwczovL3RydWVpbnRlcnZpZXcuaW8vYXBpL21jcCJ9`
- VS Code: `https://vscode.dev/redirect/mcp/install?name=trueinterview&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Ftrueinterview.io%2Fapi%2Fmcp%22%7D`
