import { fetchRetry } from './http';
import type { SearchResult } from './types';

// Game search: Steam store search (free, no key) + Epic Games Store GraphQL
// (unofficial, best-effort). Merged, Steam first, deduped by normalized title.

async function searchSteam(query: string): Promise<SearchResult[]> {
  const res = await fetchRetry(
    `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=IN&l=english`
  );
  if (!res.ok) throw new Error(`Steam ${res.status}`);
  const data = await res.json();
  return ((data.items ?? []) as any[]).map(
    (r): SearchResult => ({
      key: `steam-${r.id}`,
      category: 'game',
      source: 'manual',
      sourceId: `steam-${r.id}`,
      title: r.name,
      imageUrl: r.tiny_image ?? null,
      year: null,
      catalogRating: r.metascore ? Number(r.metascore) / 10 : null,
      metadata: JSON.stringify({ creator: 'Steam' }),
    })
  );
}

async function searchEpic(query: string): Promise<SearchResult[]> {
  // ponytail: unofficial Epic storefront GraphQL; treated as best-effort — Steam carries the search if this breaks.
  const gql = {
    query: `query searchStoreQuery($keywords: String, $country: String!, $locale: String) {
      Catalog { searchStore(keywords: $keywords, country: $country, locale: $locale, count: 20, category: "games/edition/base") {
        elements { id title keyImages { type url } releaseDate }
      } }
    }`,
    variables: { keywords: query, country: 'IN', locale: 'en-US' },
  };
  const res = await fetchRetry('https://launcher.store.epicgames.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(gql),
  });
  if (!res.ok) throw new Error(`Epic ${res.status}`);
  const data = await res.json();
  const elements = data?.data?.Catalog?.searchStore?.elements ?? [];
  return (elements as any[]).map((r): SearchResult => {
    const img =
      r.keyImages?.find((k: any) => k.type === 'OfferImageTall')?.url ??
      r.keyImages?.[0]?.url ??
      null;
    return {
      key: `epic-${r.id}`,
      category: 'game',
      source: 'manual',
      sourceId: `epic-${r.id}`,
      title: r.title,
      imageUrl: img,
      year: r.releaseDate ? Number(String(r.releaseDate).slice(0, 4)) : null,
      catalogRating: null,
      metadata: JSON.stringify({ creator: 'Epic Games' }),
    };
  });
}

export async function searchGames(query: string): Promise<SearchResult[]> {
  const [steam, epic] = await Promise.allSettled([searchSteam(query), searchEpic(query)]);
  const a = steam.status === 'fulfilled' ? steam.value : [];
  const b = epic.status === 'fulfilled' ? epic.value : [];
  if (steam.status === 'rejected' && epic.status === 'rejected') throw new Error('Game search failed');
  const seen = new Set<string>();
  const merged: SearchResult[] = [];
  for (const r of [...a, ...b]) {
    const k = r.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(r);
  }
  return merged;
}
