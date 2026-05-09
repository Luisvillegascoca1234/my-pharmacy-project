$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/pharmacy_pos?schema=public"
}

function Invoke-DevStep {
  param(
    [Parameter(Mandatory = $true)]
    [string[]] $Command
  )

  $executable = $Command[0]
  $arguments = @()

  if ($Command.Length -gt 1) {
    $arguments = $Command[1..($Command.Length - 1)]
  }

  & $executable @arguments

  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}

Invoke-DevStep @("pnpm", "--filter", "@pharmacy-pos/backend", "prisma:generate")
Invoke-DevStep @("pnpm", "--filter", "@pharmacy-pos/backend", "prisma:migrate")
Invoke-DevStep @("pnpm", "--filter", "@pharmacy-pos/backend", "prisma:seed")
