import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Single table for every tracked title. Built-in lists (Favorites/Want/Watching/Finished)
// are queries over this table, not separate tables. See plan for the metadata-as-JSON tradeoff.
export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  category: text('category', { enum: ['movie', 'series', 'anime', 'song'] }).notNull(),
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
  overview?: string;
  genres?: string[];
};
