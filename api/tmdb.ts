import { fetchRetry } from './http';
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

// ponytail: genre cache keyed by 'movie'|'tv', loaded on first search
const genreCache = new Map<Kind, Map<number, string>>();

export const tmdbConfigured = () => CRED.length > 0;

async function tmdb(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  const url = isJwt ? `${BASE}${path}` : `${BASE}${path}${sep}api_key=${CRED}`;
  const res = await fetchRetry(url, {
    headers: isJwt
      ? { Authorization: `Bearer ${CRED}`, accept: 'application/json' }
      : { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

type Kind = 'movie' | 'series';

async function loadGenres(kind: Kind): Promise<Map<number, string>> {
  if (genreCache.has(kind)) return genreCache.get(kind)!;
  const endpoint = kind === 'movie' ? 'movie' : 'tv';
  const data = await tmdb(`/genre/${endpoint}/list`);
  const map = new Map(data.genres.map((g: any) => [g.id, g.name]));
  genreCache.set(kind, map);
  return map;
}

export async function searchTmdb(kind: Kind, query: string): Promise<SearchResult[]> {
  if (!CRED) throw new Error('TMDB credential not set');
  const endpoint = kind === 'movie' ? 'movie' : 'tv';
  const genreMap = await loadGenres(kind);
  const data = await tmdb(`/search/${endpoint}?query=${encodeURIComponent(query)}`);
  return (data.results ?? []).map((r: any): SearchResult => {
    const title = kind === 'movie' ? r.title : r.name;
    const date = kind === 'movie' ? r.release_date : r.first_air_date;
    const genreIds = r.genre_ids ?? [];
    const genres = genreIds.map((id: number) => genreMap.get(id)).filter(Boolean);
    return {
      key: `tmdb-${r.id}`,
      category: kind,
      source: 'tmdb',
      sourceId: String(r.id),
      title,
      imageUrl: r.poster_path ? `${IMG}${r.poster_path}` : null,
      year: date ? Number(date.slice(0, 4)) : null,
      catalogRating: r.vote_average ?? null,
      metadata: JSON.stringify({ overview: r.overview, genres }),
    };
  });
}

// Total watch time (minutes). Movie = runtime; series = episodes × avg episode runtime.
export async function fetchTmdbRuntime(kind: Kind, id: string): Promise<number | null> {
  try {
    if (kind === 'movie') {
      const d = await tmdb(`/movie/${id}`);
      return d.runtime || null;
    }
    const d = await tmdb(`/tv/${id}`);
    const eps: number = d.number_of_episodes ?? 0;
    const perEp: number = d.episode_run_time?.[0] ?? 0;
    if (!eps || !perEp) return null;
    return eps * perEp;
  } catch {
    return null;
  }
}

// Fetch movie credits (cast and crew).
export async function fetchMovieCredits(movieId: string): Promise<any> {
  if (!CRED) throw new Error('TMDB credential not set');
  return tmdb(`/movie/${movieId}/credits`);
}

// Fetch series credits (cast and crew).
export async function fetchSeriesCredits(seriesId: string): Promise<any> {
  if (!CRED) throw new Error('TMDB credential not set');
  return tmdb(`/tv/${seriesId}/credits`);
}

// Fetch person details (bio, images, birthday, etc).
export async function fetchPersonDetails(personId: string): Promise<any> {
  if (!CRED) throw new Error('TMDB credential not set');
  return tmdb(`/person/${personId}`);
}

// Fetch person's filmography and credits.
export async function fetchPersonCredits(personId: string): Promise<any> {
  if (!CRED) throw new Error('TMDB credential not set');
  return tmdb(`/person/${personId}/combined_credits`);
}

// Fetch trending movies (today, this week, etc).
export async function fetchTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<any> {
  if (!CRED) throw new Error('TMDB credential not set');
  return tmdb(`/trending/movie/${timeWindow}`);
}
