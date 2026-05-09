$ErrorActionPreference = "Stop"

$deadline = (Get-Date).AddSeconds(60)

do {
  docker compose exec -T postgres pg_isready -U postgres -d pharmacy_pos

  if ($LASTEXITCODE -eq 0) {
    exit 0
  }

  Start-Sleep -Seconds 1
} while ((Get-Date) -lt $deadline)

Write-Error "Postgres did not become ready within 60 seconds."
exit 1
