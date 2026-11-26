# Data sources

job-agent works on its own: your files, the posting, the public job boards in `portals.yml`, and web search if your agent has it. That covers evaluating, tailoring, applying and tracking.

What it can't know on its own is what other candidates saw: what a company actually asks in each round, how its loop is structured this year, which roles are open across companies you haven't listed. For that you either build it up yourself in `knowledge/` (interview notes, notes from friends, saved reports), or connect a data source over MCP. The skills check your agent's tool list and use a source only when it is there.

## Your own knowledge base

The default, and the one that gets better the longer you search. See `knowledge/README.md` (created by `npm run setup`). The agent searches it before anything else.

## TrueInterview (MCP)

[TrueInterview](https://trueinterview.io) runs an MCP server with interview reports by company and role, a question bank, live job postings, résumé-to-job fit scores and an application tracker. It needs a TrueInterview account (a free one works; some data needs a paid plan). Your agent signs in through the browser once; there is no key to copy.

When connected, the skills use it for: wider job search (`job-scan`), company interview intel and likely questions (`job-prep`, `job-evaluate`), and fit scoring (`job-evaluate`). What it sends: the role and company you ask about, and, only when you ask it to save something, that item. Your local files stay local.

Claude Code:

```bash
claude mcp add --transport http trueinterview https://trueinterview.io/api/mcp
```

Then run `/mcp` in Claude Code and sign in.

Cursor / other agents: add to your MCP config

```json
{
  "mcpServers": {
    "trueinterview": { "type": "http", "url": "https://trueinterview.io/api/mcp" }
  }
}
```

Codex:

```bash
codex mcp add trueinterview --url https://trueinterview.io/api/mcp
codex mcp login trueinterview
```

To disconnect, remove the server from your agent's MCP config. Nothing in this repo depends on it.

## Others

Any MCP server or tool that returns job postings or company data can play the same role: the skills look for what a tool does, not its name. Pull requests adding notes for other sources are welcome.
