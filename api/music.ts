import { fetchRetry } from './http';
import type { SearchResult } from './types';

// Song search across two free, no-key catalogs. Results merged, iTunes first,
// deduped by normalized title+artist. One source failing is non-fatal.

function itunesTrack(r: any): SearchResult {
  return {
    key: `itunes-${r.trackId}`,
    category: 'song',
    source: 'manual', // schema sources are tmdb/jikan/manual; song catalogs count as manual entries
    sourceId: `itunes-${r.trackId}`,
    title: r.trackName,
    imageUrl: r.artworkUrl100 ? String(r.artworkUrl100).replace('100x100', '600x600') : null,
    year: r.releaseDate ? Number(String(r.releaseDate).slice(0, 4)) : null,
    catalogRating: null,
    metadata: JSON.stringify({
      artist: r.artistName,
      runtime: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 60000) : undefined,
      albumId: r.collectionId ? `itunes-${r.collectionId}` : undefined,
      albumName: r.collectionName ?? undefined,
    }),
  };
}

function deezerTrack(r: any): SearchResult {
  return {
    key: `deezer-${r.id}`,
    category: 'song',
    source: 'manual',
    sourceId: `deezer-${r.id}`,
    title: r.title,
    imageUrl: r.album?.cover_big ?? r.album?.cover_medium ?? null,
    year: null,
    catalogRating: null,
    metadata: JSON.stringify({
      artist: r.artist?.name,
      runtime: r.duration ? Math.round(r.duration / 60) : undefined,
      albumId: r.album?.id ? `deezer-${r.album.id}` : undefined,
      albumName: r.album?.title ?? undefined,
    }),
  };
}

async function searchItunes(query: string): Promise<SearchResult[]> {
  const res = await fetchRetry(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`
  );
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const data = await res.json();
  return ((data.results ?? []) as any[]).map(itunesTrack);
}

async function searchDeezer(query: string): Promise<SearchResult[]> {
  const res = await fetchRetry(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=25`);
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  const data = await res.json();
  return ((data.data ?? []) as any[]).map(deezerTrack);
}

const normKey = (r: SearchResult) => {
  const artist = (() => {
    try {
      return JSON.parse(r.metadata ?? '{}').artist ?? '';
    } catch {
      return '';
    }
  })();
  return `${r.title}::${artist}`.toLowerCase().replace(/[^a-z0-9:]/g, '');
};

export async function searchSongs(query: string): Promise<SearchResult[]> {
  const [itunes, deezer] = await Promise.allSettled([searchItunes(query), searchDeezer(query)]);
  const a = itunes.status === 'fulfilled' ? itunes.value : [];
  const b = deezer.status === 'fulfilled' ? deezer.value : [];
  if (itunes.status === 'rejected' && deezer.status === 'rejected') throw new Error('Song search failed');
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of [...a, ...b]) {
    const k = normKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(r);
  }
  return merged;
}

// Best-guess soundtrack album for a movie title: search songs by title, pick the
// album that the most matching tracks belong to. Text match only (no movie id),
// so it's "best match", not guaranteed. Returns the album id or null.
export async function findSoundtrackAlbumId(movieTitle: string): Promise<string | null> {
  try {
    const results = await searchSongs(movieTitle);
    const tally = new Map<string, { name: string; count: number }>();
    for (const r of results) {
      const meta = JSON.parse(r.metadata ?? '{}');
      if (!meta.albumId) continue;
      const cur = tally.get(meta.albumId) ?? { name: meta.albumName ?? '', count: 0 };
      cur.count += 1;
      tally.set(meta.albumId, cur);
    }
    if (tally.size === 0) return null;
    // Prefer the album whose name best matches the movie title, then by track count.
    const lc = movieTitle.toLowerCase();
    const ranked = [...tally.entries()].sort((a, b) => {
      const am = a[1].name.toLowerCase().includes(lc) ? 1 : 0;
      const bm = b[1].name.toLowerCase().includes(lc) ? 1 : 0;
      return bm - am || b[1].count - a[1].count;
    });
    return ranked[0][0];
  } catch {
    return null;
  }
}

export type Album = {
  albumId: string;
  name: string;
  artist: string;
  cover: string | null;
  year: number | null;
  tracks: SearchResult[];
};

// Full album/soundtrack by album id ("itunes-<id>" | "deezer-<id>").
export async function fetchAlbum(albumId: string): Promise<Album | null> {
  const [prefix, id] = [albumId.slice(0, albumId.indexOf('-')), albumId.slice(albumId.indexOf('-') + 1)];
  try {
    if (prefix === 'itunes') {
      const res = await fetchRetry(`https://itunes.apple.com/lookup?id=${id}&entity=song&limit=200`);
      if (!res.ok) throw new Error(`iTunes ${res.status}`);
      const data = await res.json();
      const results = (data.results ?? []) as any[];
      const collection = results.find((r) => r.wrapperType === 'collection');
      const tracks = results.filter((r) => r.wrapperType === 'track').map(itunesTrack);
      if (tracks.length === 0) return null;
      return {
        albumId,
        name:
          collection?.collectionName ??
          (tracks[0] ? JSON.parse(tracks[0].metadata!).albumName : null) ??
          'Album',
        artist: collection?.artistName ?? '',
        cover: collection?.artworkUrl100 ? String(collection.artworkUrl100).replace('100x100', '600x600') : tracks[0]?.imageUrl ?? null,
        year: collection?.releaseDate ? Number(String(collection.releaseDate).slice(0, 4)) : null,
        tracks,
      };
    }
    // deezer
    const res = await fetchRetry(`https://api.deezer.com/album/${id}`);
    if (!res.ok) throw new Error(`Deezer ${res.status}`);
    const data = await res.json();
    const tracks = ((data.tracks?.data ?? []) as any[]).map((t) =>
      deezerTrack({ ...t, album: { id: data.id, title: data.title, cover_big: data.cover_big } })
    );
    if (tracks.length === 0) return null;
    return {
      albumId,
      name: data.title ?? 'Album',
      artist: data.artist?.name ?? '',
      cover: data.cover_big ?? data.cover_medium ?? null,
      year: data.release_date ? Number(String(data.release_date).slice(0, 4)) : null,
      tracks,
    };
  } catch (e) {
    console.error('fetchAlbum failed:', e);
    return null;
  }
}
