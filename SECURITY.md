# Security

Please report security issues privately through GitHub: **Security → Report a vulnerability** on https://github.com/kevin-2023-code/job-agent (private vulnerability reporting). Don't open a public issue for them.

Include what you found, how to reproduce it, and the version or commit. We aim to reply within 5 business days.

## Scope

- This repository: skills, scripts, installer, generated plugins.
- The TrueInterview MCP server (`https://trueinterview.io/api/mcp`) is operated by TrueInterview; report issues with it the same way and we'll route them.

## What the code does

- The installer writes only to user-level agent folders and configs it names in its output (`--dry-run` lists them), backs up any JSON config before editing it, and `uninstall` reverses it.
- Scripts make network requests only to the public job-board APIs listed in the README and, through your agent, to the TrueInterview MCP server.
- Nothing in this repository stores or sends passwords, tokens or payment details.
