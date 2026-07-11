import type { SearchResult } from './types';

// TMDB read access token — supply via app.json extra.tmdbToken or EXPO_PUBLIC_TMDB_TOKEN.
// ponytail: token in a mobile app is extractable; acceptable for a personal local app. Don't commit a real one.
import Constants from 'expo-constants';

const TOKEN =
  process.env.EXPO_PUBLIC_TMDB_TOKEN ||
  (Constants.expoConfig?.extra?.tmdbToken as string | undefined) ||
  '';

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

export const tmdbConfigured = () => TOKEN.length > 0;

async function tmdb(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

type Kind = 'movie' | 'series';

export async function searchTmdb(kind: Kind, query: string): Promise<SearchResult[]> {
  if (!TOKEN) throw new Error('TMDB token not set');
  const endpoint = kind === 'movie' ? 'movie' : 'tv';
  const data = await tmdb(`/search/${endpoint}?query=${encodeURIComponent(query)}`);
  return (data.results ?? []).map((r: any): SearchResult => {
    const title = kind === 'movie' ? r.title : r.name;
    const date = kind === 'movie' ? r.release_date : r.first_air_date;
    return {
      key: `tmdb-${r.id}`,
      category: kind,
      source: 'tmdb',
      sourceId: String(r.id),
      title,
      imageUrl: r.poster_path ? `${IMG}${r.poster_path}` : null,
      year: date ? Number(date.slice(0, 4)) : null,
      catalogRating: r.vote_average ?? null,
      metadata: JSON.stringify({ overview: r.overview }),
    };
  });
}
