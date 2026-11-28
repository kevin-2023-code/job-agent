# job-agent with Codex

<!-- Generated from distribution/agents.json by scripts/gen-plugins.mjs. -->

Runs when you ask. It applies with the Codex Chrome extension: allow it access to file URLs so it can upload your résumé, and give it access to the job sites ahead of time. The Browser plugin can't upload files.

## 1. Install the skills and the TrueInterview connection

```bash
npx -y github:kevin-2023-code/job-agent install --agents codex
```

It copies the skills into this agent's skills folder and registers the TrueInterview MCP server at user level.

## 2. Sign in

Run `codex mcp login trueinterview`.

Prefer a key, for example on a machine where the browser sign-in doesn't work? Make one for Codex on https://trueinterview.io/agent/start (shown once; available as that page rolls out). Paste at the end of ~/.codex/config.toml (the Codex app and CLI share it), replacing any earlier [mcp_servers.trueinterview] block, then restart Codex.

```toml
[mcp_servers.trueinterview]
url = "https://trueinterview.io/api/mcp/key"
http_headers = { Authorization = "Bearer <your TrueInterview key>" }
```

Keep the key out of chats and repositories. A new key for the same agent replaces the old one.

## 3. Run it

Say: `Run my job search now. Use the Codex Chrome extension to apply on company sites; for a site that needs me signed in, use Chrome, and list any role waiting on a sign-in instead of dropping it.` The `job-run` skill reads your mode and caps from your TrueInterview account each run.

## 4. Choose how it works

On TrueInterview, set your mode (find and apply / pick for your approval / only the roles you add), who sends, a minimum match score and applications per day. The agent reads them at the start of every run, so a change applies from the next run without a new message.

Print this setup any time with `job-agent agent codex`.
