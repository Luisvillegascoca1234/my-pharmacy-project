param(
    [switch]$Clean,
    [switch]$Open
)

$ErrorActionPreference = "Stop"

$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildScript = Join-Path $projectDirectory "tesis\scripts\build.ps1"

if (-not (Test-Path $buildScript)) {
    Write-Error "The LaTeX build script was not found at: $buildScript"
}

& $buildScript -Clean:$Clean -Open:$Open
