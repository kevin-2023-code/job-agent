# job-agent with Claude Code

<!-- Generated from distribution/agents.json by scripts/gen-plugins.mjs. -->

Runs when you ask. For a daily run, set it up as a scheduled task in the Claude desktop app (it runs while the computer is awake). It applies with Claude in Chrome (start it with `claude --chrome`) or a Playwright MCP server; Chrome uploads files up to 10 MB. Allow Claude in Chrome on the job sites so it doesn't stop to ask on each one.

## 1. Install the skills and the TrueInterview connection

```bash
npx -y github:kevin-2023-code/job-agent install --agents claude
```

It copies the skills into this agent's skills folder and registers the TrueInterview MCP server at user level.

## 2. Sign in

Run `claude mcp login trueinterview` (or type `/mcp` inside Claude Code and pick trueinterview).

Prefer a key, for example on a machine where the browser sign-in doesn't work? Make one for Claude Code on https://trueinterview.io/agent/start (shown once; available as that page rolls out). Run in your terminal. It replaces an earlier trueinterview entry.

```bash
claude mcp remove trueinterview --scope user 2>/dev/null; claude mcp add --scope user --transport http trueinterview https://trueinterview.io/api/mcp/key --header "Authorization: Bearer <your TrueInterview key>"
```

Keep the key out of chats and repositories. A new key for the same agent replaces the old one.

## 3. Run it

Say: `Run my job search now.` The `job-run` skill reads your mode and caps from your TrueInterview account each run.

## 4. Choose how it works

On TrueInterview, set your mode (find and apply / pick for your approval / only the roles you add), who sends, a minimum match score and applications per day. The agent reads them at the start of every run, so a change applies from the next run without a new message.

Print this setup any time with `job-agent agent claude-code`.
