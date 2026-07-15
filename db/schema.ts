import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

// Single table for every tracked title. Built-in lists (Favorites/Want/Watching/Finished)
// are queries over this table, not separate tables. See plan for the metadata-as-JSON tradeoff.
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category', { enum: ['movie', 'series', 'anime', 'song', 'book', 'game'] }).notNull(),
  source: text('source', { enum: ['tmdb', 'jikan', 'manual'] }).notNull(),
  sourceId: text('source_id'), // external id; null for manual
  title: text('title').notNull(),
  imageUrl: text('image_url'),
  year: integer('year'),
  catalogRating: real('catalog_rating'),
  metadata: text('metadata'), // JSON: runtime/seasons/director/artist/etc
  status: text('status', { enum: ['want', 'watching', 'finished'] })
    .notNull()
    .default('want'),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
  progress: text('progress'), // JSON: {season,episode,percent} or null
  userRating: real('user_rating'),
  notes: text('notes'),
  addedAt: integer('added_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export type Category = Item['category'];
export type Status = Item['status'];

// Parsed shapes for the JSON columns.
export type Progress = { season?: number; episode?: number; percent?: number };
export type Metadata = {
  runtime?: number; // minutes — used for Hours Logged
  seasons?: number;
  episodes?: number;
  director?: string;
  artist?: string; // songs
  albumId?: string; // song's album/soundtrack — "itunes-<collectionId>" | "deezer-<albumId>"
  albumName?: string;
  creator?: string; // books/games — author/studio
  overview?: string;
  genres?: string[];
  originalLanguage?: string; // ISO 639-1 (te/ta/hi/en/ja/…)
  releaseDate?: string; // YYYY-MM-DD — used by the For You feed
  collectionId?: number; // TMDB collection ("same series" for movies)
  collectionName?: string;
};

// Cast members table
export const cast = sqliteTable(
  'cast',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    profileImage: text('profile_image'),
    tmdbPersonId: integer('tmdb_person_id'),
    bio: text('bio'),
    birthDate: text('birth_date'), // YYYY-MM-DD
  },
  (table) => ({
    tmdbPersonIdUnique: unique('cast_tmdb_person_id_unique').on(table.tmdbPersonId),
  })
);

export type Cast = typeof cast.$inferSelect;
export type NewCast = typeof cast.$inferInsert;

// Crew members table
export const crew = sqliteTable(
  'crew',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    profileImage: text('profile_image'),
    tmdbPersonId: integer('tmdb_person_id'),
    role: text('role', { enum: ['director', 'writer', 'producer', 'cinematographer', 'composer'] }).notNull(),
    bio: text('bio'),
    birthDate: text('birth_date'), // YYYY-MM-DD
  },
  (table) => ({
    tmdbPersonIdUnique: unique('crew_tmdb_person_id_unique').on(table.tmdbPersonId),
  })
);

export type Crew = typeof crew.$inferSelect;
export type NewCrew = typeof crew.$inferInsert;

// Item credits (associates cast/crew with items)
export const itemCredits = sqliteTable(
  'item_credits',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    creditType: text('credit_type', { enum: ['cast', 'crew'] }).notNull(),
    creditId: integer('credit_id').notNull(), // FK to cast.id or crew.id depending on creditType
    character: text('character'), // role name for cast
  }
);

export type ItemCredit = typeof itemCredits.$inferSelect;
export type NewItemCredit = typeof itemCredits.$inferInsert;

// Series/show metadata table
export const series = sqliteTable(
  'series',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    tmdbSeriesId: integer('tmdb_series_id'),
    totalSeasons: integer('total_seasons'),
    description: text('description'),
  },
  (table) => ({
    tmdbSeriesIdUnique: unique('series_tmdb_series_id_unique').on(table.tmdbSeriesId),
  })
);

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;

// Item-Series mapping (for episodes in seasons)
export const itemSeries = sqliteTable(
  'item_series',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    seriesId: integer('series_id')
      .notNull()
      .references(() => series.id, { onDelete: 'cascade' }),
    seasonNumber: integer('season_number').notNull(),
    episodeNumber: integer('episode_number').notNull(),
  }
);

export type ItemSeries = typeof itemSeries.$inferSelect;
export type NewItemSeries = typeof itemSeries.$inferInsert;

// User-created collections ("Christopher Nolan", "90s Classics", …)
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Collection = typeof collections.$inferSelect;

export const collectionItems = sqliteTable(
  'collection_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    itemId: integer('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pairUnique: unique('collection_items_pair_unique').on(table.collectionId, table.itemId),
  })
);

// Tiny key-value store (onboarding flag etc.)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
