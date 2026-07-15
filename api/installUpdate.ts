import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';

// Download the release APK into the app cache with progress, then hand it to the
// Android package installer via a content:// URI. Needs REQUEST_INSTALL_PACKAGES
// (declared in app.json); the system still shows its own install confirmation.
export async function downloadAndInstall(
  apkUrl: string,
  onProgress: (pct: number) => void
): Promise<void> {
  const dest = `${FileSystem.cacheDirectory}update.apk`;
  const dl = FileSystem.createDownloadResumable(apkUrl, dest, {}, (p) => {
    if (p.totalBytesExpectedToWrite > 0) {
      onProgress(Math.round((p.totalBytesWritten / p.totalBytesExpectedToWrite) * 100));
    }
  });
  const res = await dl.downloadAsync();
  if (!res?.uri) throw new Error('Download failed');

  const contentUri = await FileSystem.getContentUriAsync(res.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    type: 'application/vnd.android.package-archive',
  });
}
