param(
  [string]$KeystorePath = "",
  [string]$KeyAlias = "orrak-onestore-release"
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$appRoot = Join-Path $projectRoot "app"
$sdkRoot = $env:ANDROID_SDK_ROOT
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_HOME }
if (-not $sdkRoot) { $sdkRoot = "C:\Users\chajh\AppData\Local\Android\Sdk" }
if (-not $KeystorePath) { $KeystorePath = Join-Path $projectRoot "release\orrak-onestore-release.jks" }

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

function ConvertTo-PlainText($secureString) {
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Assert-InProject($path) {
  $full = [System.IO.Path]::GetFullPath($path)
  $root = [System.IO.Path]::GetFullPath($projectRoot)
  if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify path outside project: $full"
  }
}

function Assert-InTempBuild($path, $stageRoot) {
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

& (Join-Path $PSScriptRoot "prepare-web-assets.ps1")

$out = Join-Path $projectRoot "release"
New-Item -ItemType Directory -Force -Path $out | Out-Null

$storePassword = ConvertTo-PlainText (Read-Host "Release keystore password" -AsSecureString)
$keyPasswordInput = ConvertTo-PlainText (Read-Host "Release key password (empty = same as keystore)" -AsSecureString)
if (-not $keyPasswordInput) { $keyPasswordInput = $storePassword }

if (-not (Test-Path $KeystorePath)) {
  Assert-InProject $KeystorePath
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $KeystorePath) | Out-Null
  Invoke-Checked $keytool @(
    "-genkeypair",
    "-keystore", $KeystorePath,
    "-storepass", $storePassword,
    "-keypass", $keyPasswordInput,
    "-alias", $KeyAlias,
    "-keyalg", "RSA",
    "-keysize", "4096",
    "-validity", "10000",
    "-dname", "CN=Orrak OneStore,O=LogicHub24,C=KR"
  )
}

$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) "orrak-onestore-release-build"
$stageAppRoot = Join-Path $stageRoot "app"
$stageMainRoot = Join-Path $stageAppRoot "src\main"
$buildRoot = Join-Path $stageRoot "build"
$compiled = Join-Path $buildRoot "compiled-resources"
$generated = Join-Path $buildRoot "generated"
$classes = Join-Path $buildRoot "classes"
$dex = Join-Path $buildRoot "dex"
$manifest = Join-Path $stageMainRoot "AndroidManifest.xml"
$res = Join-Path $stageMainRoot "res"
$assets = Join-Path $stageMainRoot "assets"
$javaSrc = Join-Path $stageMainRoot "java"
$unsignedApk = Join-Path $buildRoot "app-unsigned.apk"
$alignedApk = Join-Path $buildRoot "app-aligned.apk"
$stageSignedApk = Join-Path $buildRoot "orrak-onestore-release.apk"
$finalApk = Join-Path $out "orrak-onestore-release.apk"

if (Test-Path $stageRoot) {
  Assert-InTempBuild $stageRoot $stageRoot
  Remove-Item -LiteralPath $stageRoot -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $compiled, $generated, $classes, $dex | Out-Null
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
Invoke-Checked $apksigner @(
  "sign",
  "--ks", $KeystorePath,
  "--ks-pass", "pass:$storePassword",
  "--key-pass", "pass:$keyPasswordInput",
  "--ks-key-alias", $KeyAlias,
  "--out", $stageSignedApk,
  $alignedApk
)
Invoke-Checked $apksigner @("verify", "--verbose", $stageSignedApk)
Copy-Item -LiteralPath $stageSignedApk -Destination $finalApk -Force

Write-Output "Built release APK: $finalApk"
