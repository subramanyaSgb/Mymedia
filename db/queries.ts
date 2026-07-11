import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './client';
import {
  items,
  type Category,
  type Item,
  type Metadata,
  type NewItem,
  type Progress,
  type Status,
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

// --- Read query builders (pass to useLiveQuery in components) ---

export const q = {
  byId: (id: number) => db.select().from(items).where(eq(items.id, id)),
  all: () => db.select().from(items).orderBy(desc(items.updatedAt)),
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
  const out: Record<Category, number> = { movie: 0, series: 0, anime: 0, song: 0 };
  for (const r of rows) out[r.category] = r.count;
  return out;
}

export type { Item, Category, Status };
