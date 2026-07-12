import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

// Single shared connection. enableChangeListener powers Drizzle's useLiveQuery reactivity.
export const expoDb = openDatabaseSync('mymedia.db', { enableChangeListener: true });

// Schema is created synchronously at open — hand-written DDL kept in sync with schema.ts
// (the drizzle-kit migration runner RC hook hung on device).
expoDb.execSync(`
  CREATE TABLE IF NOT EXISTS items (
    id integer PRIMARY KEY AUTOINCREMENT,
    category text NOT NULL,
    source text NOT NULL,
    source_id text,
    title text NOT NULL,
    image_url text,
    year integer,
    catalog_rating real,
    metadata text,
    status text DEFAULT 'want' NOT NULL,
    favorite integer DEFAULT false NOT NULL,
    progress text,
    user_rating real,
    notes text,
    added_at integer DEFAULT (unixepoch() * 1000) NOT NULL,
    updated_at integer DEFAULT (unixepoch() * 1000) NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "cast" (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL,
    profile_image text,
    tmdb_person_id integer,
    bio text,
    birth_date text
  );
  CREATE UNIQUE INDEX IF NOT EXISTS cast_tmdb_person_id_unique ON "cast" (tmdb_person_id);
  CREATE TABLE IF NOT EXISTS crew (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL,
    profile_image text,
    tmdb_person_id integer,
    role text NOT NULL,
    bio text,
    birth_date text
  );
  CREATE UNIQUE INDEX IF NOT EXISTS crew_tmdb_person_id_unique ON crew (tmdb_person_id);
  CREATE TABLE IF NOT EXISTS item_credits (
    id integer PRIMARY KEY AUTOINCREMENT,
    item_id integer NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    credit_type text NOT NULL,
    credit_id integer NOT NULL,
    character text
  );
  CREATE INDEX IF NOT EXISTS item_credits_item_id ON item_credits (item_id);
  CREATE TABLE IF NOT EXISTS series (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL,
    tmdb_series_id integer,
    total_seasons integer,
    description text
  );
  CREATE UNIQUE INDEX IF NOT EXISTS series_tmdb_series_id_unique ON series (tmdb_series_id);
  CREATE TABLE IF NOT EXISTS item_series (
    id integer PRIMARY KEY AUTOINCREMENT,
    item_id integer NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    series_id integer NOT NULL REFERENCES series(id) ON DELETE CASCADE,
    season_number integer NOT NULL,
    episode_number integer NOT NULL
  );
  CREATE TABLE IF NOT EXISTS collections (
    id integer PRIMARY KEY AUTOINCREMENT,
    name text NOT NULL,
    created_at integer DEFAULT (unixepoch() * 1000) NOT NULL
  );
  CREATE TABLE IF NOT EXISTS collection_items (
    id integer PRIMARY KEY AUTOINCREMENT,
    collection_id integer NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    item_id integer NOT NULL REFERENCES items(id) ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS collection_items_pair_unique ON collection_items (collection_id, item_id);
  CREATE TABLE IF NOT EXISTS settings (
    key text PRIMARY KEY,
    value text NOT NULL
  );
`);

export const db = drizzle(expoDb);
