# A browser for filling forms

`job-apply` fills application forms in a browser and stops at the final Submit. Your agent needs a browser tool for that. Without one, it hands you an answer sheet to paste from instead.

Use a browser profile where you are already signed in to the job sites you use (LinkedIn, Workday tenants, Greenhouse/Lever accounts): the agent never signs in for you.

| Agent | Browser |
| --- | --- |
| Claude Code (desktop app) | the built-in browser, or Claude in Chrome |
| Claude Code (CLI) | Claude in Chrome (`/chrome`), or Playwright MCP below |
| Cursor | the built-in browser (Agent → Browser), or Playwright MCP |
| Codex, Copilot, Gemini CLI, others | Playwright MCP or Chrome DevTools MCP |

## Playwright MCP

Opens a real Chrome window with a persistent profile, so a sign-in you do once stays.

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
codex mcp add playwright -- npx -y @playwright/mcp@latest
gemini mcp add playwright npx -y @playwright/mcp@latest
```

Cursor / VS Code / others:

```json
{ "mcpServers": { "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] } } }
```

## Chrome DevTools MCP

Drives your own Chrome.

```json
{ "mcpServers": { "chrome-devtools": { "command": "npx", "args": ["-y", "chrome-devtools-mcp@latest"] } } }
```

## What the agent does and doesn't do in the browser

- Fills text fields, dropdowns, checkboxes and multi-page forms; uploads your résumé and cover letter.
- Stops and hands over at: the final Submit, any sign-in or account creation, CAPTCHAs, email or SMS codes, payment or ID-number fields, and self-identification questions you haven't told it to decline.
- To turn filling off and always get an answer sheet instead: `apply.fill_forms: false` in `profile/profile.yml`, or just tell the agent.
