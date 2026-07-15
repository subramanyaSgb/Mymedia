# Local Android APK Build - Samsung S25 Ultra

## Prerequisites

Before building locally, make sure you have:

### 1. Android Studio Installed
Download from: https://developer.android.com/studio

### 2. Android SDK
- SDK Level 31+ (S25 Ultra = API 35+)
- NDK 27.0+
- Gradle 8.5+

Android Studio → Settings → SDK Manager → Install if needed

### 3. Java Development Kit (JDK)
```bash
# Check if installed
java -version

# Should show Java 17+
```

### 4. Environment Variables Set
```
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jre (or your JDK path)
```

Add to PATH:
```
%ANDROID_HOME%\cmdline-tools\latest\bin
%ANDROID_HOME%\platform-tools
%JAVA_HOME%\bin
```

### 5. Phone Connected
- USB connected to computer
- USB debugging enabled (Settings → Developer Options → USB Debugging)
- Phone stays unlocked during build

---

## One-Command Local Build

```bash
cd C:\dev\mymedia
npm run android
```

This will:
✅ Build APK locally on your machine  
✅ Install directly to connected Samsung S25 Ultra  
✅ Launch app automatically  
✅ Show logs in terminal  

**Takes 3-5 minutes first time (caches after)**

---

## What Happens During Build

1. Metro bundler starts (bundles JavaScript)
2. Gradle builds native Android code
3. APK compiled and signed
4. ADB installs to your phone
5. App launches automatically
6. Logs stream to terminal

---

## Verify Installation

App should launch automatically on your phone showing:
- "MyMedia" splash screen
- Home tab with greeting
- Search (Explore tab) working
- Can add movies
- Cast section displays on movie detail
- Charts show on Profile tab

---

## Troubleshooting

### "Device not found"
```bash
adb devices
```
Should show your phone. If not:
- Reconnect USB cable
- Enable USB debugging in phone settings
- Authorize connection on phone prompt

### "Build failed - Gradle error"
```bash
# Clean and rebuild
cd C:\dev\mymedia
rm -r node_modules
npm install --legacy-peer-deps
npm run android
```

### "Java not found"
Set JAVA_HOME correctly:
```bash
# Find where Java is installed
where java

# Set env var (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jre"
```

### "out of memory"
Increase Gradle heap:
```bash
# Create gradle.properties in project root
org.gradle.jvmargs=-Xmx4096m
```

### "APK won't launch"
Check logs:
```bash
adb logcat | grep MyMedia
```

---

## Build Commands

### Just Build (don't install)
```bash
npx expo prebuild --platform android
npx expo run:android --no-build
```

### Full Build Cycle
```bash
npm run android
```

### Clear Cache & Rebuild
```bash
npm run android -- --clean
```

### Run Without Rebuilding
```bash
npm start
```
(Pick 'a' for Android when prompted)

---

## Development Loop

### Quick Iteration
```bash
# Terminal 1: Start dev server
npm start

# Terminal 2: On any code change, rebuild
npm run android
```

### Hot Reload During Dev
Changes to JavaScript reload instantly  
Changes to native code require rebuild

---

## Release APK (Optimized)

For production release (signed APK):

```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## File Locations

| Item | Location |
|------|----------|
| Build cache | `android/` folder (100MB+) |
| Gradle cache | `~/.gradle/` (1GB+) |
| Built APK | `build/outputs/apk/debug/` |
| Logs | Console output / `adb logcat` |
| Config | `gradle.properties`, `build.gradle` |

---

## Performance Tips

### Faster Rebuilds
- Use incremental builds (default)
- Don't clean unnecessarily
- Exclude node_modules from builds

### Parallel Gradle
Add to gradle.properties:
```
org.gradle.parallel=true
org.gradle.workers.max=8
```

### Skip D8 Desugaring (if no older Android needed)
`build.gradle` → minSdkVersion 31+ → faster

---

## Post-Build APK

After successful build, APK is at:
```
C:\dev\mymedia\android\app\build\outputs\apk\debug\app-debug.apk
```

### Share APK
Copy to cloud/USB and share with others:
```bash
cp android/app/build/outputs/apk/debug/app-debug.apk MyMedia-v1.4.0.apk
```

### Install on Another Phone
```bash
adb -s DEVICE_ID install -r MyMedia-v1.4.0.apk
```

---

## Environment Setup Checklist

- [ ] Android Studio installed
- [ ] Android SDK 35+ installed
- [ ] NDK 27+ installed
- [ ] Java 17+ available
- [ ] ANDROID_HOME set in environment
- [ ] JAVA_HOME set in environment
- [ ] Phone connected via USB
- [ ] USB debugging enabled
- [ ] npm packages installed (`npm install --legacy-peer-deps`)
- [ ] Run `npm run android` once successfully

---

## Time Estimate

| Step | Time |
|------|------|
| First build (clean) | 5-10 minutes |
| Subsequent builds | 1-3 minutes |
| Incremental JS change | 30 seconds |
| Native rebuild | 2-5 minutes |

---

## If You Get Stuck

### Reset Everything
```bash
cd C:\dev\mymedia
rm -r node_modules android build .gradle
npm install --legacy-peer-deps
npm run android
```

### Verify Setup
```bash
# Check Android SDK
adb --version

# Check devices
adb devices

# Check Java
java -version

# Check npm
npm --version
```

All should show versions with no errors.

---

## Success Indicators

✅ `npm run android` completes without errors  
✅ App launches on your phone  
✅ Can search for movies  
✅ Can add to library  
✅ Cast section visible  
✅ Profile tab charts display  
✅ Trending section works  

**You're done!**

---

**Status**: Ready for local build  
**Command**: `npm run android`  
**Result**: MyMedia v1.4.0 running on Samsung S25 Ultra  
**Debug**: Logs in terminal, access via `adb logcat`
