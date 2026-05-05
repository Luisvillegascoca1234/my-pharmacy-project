param(
    [switch]$Clean,
    [switch]$Open
)

$ErrorActionPreference = "Stop"

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$thesisDirectory = Resolve-Path (Join-Path $scriptDirectory "..")
$mainFile = Join-Path $thesisDirectory "main.tex"
$buildDirectory = Join-Path $thesisDirectory "build"
$pdfFile = Join-Path $buildDirectory "main.pdf"
$miktexDirectory = Join-Path $env:LOCALAPPDATA "Programs\MiKTeX\miktex\bin\x64"
$strawberryPerlDirectory = "C:\Strawberry\perl\bin"

if ((Test-Path $miktexDirectory) -and ($env:Path -notlike "*$miktexDirectory*")) {
    $env:Path = "$miktexDirectory;$env:Path"
}

if ((Test-Path $strawberryPerlDirectory) -and ($env:Path -notlike "*$strawberryPerlDirectory*")) {
    $env:Path = "$strawberryPerlDirectory;$env:Path"
}

if (-not (Test-Path $buildDirectory)) {
    New-Item -ItemType Directory -Path $buildDirectory | Out-Null
}

$resolvedBuildDirectory = Resolve-Path $buildDirectory

if ($Clean) {
    Get-ChildItem -LiteralPath $resolvedBuildDirectory -File | Remove-Item -Force
}

$latexmk = Get-Command latexmk -ErrorAction SilentlyContinue
$pdflatex = Get-Command pdflatex -ErrorAction SilentlyContinue
$biber = Get-Command biber -ErrorAction SilentlyContinue

Push-Location $thesisDirectory
try {
    if ($latexmk) {
        latexmk -pdf -interaction=nonstopmode -outdir=build main.tex
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }

        if ($Open -and (Test-Path $pdfFile)) {
            Invoke-Item $pdfFile
        }

        Write-Host "PDF generated at: $pdfFile"
        exit 0
    }

    if ($pdflatex) {
        if (-not $biber) {
            Write-Error "pdflatex was found, but biber was not found. Install biber from MiKTeX Console."
        }

        pdflatex -interaction=nonstopmode -output-directory=build $mainFile
        biber (Join-Path $buildDirectory "main")
        pdflatex -interaction=nonstopmode -output-directory=build $mainFile
        pdflatex -interaction=nonstopmode -output-directory=build $mainFile
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }

        if ($Open -and (Test-Path $pdfFile)) {
            Invoke-Item $pdfFile
        }

        Write-Host "PDF generated at: $pdfFile"
        exit 0
    }

    Write-Error "No LaTeX compiler was found. Install MiKTeX and reopen PowerShell."
}
finally {
    Pop-Location
}
