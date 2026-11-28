# Agents

<!-- Generated from distribution/agents.json by scripts/gen-plugins.mjs. -->

job-agent works with any agent that can call a remote MCP server. Pick yours for the exact steps.

| Agent | How the skills get in | Runs |
| --- | --- | --- |
| [Claude Code](claude-code.md) | skills folder (installed) | when you ask |
| [Codex](codex.md) | skills folder (installed) | when you ask |
| [Cursor](cursor.md) | skills folder (installed) | when you ask |
| [Gemini CLI](gemini.md) | skills folder (installed) | when you ask |
| [OpenCode](opencode.md) | skills folder (installed) | when you ask |
| [Meta Muse](muse.md) | setup message (skill pack) | daily, Pacific Time |
| [Manus](manus.md) | setup message (skill pack) | daily, Pacific Time |
| [Grok](grok.md) | setup message (skill pack) | daily, Pacific Time |
| [Qwen (千问办公)](qwen.md) | setup message (skill pack) | daily, China time |
| [WorkBuddy](workbuddy.md) | setup message (skill pack) | daily, China time |
| [Another agent](other.md) | setup message (skill pack) | daily, your time zone |

Agents with a skills folder get the full skill set from `job-agent install`. Agents without one (chat and desktop apps) get one setup message that carries the rules and the run procedure, generated from the same skill files, so both stay in step.

Connecting: agents that support MCP sign-in just sign in. Others take a per-agent key from https://trueinterview.io/agent/start, shown once and pasted into the agent's own connector or credential settings, never into a chat. A new key for the same agent replaces the old one.

Your mode, who sends, minimum match score and applications per day live on your TrueInterview account; every run reads them first, so changing them never needs a new setup message.
