import { db } from '@/db/client';
import {
  cast,
  crew,
  itemCredits,
  series,
  itemSeries,
  type NewCast,
  type NewCrew,
  type NewItemCredit,
  type NewSeries,
  type NewItemSeries,
  type Category,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchRetry } from './http';
import Constants from 'expo-constants';

const CRED =
  process.env.EXPO_PUBLIC_TMDB_TOKEN ||
  (Constants.expoConfig?.extra?.tmdbToken as string | undefined) ||
  '';

const isJwt = CRED.startsWith('eyJ');
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';

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

/**
 * Sync cast, crew, and credits for an item from TMDB.
 * Handles tmdbPersonId deduplication across cast/crew tables.
 */
export async function syncItemCredits(
  itemId: number,
  sourceId: string,
  category: Category
): Promise<void> {
  if (category === 'anime') return; // Jikan handles anime
  if (!CRED) throw new Error('TMDB credential not set');
  if (!sourceId) return;

  try {
    const endpoint = category === 'movie' ? 'movie' : 'tv';
    const data = await tmdb(`/${endpoint}/${sourceId}/credits`);

    // Clear existing credits for this item
    await db.delete(itemCredits).where(eq(itemCredits.itemId, itemId));

    // Sync cast (actors)
    const castMembers = (data.cast ?? []) as any[];
    for (const actor of castMembers) {
      if (!actor.id) continue;

      const tmdbPersonId = actor.id;
      let castId: number;

      // Check if this tmdbPersonId already exists
      const existing = await db.query.cast.findFirst({
        where: eq(cast.tmdbPersonId, tmdbPersonId),
      });

      if (existing) {
        castId = existing.id;
      } else {
        // Insert new cast member
        const newCast: NewCast = {
          name: actor.name,
          profileImage: actor.profile_path ? `${IMG}${actor.profile_path}` : null,
          tmdbPersonId,
        };
        const [inserted] = await db.insert(cast).values(newCast).returning({ id: cast.id });
        castId = inserted.id;
      }

      // Link to item
      const credit: NewItemCredit = {
        itemId,
        creditType: 'cast',
        creditId: castId,
        character: actor.character || null,
      };
      await db.insert(itemCredits).values(credit);
    }

    // Sync crew (directors, writers, producers, etc.)
    const crewMembers = (data.crew ?? []) as any[];
    for (const member of crewMembers) {
      if (!member.id) continue;

      const roleMap: Record<string, 'director' | 'writer' | 'producer' | 'cinematographer' | 'composer'> = {
        Director: 'director',
        Writer: 'writer',
        Producer: 'producer',
        Cinematography: 'cinematographer',
        Music: 'composer',
      };

      const role = roleMap[member.job];
      if (!role) continue; // Skip unsupported roles

      const tmdbPersonId = member.id;
      let crewId: number;

      // Check if this tmdbPersonId already exists in crew
      const existing = await db.query.crew.findFirst({
        where: eq(crew.tmdbPersonId, tmdbPersonId),
      });

      if (existing) {
        crewId = existing.id;
      } else {
        // Insert new crew member
        const newCrew: NewCrew = {
          name: member.name,
          profileImage: member.profile_path ? `${IMG}${member.profile_path}` : null,
          tmdbPersonId,
          role,
        };
        const [inserted] = await db.insert(crew).values(newCrew).returning({ id: crew.id });
        crewId = inserted.id;
      }

      // Link to item
      const credit: NewItemCredit = {
        itemId,
        creditType: role === 'director' ? 'director' : 'writer',
        creditId: crewId,
      };
      await db.insert(itemCredits).values(credit);
    }
  } catch (e) {
    console.error('Error syncing credits:', e);
  }
}

/**
 * Sync series metadata and episode structure from TMDB.
 * Creates series entry and itemSeries records for season/episode tracking.
 */
export async function syncSeriesData(itemId: number, sourceId: string): Promise<void> {
  if (!CRED) throw new Error('TMDB credential not set');
  if (!sourceId) return;

  try {
    const data = await tmdb(`/tv/${sourceId}`);
    const tmdbSeriesId = data.id;

    // Check if series already exists
    let seriesId: number;
    const existingSeries = await db.query.series.findFirst({
      where: eq(series.tmdbSeriesId, tmdbSeriesId),
    });

    if (existingSeries) {
      seriesId = existingSeries.id;
    } else {
      // Create new series entry
      const newSeries: NewSeries = {
        name: data.name,
        tmdbSeriesId,
        totalSeasons: data.number_of_seasons || null,
        description: data.overview || null,
      };
      const [inserted] = await db.insert(series).values(newSeries).returning({ id: series.id });
      seriesId = inserted.id;
    }

    // Clear existing itemSeries entries for this item
    await db.delete(itemSeries).where(eq(itemSeries.itemId, itemId));

    // Sync seasons and episodes
    const seasons = (data.seasons ?? []) as any[];
    for (const season of seasons) {
      const seasonNum = season.season_number;
      if (seasonNum === null || seasonNum === undefined) continue;

      // For each season, create one itemSeries entry per episode
      const episodeCount = season.episode_count || 0;
      for (let ep = 1; ep <= episodeCount; ep++) {
        const itemSeriesEntry: NewItemSeries = {
          itemId,
          seriesId,
          seasonNumber: seasonNum,
          episodeNumber: ep,
        };
        await db.insert(itemSeries).values(itemSeriesEntry);
      }
    }
  } catch (e) {
    console.error('Error syncing series:', e);
  }
}
