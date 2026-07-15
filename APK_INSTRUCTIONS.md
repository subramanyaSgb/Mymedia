# MyMedia v1.4.0 - Build & Install Instructions

## Quick Build (Requires Android Device Connected)

### Step 1: Connect Samsung S25 Ultra
1. Plug in via USB cable
2. Enable USB Debugging: Settings → Developer Options → USB Debugging ON
3. Unlock phone
4. Authorize connection when prompted

### Step 2: Run Build Command
```bash
cd C:\dev\mymedia
npm run android
```

**What happens:**
- Expo compiles code
- Gradle builds APK  
- APK auto-installs on phone
- App launches automatically

**Time:** 3-10 minutes (first build is slower)

---

## Building Without Device (Manual APK)

### Method 1: Build Unsigned APK
```bash
cd C:\dev\mymedia\android
.\gradlew.bat assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Method 2: Build Debug APK  
```bash
cd C:\dev\mymedia\android
.\gradlew.bat assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Method 3: Use Expo Cloud Build (EAS)
```bash
cd C:\dev\mymedia
eas build --platform android --profile production
```

---

## Install APK Manually

### Via USB
1. Build APK (see above)
2. Connect phone via USB
3. Transfer APK: `adb push app-release.apk /sdcard/Download/`
4. On phone: Settings → Apps → Install Unknown Apps → Select APK
5. Install and launch

### Via ADB
```bash
adb install -r C:\dev\mymedia\android\app\build\outputs\apk\release\app-release.apk
```

### Via Share
1. Copy APK file
2. Share via email/cloud (Google Drive, OneDrive)
3. Download on phone
4. Tap to install

---

## Build Requirements

### Installed & Configured ✅
- Java 17 (Temurin) at `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`
- JAVA_HOME set correctly
- ANDROID_HOME set correctly
- Android SDK 36
- NDK 27.1
- Gradle 9.3

### Pre-Build Checks
```bash
# Verify everything
java -version          # Should show Java 17
adb devices            # Should list your phone
npm -v                 # Should show npm version
```

---

## Troubleshooting

### "No Android device found"
```bash
adb kill-server
adb start-server
adb devices
```

### "Build failed - Gradle error"
```bash
cd C:\dev\mymedia
rm -r node_modules android
npm install --legacy-peer-deps
npm run android
```

### "JAVA_HOME invalid"
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
# Then retry build
```

### "Permission denied on APK"
```bash
# Make APK executable (on Linux/Mac)
chmod +x app-release.apk

# On Windows, just transfer to phone and tap
```

---

## After Installation

### Test All Features
- [ ] Home tab: Stats and greeting
- [ ] Search: Add a movie (e.g., "The Matrix")
- [ ] Cast: Click actor name → see filmography
- [ ] Detail: View cast, crew, genres, runtime
- [ ] Profile: View charts
- [ ] Trending: See trending movies
- [ ] Library: All categories work

### Enable Auto-Updates
- Allow "Install Unknown Apps" permission
- App will notify about v1.5.0+ releases
- One-tap update from notification

---

## GitHub Release APK

Pre-built APK available at:
```
https://github.com/subramanyaSgb/Mymedia/releases/tag/v1.4.0-final
```

Download `app-release.apk` and follow "Install APK Manually" above.

---

## Build Checklist

Before building:
- [ ] Android device connected via USB
- [ ] USB Debugging enabled
- [ ] Phone stays unlocked during build
- [ ] Internet connection available (for Gradle deps)
- [ ] 5GB free disk space
- [ ] Java 17 installed
- [ ] Android SDK installed

---

## Questions?

1. **Build hangs?** Wait 10 minutes for Gradle cache
2. **Gradle offline?** Check internet connection
3. **APK won't install?** Try `adb install -r` with `-r` flag to reinstall
4. **App crashes?** Check logs: `adb logcat | grep MyMedia`

---

**MyMedia v1.4.0 is ready to build!** 🚀

