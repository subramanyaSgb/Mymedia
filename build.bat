@echo off
REM MyMedia Local Android Build Script
REM For Samsung S25 Ultra (latest Android)

echo.
echo ====================================
echo   MyMedia v1.4.0 - Local Build
echo ====================================
echo.

REM Check if in correct directory
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run from C:\dev\mymedia
    exit /b 1
)

REM Check prerequisites
echo Checking prerequisites...
where /q adb
if errorlevel 1 (
    echo ERROR: ADB not found in PATH
    echo Please set ANDROID_HOME environment variable
    echo and add %%ANDROID_HOME%%\platform-tools to PATH
    exit /b 1
)

where /q java
if errorlevel 1 (
    echo ERROR: Java not found in PATH
    echo Please set JAVA_HOME environment variable
    echo and add %%JAVA_HOME%%\bin to PATH
    exit /b 1
)

echo ✓ ADB found
echo ✓ Java found
echo.

REM Check connected devices
echo Checking for connected Android devices...
for /f "tokens=*" %%A in ('adb devices ^| find "device" ^| find /v "devices"') do (
    echo ✓ Found device: %%A
    goto :device_found
)

echo ERROR: No Android device found
echo Please connect your Samsung S25 Ultra via USB and enable USB debugging
exit /b 1

:device_found
echo.
echo Installing dependencies (if needed)...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: npm install failed
    exit /b 1
)

echo.
echo ====================================
echo   Starting Local Build
echo ====================================
echo.
echo This will:
echo   1. Build Android APK
echo   2. Install to your Samsung S25 Ultra
echo   3. Launch app automatically
echo   4. Show logs in console
echo.
echo Press any key to continue (or Ctrl+C to cancel)...
pause

echo.
echo Building...
call npm run android

if errorlevel 1 (
    echo.
    echo ====================================
    echo   BUILD FAILED
    echo ====================================
    echo.
    echo Check the errors above and:
    echo   1. Verify Android SDK installed
    echo   2. Verify phone USB debugging enabled
    echo   3. Run: npm install --legacy-peer-deps
    echo   4. Try again
    exit /b 1
)

echo.
echo ====================================
echo   BUILD SUCCESSFUL
echo ====================================
echo.
echo MyMedia v1.4.0 is running on your phone!
echo.
echo Features to try:
echo   • Search for a movie in Explore tab
echo   • Add to library
echo   • View cast members (tap on actor name)
echo   • Check Profile tab for charts
echo   • View Trending section
echo.
pause
