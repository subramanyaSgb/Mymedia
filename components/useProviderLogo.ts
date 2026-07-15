import { fetchWatchProviders, tmdbConfigured } from '@/api/tmdb';
import type { Item } from '@/db/schema';
import { useEffect, useState } from 'react';

// Session cache of the top streaming-provider logo for a tmdb video item.
// '' = fetched, none available; undefined = not fetched yet.
const cache = new Map<string, string>();

// Returns the primary "stream" provider logo URL for a library item, or null.
// Only fetches for tmdb movies/series; songs/books/games/manual return null.
export function useProviderLogo(item: Pick<Item, 'category' | 'source' | 'sourceId'>): string | null {
  const eligible =
    item.source === 'tmdb' && !!item.sourceId && (item.category === 'movie' || item.category === 'series');
  const key = eligible ? `${item.category}-${item.sourceId}` : '';
  const [logo, setLogo] = useState<string | null>(key && cache.has(key) ? cache.get(key)! || null : null);

  useEffect(() => {
    if (!eligible || !tmdbConfigured() || cache.has(key)) return;
    let cancelled = false;
    fetchWatchProviders(item.category === 'movie' ? 'movie' : 'series', item.sourceId!)
      .then((r) => {
        const first = r.providers.find((p) => p.kind === 'stream' && p.logo)?.logo ?? '';
        cache.set(key, first);
        if (!cancelled) setLogo(first || null);
      })
      .catch(() => cache.set(key, ''));
    return () => {
      cancelled = true;
    };
  }, [key, eligible]);

  return logo;
}
