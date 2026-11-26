# job-agent one-line installer for Windows PowerShell:
#   irm https://raw.githubusercontent.com/kevin-2023-code/job-agent/main/install.ps1 | iex
# Installs Node.js LTS with winget if it's missing, then runs
#   npx -y github:kevin-2023-code/job-agent install
# which sets up every AI agent on this machine (skills + TrueInterview MCP + sign-in).
# Local-only (no TrueInterview): set $env:JOB_AGENT_ARGS = "--local" before running.

$ErrorActionPreference = 'Stop'

function Test-Node { [bool](Get-Command node -ErrorAction SilentlyContinue) }

if (-not (Test-Node)) {
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    Write-Host 'Node.js not found. Installing Node.js LTS with winget...'
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements | Out-Host
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  }
  if (-not (Test-Node)) {
    Write-Host 'Please install Node.js 18 or newer from https://nodejs.org, then run this line again.'
    return
  }
}

$extra = @()
if ($env:JOB_AGENT_ARGS) { $extra = $env:JOB_AGENT_ARGS -split '\s+' }
& npx -y github:kevin-2023-code/job-agent install @extra
