# Releasing MyMedia

The `.github/workflows/release.yml` workflow builds the Android APK and publishes a GitHub
Release whenever you push a `v*` tag. One-time setup below.

## One-time setup

1. **Create an Expo account** (free) at https://expo.dev and install the CLI locally:
   ```bash
   npm i -g eas-cli
   eas login
   eas init          # links this project to your Expo account, writes the projectId
   ```
   Commit the `projectId` that `eas init` adds to `app.json`.

2. **Create an EAS access token**: https://expo.dev/accounts/[you]/settings/access-tokens →
   *Create token*.

3. **Add repo secrets** (GitHub → Settings → Secrets and variables → Actions):
   - `EXPO_TOKEN` — the EAS token from step 2. **(required)**
   - `EXPO_PUBLIC_TMDB_TOKEN` — your TMDB read token, if you want movie/series search baked into
     release builds. *(optional)*

## Cutting a release

```bash
# 1. Bump the version in app.json ("expo.version")
# 2. Commit it
git commit -am "release: v1.1.0"
# 3. Tag and push
git tag v1.1.0
git push && git push origin v1.1.0
```

CI builds the APK, creates the `v1.1.0` release, and attaches `mymedia-v1.1.0.apk`. Users get an
update prompt on next launch (the app compares its `app.json` version against the latest tag).

> Keep the tag version and `app.json`'s `expo.version` in sync — the in-app update check compares
> the installed app version against the release tag.
