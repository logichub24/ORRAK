$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$orrakFolderName = (-join ([char[]](0xC624, 0xB974, 0xB77D))) + "(ORRAK)"
$defaultSourceRoot = Join-Path (Split-Path -Parent $projectRoot) $orrakFolderName
if ($env:ORRAK_SOURCE_ROOT) {
  $sourceRoot = Resolve-Path $env:ORRAK_SOURCE_ROOT
} elseif (Test-Path (Join-Path $defaultSourceRoot "package.json")) {
  $sourceRoot = Resolve-Path $defaultSourceRoot
} else {
  $sourceRoot = Resolve-Path (Join-Path $projectRoot "..")
}
$distRoot = Join-Path $sourceRoot "dist"
$assetRoot = Join-Path $projectRoot "app\src\main\assets"

function Assert-InProject($path) {
  $full = [System.IO.Path]::GetFullPath($path)
  $root = [System.IO.Path]::GetFullPath($projectRoot)
  if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify path outside project: $full"
  }
}

if (-not (Test-Path (Join-Path $distRoot "index.html"))) {
  throw "dist/index.html not found. Run `npm.cmd run build:web` from the parent ORRAK project first."
}

if (Test-Path $assetRoot) {
  Assert-InProject $assetRoot
  Remove-Item -LiteralPath $assetRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $distRoot "index.html") -Destination $assetRoot -Force

$indexPath = Join-Path $assetRoot "index.html"
$index = Get-Content -LiteralPath $indexPath -Raw -Encoding UTF8
$index = $index.Replace('src="/assets/', 'src="assets/')
$index = $index.Replace('href="/assets/', 'href="assets/')
$index = $index -replace '<title>[^<]*</title>', '<title>&#50724;&#47476;&#46973;</title>'
$description = '<meta name="description" content="Orrak measures focus in 60 seconds and shows AI coaching insights." />'
$index = $index -replace '<meta\s+name="description"[\s\S]*?/>', $description

$distAssets = Join-Path $distRoot "assets"
$jsFile = Get-ChildItem -LiteralPath $distAssets -Filter "*.js" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$cssFile = Get-ChildItem -LiteralPath $distAssets -Filter "*.css" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $jsFile -or -not $cssFile) {
  throw "dist/assets JavaScript or CSS file not found."
}

$js = Get-Content -LiteralPath $jsFile.FullName -Raw -Encoding UTF8
$js = $js.Replace("</script>", "<\/script>")
$css = Get-Content -LiteralPath $cssFile.FullName -Raw -Encoding UTF8

$channelBlock = "<script>window.__ORRAK_DISTRIBUTION = ""onestore"";</script>"
$scriptBlock = "$channelBlock`r`n<script type=""module"">`r`n$js`r`n</script>"
$styleBlock = "<style>`r`n$css`r`n</style>"
$index = [regex]::Replace($index, '<script[^>]+src="assets/[^"]+\.js"[^>]*></script>', { param($match) $scriptBlock })
$index = [regex]::Replace($index, '<link[^>]+href="assets/[^"]+\.css"[^>]*>', { param($match) $styleBlock })
Set-Content -LiteralPath $indexPath -Value $index -Encoding UTF8

Write-Output "Prepared WebView assets at $assetRoot"
