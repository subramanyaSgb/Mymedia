import { fetchRetry } from './http';
import type { SearchResult } from './types';

// Song search across two free, no-key catalogs. Results merged, iTunes first,
// deduped by normalized title+artist. One source failing is non-fatal.

async function searchItunes(query: string): Promise<SearchResult[]> {
  const res = await fetchRetry(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`
  );
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const data = await res.json();
  return ((data.results ?? []) as any[]).map(
    (r): SearchResult => ({
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
      }),
    })
  );
}

async function searchDeezer(query: string): Promise<SearchResult[]> {
  const res = await fetchRetry(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=25`);
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  const data = await res.json();
  return ((data.data ?? []) as any[]).map(
    (r): SearchResult => ({
      key: `deezer-${r.id}`,
      category: 'song',
      source: 'manual',
      sourceId: `deezer-${r.id}`,
      title: r.title,
      imageUrl: r.album?.cover_big ?? null,
      year: null,
      catalogRating: null,
      metadata: JSON.stringify({
        artist: r.artist?.name,
        runtime: r.duration ? Math.round(r.duration / 60) : undefined,
      }),
    })
  );
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
