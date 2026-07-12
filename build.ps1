# MyMedia Local Android Build Script
# For Samsung S25 Ultra (latest Android)

Write-Host ""
Write-Host "===================================="
Write-Host "  MyMedia v1.4.0 - Local Build"
Write-Host "===================================="
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found"
    Write-Host "Please run from C:\dev\mymedia"
    exit 1
}

# Check prerequisites
Write-Host "Checking prerequisites..."

# Check ADB
$adbPath = (Get-Command adb -ErrorAction SilentlyContinue).Source
if (-not $adbPath) {
    Write-Host "ERROR: ADB not found in PATH"
    Write-Host "Please set ANDROID_HOME environment variable"
    Write-Host "and add `%ANDROID_HOME`%\platform-tools to PATH"
    exit 1
}

# Check Java
$javaPath = (Get-Command java -ErrorAction SilentlyContinue).Source
if (-not $javaPath) {
    Write-Host "ERROR: Java not found in PATH"
    Write-Host "Please set JAVA_HOME environment variable"
    Write-Host "and add `%JAVA_HOME`%\bin to PATH"
    exit 1
}

Write-Host "✓ ADB found at: $adbPath"
Write-Host "✓ Java found at: $javaPath"
Write-Host ""

# Check connected devices
Write-Host "Checking for connected Android devices..."
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" } | ForEach-Object { $_.Split()[0] }

if (-not $devices) {
    Write-Host "ERROR: No Android device found"
    Write-Host "Please connect your Samsung S25 Ultra via USB and enable USB debugging"
    exit 1
}

foreach ($device in $devices) {
    Write-Host "✓ Found device: $device"
}

Write-Host ""
Write-Host "Installing dependencies (if needed)..."
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed"
    exit 1
}

Write-Host ""
Write-Host "===================================="
Write-Host "  Starting Local Build"
Write-Host "===================================="
Write-Host ""
Write-Host "This will:"
Write-Host "  1. Build Android APK"
Write-Host "  2. Install to your Samsung S25 Ultra"
Write-Host "  3. Launch app automatically"
Write-Host "  4. Show logs in console"
Write-Host ""
Read-Host "Press Enter to continue (or Ctrl+C to cancel)"

Write-Host ""
Write-Host "Building..."
npm run android

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "===================================="
    Write-Host "  BUILD FAILED"
    Write-Host "===================================="
    Write-Host ""
    Write-Host "Check the errors above and:"
    Write-Host "  1. Verify Android SDK installed"
    Write-Host "  2. Verify phone USB debugging enabled"
    Write-Host "  3. Run: npm install --legacy-peer-deps"
    Write-Host "  4. Try again"
    exit 1
}

Write-Host ""
Write-Host "===================================="
Write-Host "  BUILD SUCCESSFUL"
Write-Host "===================================="
Write-Host ""
Write-Host "MyMedia v1.4.0 is running on your phone!"
Write-Host ""
Write-Host "Features to try:"
Write-Host "  • Search for a movie in Explore tab"
Write-Host "  • Add to library"
Write-Host "  • View cast members (tap on actor name)"
Write-Host "  • Check Profile tab for charts"
Write-Host "  • View Trending section"
Write-Host ""
Read-Host "Press Enter to close"
