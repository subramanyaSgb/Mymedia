import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

// Single shared connection. enableChangeListener powers Drizzle's useLiveQuery reactivity.
export const expoDb = openDatabaseSync('mymedia.db', { enableChangeListener: true });

// Create the schema synchronously at open. One table, so we skip the drizzle-kit
// migration runner entirely (its RC hook hung on device). Keep this in sync with schema.ts.
// ponytail: hand-written CREATE for the single table; switch back to migrations if the schema grows.
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
`);

export const db = drizzle(expoDb);
