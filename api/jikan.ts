import { fetchRetry } from './http';
import type { SearchResult } from './types';

const BASE = 'https://api.jikan.moe/v4';

export async function searchJikan(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 3) return []; // MAL requires >=3 chars
  const res = await fetchRetry(`${BASE}/anime?q=${encodeURIComponent(query)}&limit=20&sfw`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);

  const data = await res.json();
  return (data.data ?? []).map((a: any): SearchResult => ({
    key: `jikan-${a.mal_id}`,
    category: 'anime',
    source: 'jikan',
    sourceId: String(a.mal_id),
    title: a.title_english || a.title,
    imageUrl: a.images?.jpg?.image_url ?? null,
    year: a.year ?? (a.aired?.prop?.from?.year ?? null),
    catalogRating: a.score ?? null,
    metadata: JSON.stringify({
      episodes: a.episodes ?? undefined,
      overview: a.synopsis ?? undefined,
    }),
  }));
}

// Total watch time for an anime = episodes × per-episode duration (minutes).
export async function fetchJikanRuntime(malId: string): Promise<number | null> {
  try {
    const res = await fetchRetry(`${BASE}/anime/${malId}`);
    if (!res.ok) return null;
    const a = (await res.json()).data;
    const episodes: number = a?.episodes ?? 0;
    // duration string like "24 min per ep" → parse the leading number.
    const perEp = parseInt(String(a?.duration ?? '').match(/\d+/)?.[0] ?? '0', 10);
    if (!episodes || !perEp) return null;
    return episodes * perEp;
  } catch {
    return null;
  }
}
