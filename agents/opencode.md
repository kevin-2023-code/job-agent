# job-agent with OpenCode

<!-- Generated from distribution/agents.json by scripts/gen-plugins.mjs. -->

Runs when you ask. Applying needs a browser MCP (see docs/browser.md).

## 1. Install the skills and the TrueInterview connection

```bash
npx -y github:kevin-2023-code/job-agent install --agents opencode
```

It copies the skills into this agent's skills folder and registers the TrueInterview MCP server at user level.

## 2. Sign in

Run `opencode mcp auth trueinterview`.

Prefer a key, for example on a machine where the browser sign-in doesn't work? Make one for OpenCode on https://trueinterview.io/agent/start (shown once; available as that page rolls out). Add this entry inside "mcp" in ~/.config/opencode/opencode.json.

```json
{
  "mcp": {
    "trueinterview": {
      "type": "remote",
      "url": "https://trueinterview.io/api/mcp",
      "headers": { "Authorization": "Bearer <your TrueInterview key>" },
      "enabled": true
    }
  }
}
```

Keep the key out of chats and repositories. A new key for the same agent replaces the old one.

## 3. Run it

Say: `Run my job search now.` The `job-run` skill reads your mode and caps from your TrueInterview account each run.

## 4. Choose how it works

On TrueInterview, set your mode (find and apply / pick for your approval / only the roles you add), who sends, a minimum match score and applications per day. The agent reads them at the start of every run, so a change applies from the next run without a new message.

Print this setup any time with `job-agent agent opencode`.
