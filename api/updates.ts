import * as Application from 'expo-application';

// Set these to your repo once created.
export const GITHUB_OWNER = 'subramanyaSgb';
export const GITHUB_REPO = 'Mymedia';
export const RELEASES_PAGE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export const currentVersion = Application.nativeApplicationVersion ?? '0.0.0';

export type UpdateInfo = {
  available: boolean;
  latest: string;
  current: string;
  apkUrl: string | null;
  pageUrl: string;
};

// Compare dotted versions: returns true if `a` > `b`.
export function isNewer(a: string, b: string): boolean {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0;
  }
  return false;
}

// Checks GitHub Releases for a newer version and the APK asset to download.
export async function checkForUpdate(): Promise<UpdateInfo> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
    { headers: { accept: 'application/vnd.github+json' } }
  );
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const data = await res.json();
  const latest: string = (data.tag_name ?? '0.0.0').replace(/^v/, '');
  const apk = (data.assets ?? []).find((a: any) => a.name?.endsWith('.apk'));
  return {
    available: isNewer(latest, currentVersion),
    latest,
    current: currentVersion,
    apkUrl: apk?.browser_download_url ?? null,
    pageUrl: RELEASES_PAGE,
  };
}
