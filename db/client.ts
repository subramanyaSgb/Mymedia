import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

// Single shared connection. enableChangeListener powers Drizzle's useLiveQuery reactivity.
export const expoDb = openDatabaseSync('mymedia.db', { enableChangeListener: true });
export const db = drizzle(expoDb);
