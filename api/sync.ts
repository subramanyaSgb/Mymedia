import { db } from '@/db/client';
import {
  cast,
  crew,
  itemCredits,
  items,
  type NewCast,
  type NewCrew,
  type Category,
} from '@/db/schema';
import { parseMetadata } from '@/db/queries';
import { and, eq } from 'drizzle-orm';
import { fetchMovieDetails, fetchTvDetails, tmdb, tmdbConfigured } from './tmdb';

const IMG = 'https://image.tmdb.org/t/p/w342';

const CREW_ROLES: Record<string, 'director' | 'writer' | 'producer' | 'cinematographer' | 'composer'> = {
  Director: 'director',
  Writer: 'writer',
  Screenplay: 'writer',
  Producer: 'producer',
  'Director of Photography': 'cinematographer',
  'Original Music Composer': 'composer',
};

async function upsertPerson(
  table: any, // cast or crew table — same person columns
  person: { id: number; name: string; profile_path?: string | null },
  role?: NewCrew['role']
): Promise<number> {
  const [existing] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.tmdbPersonId, person.id))
    .limit(1);
  if (existing) return existing.id;
  const values: NewCast | NewCrew = {
    name: person.name,
    profileImage: person.profile_path ? `${IMG}${person.profile_path}` : null,
    tmdbPersonId: person.id,
    ...(role ? { role } : {}),
  } as NewCrew;
  const [inserted] = await db.insert(table).values(values).returning({ id: table.id });
  return inserted.id;
}

/** Sync cast + crew for a TMDB item into local tables. Safe to re-run (clears first). */
export async function syncItemCredits(itemId: number, sourceId: string, category: Category): Promise<void> {
  if (!tmdbConfigured() || !sourceId) return;
  if (category !== 'movie' && category !== 'series') return; // Jikan has no TMDB credits

  try {
    const endpoint = category === 'movie' ? 'movie' : 'tv';
    const data = await tmdb(`/${endpoint}/${sourceId}/credits`);

    await db.delete(itemCredits).where(eq(itemCredits.itemId, itemId));

    for (const actor of ((data.cast ?? []) as any[]).slice(0, 20)) {
      if (!actor.id) continue;
      const castId = await upsertPerson(cast, actor);
      await db.insert(itemCredits).values({
        itemId,
        creditType: 'cast',
        creditId: castId,
        character: actor.character || null,
      });
    }

    const seenCrew = new Set<number>();
    for (const member of (data.crew ?? []) as any[]) {
      const role = CREW_ROLES[member.job];
      if (!role || !member.id || seenCrew.has(member.id)) continue;
      seenCrew.add(member.id);
      const crewId = await upsertPerson(crew, member, role);
      await db.insert(itemCredits).values({ itemId, creditType: 'crew', creditId: crewId });
    }
  } catch (e) {
    console.error('syncItemCredits failed:', e);
  }
}

/**
 * Sync detail metadata: runtime + genres always; for movies also the TMDB
 * collection ("same series"), for TV the season/episode counts.
 */
export async function syncItemDetails(itemId: number, sourceId: string, category: Category): Promise<void> {
  if (!tmdbConfigured() || !sourceId) return;
  if (category !== 'movie' && category !== 'series') return;

  try {
    const [row] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!row) return;
    const meta = parseMetadata(row.metadata);

    if (category === 'movie') {
      const d = await fetchMovieDetails(sourceId);
      meta.runtime = d.runtime || meta.runtime;
      meta.genres = d.genres?.map((g: any) => g.name) ?? meta.genres;
      meta.overview = d.overview || meta.overview;
      meta.originalLanguage = d.original_language ?? meta.originalLanguage;
      meta.releaseDate = d.release_date ?? meta.releaseDate;
      if (d.belongs_to_collection) {
        meta.collectionId = d.belongs_to_collection.id;
        meta.collectionName = d.belongs_to_collection.name;
      }
    } else {
      const d = await fetchTvDetails(sourceId);
      meta.seasons = d.number_of_seasons ?? meta.seasons;
      meta.episodes = d.number_of_episodes ?? meta.episodes;
      meta.genres = d.genres?.map((g: any) => g.name) ?? meta.genres;
      meta.overview = d.overview || meta.overview;
      meta.originalLanguage = d.original_language ?? meta.originalLanguage;
      const perEp = d.episode_run_time?.[0] ?? 0;
      if (!meta.runtime && perEp && d.number_of_episodes) meta.runtime = perEp * d.number_of_episodes;
    }

    await db.update(items).set({ metadata: JSON.stringify(meta) }).where(eq(items.id, itemId));
  } catch (e) {
    console.error('syncItemDetails failed:', e);
  }
}

/** Fire-and-forget full sync after adding a TMDB item. */
export function syncItemData(itemId: number, sourceId: string | null | undefined, category: Category): void {
  if (!sourceId) return;
  void syncItemCredits(itemId, sourceId, category);
  void syncItemDetails(itemId, sourceId, category);
}
