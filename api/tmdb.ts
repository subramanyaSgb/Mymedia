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

export async function tmdb(path: string) {
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
  const map = new Map<number, string>(data.genres.map((g: any) => [g.id, g.name] as [number, string]));
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
      metadata: JSON.stringify({ overview: r.overview, genres, originalLanguage: r.original_language }),
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

// Full movie details (runtime, genres, belongs_to_collection).
export async function fetchMovieDetails(movieId: string): Promise<any> {
  return tmdb(`/movie/${movieId}`);
}

// Full TV details (seasons, episodes, genres).
export async function fetchTvDetails(tvId: string): Promise<any> {
  return tmdb(`/tv/${tvId}`);
}

// A movie collection ("same series"): { name, parts: [...] }.
export async function fetchCollection(collectionId: number): Promise<any> {
  return tmdb(`/collection/${collectionId}`);
}

// Related shows for a TV series.
export async function fetchTvRecommendations(tvId: string): Promise<any> {
  return tmdb(`/tv/${tvId}/recommendations`);
}

// YouTube trailers/teasers for an item. Returns [{key, name, type}] best-first.
export async function fetchVideos(kind: Kind, id: string): Promise<{ key: string; name: string; type: string }[]> {
  const endpoint = kind === 'movie' ? 'movie' : 'tv';
  const data = await tmdb(`/${endpoint}/${id}/videos`);
  return ((data.results ?? []) as any[])
    .filter((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    .sort((a, b) => (a.type === 'Trailer' ? -1 : 1) - (b.type === 'Trailer' ? -1 : 1) || (b.official ? 1 : 0))
    .map((v) => ({ key: v.key, name: v.name, type: v.type }));
}

// Streaming providers for India. Returns {link, providers: [{id, name, logo, kind}]}.
export async function fetchWatchProviders(
  kind: Kind,
  id: string
): Promise<{ link: string | null; providers: { id: number; name: string; logo: string | null; kind: 'stream' | 'rent' | 'buy' }[] }> {
  const endpoint = kind === 'movie' ? 'movie' : 'tv';
  const data = await tmdb(`/${endpoint}/${id}/watch/providers`);
  const region = data.results?.IN;
  if (!region) return { link: null, providers: [] };
  const seen = new Set<number>();
  const providers: { id: number; name: string; logo: string | null; kind: 'stream' | 'rent' | 'buy' }[] = [];
  const push = (list: any[] | undefined, k: 'stream' | 'rent' | 'buy') => {
    for (const p of list ?? []) {
      if (seen.has(p.provider_id)) continue;
      seen.add(p.provider_id);
      providers.push({
        id: p.provider_id,
        name: p.provider_name,
        logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null,
        kind: k,
      });
    }
  };
  push(region.flatrate, 'stream');
  push(region.rent, 'rent');
  push(region.buy, 'buy');
  return { link: region.link ?? null, providers };
}

// This fortnight's OTT releases in India (movies + tv), newest first.
export async function discoverOttReleases(language?: string): Promise<any[]> {
  const today = new Date().toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const lang = language ? `&with_original_language=${language}` : '';
  const common = `watch_region=IN&with_watch_monetization_types=flatrate${lang}`;
  const [movies, tv] = await Promise.all([
    tmdb(`/discover/movie?${common}&primary_release_date.gte=${twoWeeksAgo}&primary_release_date.lte=${today}&sort_by=primary_release_date.desc`),
    tmdb(`/discover/tv?${common}&first_air_date.gte=${twoWeeksAgo}&first_air_date.lte=${today}&sort_by=first_air_date.desc`),
  ]);
  const mapEntry = (r: any, kind: 'movie' | 'series') => ({
    kind,
    sourceId: String(r.id),
    title: kind === 'movie' ? r.title : r.name,
    imageUrl: r.poster_path ? `${IMG}${r.poster_path}` : null,
    date: kind === 'movie' ? r.release_date : r.first_air_date,
    year: (() => {
      const d = kind === 'movie' ? r.release_date : r.first_air_date;
      return d ? Number(d.slice(0, 4)) : null;
    })(),
    catalogRating: r.vote_average ?? null,
    overview: r.overview ?? '',
    language: r.original_language ?? null,
  });
  return [
    ...(movies.results ?? []).map((r: any) => mapEntry(r, 'movie')),
    ...(tv.results ?? []).map((r: any) => mapEntry(r, 'series')),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
