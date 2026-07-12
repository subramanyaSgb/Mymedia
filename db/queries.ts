import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './client';
import {
  items,
  cast,
  crew,
  itemCredits,
  series,
  itemSeries,
  type Category,
  type Item,
  type Metadata,
  type NewItem,
  type Progress,
  type Status,
  type Cast,
  type Crew,
} from './schema';

// --- JSON column helpers (the non-trivial logic worth testing) ---

export function parseMetadata(raw: string | null | undefined): Metadata {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Metadata;
  } catch {
    return {};
  }
}

export function parseProgress(raw: string | null | undefined): Progress {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Progress;
  } catch {
    return {};
  }
}

// --- Writes ---

export async function addItem(item: NewItem): Promise<number> {
  const [row] = await db.insert(items).values(item).returning({ id: items.id });
  return row.id;
}

export async function updateItem(id: number, patch: Partial<NewItem>): Promise<void> {
  await db
    .update(items)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(items.id, id));
}

export async function setStatus(id: number, status: Status): Promise<void> {
  await updateItem(id, { status });
}

export async function toggleFavorite(id: number, favorite: boolean): Promise<void> {
  await updateItem(id, { favorite });
}

export async function deleteItem(id: number): Promise<void> {
  await db.delete(items).where(eq(items.id, id));
}

// Remove a catalog item from the library by its source + sourceId (used from search).
export async function deleteBySource(source: string, sourceId: string): Promise<void> {
  await db
    .delete(items)
    .where(and(eq(items.source, source as any), eq(items.sourceId, sourceId)));
}

// --- Read query builders (pass to useLiveQuery in components) ---

export const q = {
  byId: (id: number) => db.select().from(items).where(eq(items.id, id)),
  all: () => db.select().from(items).orderBy(desc(items.updatedAt)),
  // Just the source ids in the library — used to mark search results as already added.
  sourceIds: () => db.select({ source: items.source, sourceId: items.sourceId }).from(items),
  byCategory: (category: Category) =>
    db.select().from(items).where(eq(items.category, category)).orderBy(desc(items.updatedAt)),
  byStatus: (status: Status) =>
    db.select().from(items).where(eq(items.status, status)).orderBy(desc(items.updatedAt)),
  favorites: () =>
    db.select().from(items).where(eq(items.favorite, true)).orderBy(desc(items.updatedAt)),
  recentlyAdded: (limit = 10) =>
    db.select().from(items).orderBy(desc(items.addedAt)).limit(limit),
  continueWatching: () =>
    db.select().from(items).where(eq(items.status, 'watching')).orderBy(desc(items.updatedAt)),
  castForItem: (itemId: number) =>
    db
      .select({
        id: cast.id,
        name: cast.name,
        profileImage: cast.profileImage,
        character: itemCredits.character,
      })
      .from(cast)
      .innerJoin(itemCredits, and(eq(itemCredits.creditId, cast.id), eq(itemCredits.creditType, 'cast')))
      .where(eq(itemCredits.itemId, itemId)),
  crewForItem: (itemId: number, role: 'director' | 'writer' | 'producer' | 'cinematographer' | 'composer') =>
    db
      .select({
        id: crew.id,
        name: crew.name,
        profileImage: crew.profileImage,
      })
      .from(crew)
      .innerJoin(itemCredits, and(eq(itemCredits.creditId, crew.id), eq(itemCredits.creditType, role === 'director' ? 'director' : role === 'writer' ? 'writer' : 'director')))
      .where(and(eq(itemCredits.itemId, itemId), eq(crew.role, role))),
  filmographyForPerson: (tmdbPersonId: number) =>
    db
      .select({
        itemId: items.id,
        title: items.title,
        imageUrl: items.imageUrl,
        category: items.category,
        year: items.year,
      })
      .from(items)
      .innerJoin(itemCredits, eq(itemCredits.itemId, items.id))
      .innerJoin(cast, and(eq(cast.id, itemCredits.creditId), eq(itemCredits.creditType, 'cast'), eq(cast.tmdbPersonId, tmdbPersonId)))
      .orderBy(desc(items.year)),
  seriesItems: (seriesId: number) =>
    db
      .select({
        id: items.id,
        title: items.title,
        imageUrl: items.imageUrl,
        category: items.category,
        year: items.year,
        seasonNumber: itemSeries.seasonNumber,
        episodeNumber: itemSeries.episodeNumber,
      })
      .from(itemSeries)
      .innerJoin(items, eq(itemSeries.itemId, items.id))
      .where(eq(itemSeries.seriesId, seriesId))
      .orderBy(itemSeries.seasonNumber, itemSeries.episodeNumber),
  seriesForItem: (itemId: number) =>
    db
      .select({ seriesId: itemSeries.seriesId })
      .from(itemSeries)
      .where(eq(itemSeries.itemId, itemId))
      .limit(1),
};

// --- Stats (computed on read, no stats table) ---

export type Stats = {
  totalItems: number;
  itemsWatched: number; // finished
  hoursLogged: number; // SUM(metadata.runtime) over finished, in hours
  daysTracked: number; // distinct calendar days with an addedAt
};

// runtime lives inside the metadata JSON; SQLite json_extract reads it directly.
const runtimeExpr = sql<number>`COALESCE(json_extract(${items.metadata}, '$.runtime'), 0)`;

export async function getStats(): Promise<Stats> {
  const [row] = await db
    .select({
      totalItems: sql<number>`COUNT(*)`,
      itemsWatched: sql<number>`SUM(CASE WHEN ${items.status} = 'finished' THEN 1 ELSE 0 END)`,
      finishedRuntime: sql<number>`SUM(CASE WHEN ${items.status} = 'finished' THEN ${runtimeExpr} ELSE 0 END)`,
      daysTracked: sql<number>`COUNT(DISTINCT date(${items.addedAt} / 1000, 'unixepoch'))`,
    })
    .from(items);

  return {
    totalItems: row?.totalItems ?? 0,
    itemsWatched: row?.itemsWatched ?? 0,
    hoursLogged: Math.round(((row?.finishedRuntime ?? 0) / 60) * 10) / 10,
    daysTracked: row?.daysTracked ?? 0,
  };
}

export async function getCategoryCounts(): Promise<Record<Category, number>> {
  const rows = await db
    .select({ category: items.category, count: sql<number>`COUNT(*)` })
    .from(items)
    .groupBy(items.category);
  const out: Record<Category, number> = { movie: 0, series: 0, anime: 0, song: 0, book: 0 };
  for (const r of rows) out[r.category] = r.count;
  return out;
}

// Series recommendations: get all items in same series
export async function getSeriesItems(seriesId: number): Promise<Item[]> {
  return db
    .select({ item: items })
    .from(itemSeries)
    .innerJoin(items, eq(itemSeries.itemId, items.id))
    .where(eq(itemSeries.seriesId, seriesId))
    .then((rows) => rows.map((r) => r.item));
}

// Watch history by date (last 30 days)
export async function getWatchHistoryByDate(): Promise<Array<{ date: string; count: number }>> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();
  const rows = await db
    .select({
      date: sql<string>`date(${items.addedAt} / 1000, 'unixepoch')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(items)
    .where(sql`${items.addedAt} > ${thirtyDaysAgo}`)
    .groupBy(sql`date(${items.addedAt} / 1000, 'unixepoch')`)
    .orderBy(sql`date(${items.addedAt} / 1000, 'unixepoch')`);
  return rows;
}

// Genre stats: parse genres from metadata
export async function getGenreStats(): Promise<Array<{ genre: string; count: number }>> {
  const allItems = await db.select().from(items);
  const genreCounts: Record<string, number> = {};
  for (const item of allItems) {
    const meta = parseMetadata(item.metadata);
    if (meta.genres) {
      for (const g of meta.genres) {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
  }
  return Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count);
}

// Rating distribution: count items by user rating
export async function getRatingDistribution(): Promise<Array<{ rating: number; count: number }>> {
  const rows = await db
    .select({
      rating: items.userRating,
      count: sql<number>`COUNT(*)`,
    })
    .from(items)
    .where(sql`${items.userRating} IS NOT NULL`)
    .groupBy(items.userRating);
  return rows
    .map((r) => ({ rating: r.rating ?? 0, count: r.count }))
    .sort((a, b) => a.rating - b.rating);
}

export type { Item, Category, Status };
