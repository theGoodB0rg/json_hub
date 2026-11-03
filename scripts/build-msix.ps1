# Builds the Microsoft Store package (MSIX) for the JsonExport desktop app.
#
#   npm run msix                 # web export + release exe + package
#   npm run msix -- -SkipWeb     # reuse the existing out/ folder
#
# Needs the MSVC Rust toolchain and the Windows 10/11 SDK (makeappx.exe).
# The package is unsigned on purpose: the Store signs it on ingestion.
# Output: src-tauri\target\msix\JsonExport_<version>_x64.msix

param([switch]$SkipWeb)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$tauriDir = Join-Path $root 'src-tauri'
$conf = Get-Content (Join-Path $tauriDir 'tauri.conf.json') -Raw | ConvertFrom-Json
$version = "$($conf.version).0"   # Store versions have four parts; the last must be 0

$makeappx = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\makeappx.exe" -ErrorAction SilentlyContinue |
    Sort-Object { [version]$_.Directory.Parent.Name } -Descending | Select-Object -First 1
if (-not $makeappx) { throw 'makeappx.exe not found. Install the Windows 10/11 SDK.' }

Push-Location $root
try {
    if (-not $SkipWeb) {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'next build failed' }
    }
    npx tauri build --no-bundle
    if ($LASTEXITCODE -ne 0) { throw 'tauri build failed' }
} finally { Pop-Location }

$exe = Get-ChildItem -Path (Join-Path $root 'target\release\JsonExport.exe'), (Join-Path $tauriDir 'target\release\JsonExport.exe') -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $exe) { throw 'JsonExport.exe not found after build' }

$outDir = Join-Path $tauriDir 'target\msix'
$layout = Join-Path $outDir 'layout'
if (Test-Path $layout) { Remove-Item $layout -Recurse -Force }
New-Item -ItemType Directory -Force $layout | Out-Null

Copy-Item $exe.FullName $layout
Copy-Item (Join-Path $tauriDir 'msix\Assets') (Join-Path $layout 'Assets') -Recurse
(Get-Content (Join-Path $tauriDir 'msix\AppxManifest.xml') -Raw).Replace('{{VERSION}}', $version) |
    Set-Content (Join-Path $layout 'AppxManifest.xml') -Encoding utf8

$msix = Join-Path $outDir "JsonExport_$($conf.version)_x64.msix"
& $makeappx.FullName pack /o /h SHA256 /d $layout /p $msix
if ($LASTEXITCODE -ne 0) { throw 'makeappx pack failed' }

Write-Host "MSIX ready: $msix (version $version, built from $($exe.FullName))"
