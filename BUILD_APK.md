# MyMedia v1.4.0 - APK Build for Samsung S25 Ultra

## One-Command Build

```bash
cd C:\dev\mymedia
eas build --platform android --profile production
```

**This builds ONE optimized APK for your Samsung S25 Ultra (latest Android)**

---

## What Happens

✅ EAS servers compile your React Native code  
✅ Creates single APK (not multiple splits)  
✅ Optimized for latest Android/ARM64  
✅ Latest NDK 27.0  
✅ Takes 10-15 minutes  

---

## Install on Your Phone

### Option 1: Download & Manual Install
1. Go to EAS dashboard → view build
2. Download APK file
3. Transfer to phone via USB
4. Settings → Apps → Install Unknown Apps → Select File
5. Tap install

### Option 2: ADB (Faster)
Connect phone via USB, then:
```bash
adb install -r C:\dev\mymedia\build\output.apk
```

### Option 3: Direct from EAS CLI
```bash
eas build --platform android --profile production
eas build:submit --platform android --profile production
```
(Then tap install link from terminal)

---

## Verify Installation

1. App launches
2. Search for a movie (e.g., "The Matrix")
3. Add movie to library
4. Go to Home tab → see it in Recently Added
5. Tap movie → see cast section with actor names
6. Go to Profile tab → see charts
7. Go to Trending tab → see trending movies

---

## Build Configuration

**File**: `eas.json`
- buildType: `apk` (not aab, not universal)
- ndk: `27.0.12077973` (latest)
- Single APK for your phone, not app store

---

## No Multi-Version Builds

Unlike Google Play builds that generate multiple APKs:
- ❌ No split APKs for different Android versions
- ❌ No universal APK (bloated)
- ❌ No App Bundle (AAB)

**Only**: 1 optimized APK for Samsung S25 Ultra

---

## Troubleshooting

**"Build failed"**
- Check TMDB_TOKEN in app.json is set
- Run `npm install` again
- Delete `node_modules` and reinstall

**"APK won't install"**
- Enable "Install from Unknown Sources" in Settings
- Phone storage has space (1GB+)
- SDK level 31+ (should be fine on S25 Ultra)

**"App crashes on launch"**
- Check Logcat: `adb logcat | grep MyMedia`
- Verify TMDB token is valid
- Clear app data and retry

---

## After Release

Save APK file for distribution:
```
MyMedia-v1.4.0-S25Ultra.apk
```

You now have a production app ready to share with others!

---

**Status**: Ready to build  
**Time to complete**: 10-15 minutes  
**Result**: 1 APK file, ~50-80MB
