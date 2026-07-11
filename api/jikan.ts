import type { SearchResult } from './types';

const BASE = 'https://api.jikan.moe/v4';

// Jikan is rate-limited (~3/s, 60/min). Retry once on 429 with a short backoff.
export async function searchJikan(query: string): Promise<SearchResult[]> {
  if (query.trim().length < 3) return []; // MAL requires >=3 chars
  const url = `${BASE}/anime?q=${encodeURIComponent(query)}&limit=20&sfw`;

  let res = await fetch(url);
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1200));
    res = await fetch(url);
  }
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
