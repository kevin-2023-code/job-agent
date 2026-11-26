#!/bin/sh
# job-agent one-line installer for macOS and Linux:
#   curl -fsSL https://raw.githubusercontent.com/kevin-2023-code/job-agent/main/install.sh | sh
# Installs Node.js with Homebrew if it's missing (macOS), then runs
#   npx -y github:kevin-2023-code/job-agent install
# which sets up every AI agent on this machine (skills + TrueInterview MCP + sign-in).
# Local-only (no TrueInterview): ... | sh -s -- --local
set -e

if ! command -v node >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Node.js not found. Installing it with Homebrew..."
    brew install node
  else
    echo "Please install Node.js 18 or newer (https://nodejs.org), then run this line again."
    exit 1
  fi
fi

# Piped into sh, stdin is the script itself; give the installer the terminal so the
# agents' sign-in steps can open the browser and wait.
if [ -r /dev/tty ]; then
  exec npx -y github:kevin-2023-code/job-agent install "$@" </dev/tty
else
  exec npx -y github:kevin-2023-code/job-agent install "$@"
fi
