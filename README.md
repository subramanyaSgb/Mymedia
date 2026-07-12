# MyMedia

**All your favorites. Organized.**

MyMedia is a personal media tracker for **Movies, Series, Anime, and Songs**. Search real
catalogs, build your library, track watch status and progress, and see your stats — all stored
**locally on your device**. No account, no cloud, no tracking.

<p align="center"><i>React Native · Expo · SQLite · 100% on-device</i></p>

---

## 📲 Install (Android)

1. Go to the **[latest release](https://github.com/subramanyaSgb/Mymedia/releases/latest)**.
2. Download the `.apk` asset.
3. Open it on your phone and allow "install from unknown sources" if prompted.

The app checks GitHub for new releases on launch and prompts you to update. You can also check
anytime from **Profile → About & Updates**.

> iOS isn't distributed here — Apple doesn't allow sideloading. Run it locally with Expo (below).

---

## ✨ Features

- **Search catalogs** — Movies & Series (TMDB), Anime (MyAnimeList via Jikan).
- **Manual entry** — add Songs with a title, artist, and cover image.
- **Track everything** — Want to Watch / Watching / Finished, favorites, your rating, notes.
- **Progress** — season/episode tracking for series and anime.
- **Library & lists** — browse by category or by list (all derived from your data).
- **Statistics** — days tracked, items watched, hours logged.
- **Local-first** — everything lives in an on-device SQLite database.

---

## 🛠 Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native (Expo SDK 57, managed) |
| Language | TypeScript |
| Navigation | expo-router (file-based) |
| Database | expo-sqlite + Drizzle ORM (reactive `useLiveQuery`) |
| Catalog APIs | TMDB (movies/series), Jikan (anime) |
| Distribution | GitHub Releases + in-app update check |

No backend. No global state library. Catalog searches write results straight into SQLite.

---

## 🚀 Run locally

```bash
npm install
npx expo start
```

Press `a` for Android or `i` for iOS (needs a simulator/device).

### TMDB token (optional)

Movie/series search needs a free TMDB **API Read Access Token**
([get one here](https://www.themoviedb.org/settings/api)). Anime search works without any key.

Provide it either way:

```bash
# .env (git-ignored)
EXPO_PUBLIC_TMDB_TOKEN=your_token_here
```

or set `expo.extra.tmdbToken` in `app.json`. Without it, movie/series search is disabled and the
app shows a hint; everything else works.

---

## 📦 Building a release APK

Releases are built by CI on tag push (see `.github/workflows/release.yml`) using
[EAS Build](https://docs.expo.dev/build/introduction/). To cut a release:

```bash
# bump the version in app.json, then:
git tag v1.1.0
git push origin v1.1.0
```

CI builds the APK, attaches it to a GitHub Release named after the tag, and users get the update
prompt on next launch. See [`docs/RELEASING.md`](docs/RELEASING.md) for the one-time EAS setup.

---

## 🗺 Roadmap

Deferred from v1, added if needed: Books & Games, cloud sync across devices, badges, custom
collections, activity charts, a real music API.

---

## 📄 License

MIT — see [LICENSE](LICENSE).
