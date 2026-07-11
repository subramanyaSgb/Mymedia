import type { SearchResult } from './types';

// TMDB credential — either a v4 Read Access Token (JWT, starts "eyJ") or a v3 API key (32-char hex).
// Supply via EXPO_PUBLIC_TMDB_TOKEN / app.json extra.tmdbToken.
// ponytail: credential in a mobile app is extractable; acceptable for a personal local app.
import Constants from 'expo-constants';

const CRED =
  process.env.EXPO_PUBLIC_TMDB_TOKEN ||
  (Constants.expoConfig?.extra?.tmdbToken as string | undefined) ||
  '';

// A JWT read-token uses Bearer auth; a plain API key goes in the ?api_key= query param.
const isJwt = CRED.startsWith('eyJ');

const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

export const tmdbConfigured = () => CRED.length > 0;

async function tmdb(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  const url = isJwt ? `${BASE}${path}` : `${BASE}${path}${sep}api_key=${CRED}`;
  const res = await fetch(url, {
    headers: isJwt
      ? { Authorization: `Bearer ${CRED}`, accept: 'application/json' }
      : { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

type Kind = 'movie' | 'series';

export async function searchTmdb(kind: Kind, query: string): Promise<SearchResult[]> {
  if (!CRED) throw new Error('TMDB credential not set');
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
