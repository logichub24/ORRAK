$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$appRoot = Join-Path $projectRoot "app"
$sdkRoot = $env:ANDROID_SDK_ROOT
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_HOME }
if (-not $sdkRoot) { $sdkRoot = "C:\Users\chajh\AppData\Local\Android\Sdk" }

$buildTools = Join-Path $sdkRoot "build-tools\36.1.0"
$androidJar = Join-Path $sdkRoot "platforms\android-35\android.jar"
$jbr = "C:\Program Files\Android\Android Studio\jbr"
$javac = Join-Path $jbr "bin\javac.exe"
$jar = Join-Path $jbr "bin\jar.exe"
$keytool = Join-Path $jbr "bin\keytool.exe"
$aapt2 = Join-Path $buildTools "aapt2.exe"
$d8 = Join-Path $buildTools "d8.bat"
$zipalign = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
$env:JAVA_HOME = $jbr
$env:Path = (Join-Path $jbr "bin") + ";" + $env:Path

foreach ($required in @($androidJar, $javac, $jar, $keytool, $aapt2, $d8, $zipalign, $apksigner)) {
  if (-not (Test-Path $required)) {
    throw "Required build tool not found: $required"
  }
}

& (Join-Path $PSScriptRoot "prepare-web-assets.ps1")

$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) "orrak-onestore-manual-build"
$stageAppRoot = Join-Path $stageRoot "app"
$stageMainRoot = Join-Path $stageAppRoot "src\main"
$buildRoot = Join-Path $stageRoot "build"
$compiled = Join-Path $buildRoot "compiled-resources"
$generated = Join-Path $buildRoot "generated"
$classes = Join-Path $buildRoot "classes"
$dex = Join-Path $buildRoot "dex"
$out = Join-Path $projectRoot "release"
$manifest = Join-Path $stageMainRoot "AndroidManifest.xml"
$res = Join-Path $stageMainRoot "res"
$assets = Join-Path $stageMainRoot "assets"
$javaSrc = Join-Path $stageMainRoot "java"
$unsignedApk = Join-Path $buildRoot "app-unsigned.apk"
$alignedApk = Join-Path $buildRoot "app-aligned.apk"
$debugKeystore = Join-Path $stageRoot "debug.keystore"
$stageSignedApk = Join-Path $buildRoot "orrak-onestore-debug.apk"
$finalApk = Join-Path $out "orrak-onestore-debug.apk"

function Assert-InProject($path) {
  $full = [System.IO.Path]::GetFullPath($path)
  $root = [System.IO.Path]::GetFullPath($projectRoot)
  if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify path outside project: $full"
  }
}

function Assert-InTempBuild($path) {
  $full = [System.IO.Path]::GetFullPath($path)
  $root = [System.IO.Path]::GetFullPath($stageRoot)
  if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify path outside temp build: $full"
  }
}

function Invoke-Checked($command, $arguments) {
  & $command @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $command $($arguments -join ' ')"
  }
}

if (Test-Path $stageRoot) {
  Assert-InTempBuild $stageRoot
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $compiled, $generated, $classes, $dex, $out | Out-Null
New-Item -ItemType Directory -Force -Path $stageAppRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $appRoot "src") -Destination $stageAppRoot -Recurse -Force

$manifestXml = Get-Content -LiteralPath $manifest -Raw -Encoding UTF8
$manifestXml = $manifestXml -replace '<manifest xmlns:android="http://schemas.android.com/apk/res/android"', '<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.logichub24.orrak.onestore"'
Set-Content -LiteralPath $manifest -Value $manifestXml -Encoding UTF8

Invoke-Checked $aapt2 @("compile", "--dir", $res, "-o", (Join-Path $compiled "res.zip"))
Invoke-Checked $aapt2 @(
  "link",
  "-o", $unsignedApk,
  "-I", $androidJar,
  "--manifest", $manifest,
  "-R", (Join-Path $compiled "res.zip"),
  "-A", $assets,
  "--java", $generated,
  "--auto-add-overlay",
  "--min-sdk-version", "23",
  "--target-sdk-version", "35"
)

$javaFiles = Get-ChildItem -Path $javaSrc, $generated -Recurse -Filter *.java | ForEach-Object { $_.FullName }
Invoke-Checked $javac (@("-encoding", "UTF-8", "-source", "8", "-target", "8", "-bootclasspath", $androidJar, "-d", $classes) + $javaFiles)
$classFiles = Get-ChildItem -Path $classes -Recurse -Filter *.class | ForEach-Object { $_.FullName }
Invoke-Checked $d8 (@("--lib", $androidJar, "--output", $dex) + $classFiles)
Invoke-Checked $jar @("uf", $unsignedApk, "-C", $dex, "classes.dex")
Invoke-Checked $zipalign @("-f", "4", $unsignedApk, $alignedApk)

if (-not (Test-Path $debugKeystore)) {
  Invoke-Checked $keytool @(
    "-genkeypair",
    "-keystore", $debugKeystore,
    "-storepass", "android",
    "-keypass", "android",
    "-alias", "androiddebugkey",
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-dname", "CN=Android Debug,O=Android,C=US"
  )
}

Invoke-Checked $apksigner @(
  "sign",
  "--ks", $debugKeystore,
  "--ks-pass", "pass:android",
  "--key-pass", "pass:android",
  "--out", $stageSignedApk,
  $alignedApk
)

Invoke-Checked $apksigner @("verify", "--verbose", $stageSignedApk)
Copy-Item -LiteralPath $stageSignedApk -Destination $finalApk -Force
Write-Output "Built $finalApk"
