import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { db } from './client';
import generated from './migrations/migrations';

// drizzle-kit@rc's expo output omits the journal that useMigrations@rc requires.
// Rebuild it from the migrations map (keys are already the ordered timestamp tags).
// ponytail: derive journal from keys; if migrations ever need out-of-order idx, emit a real _journal.json.
const tags = Object.keys(generated.migrations).sort();
const migrations = {
  journal: {
    entries: tags.map((tag, idx) => ({ idx, when: 0, tag, breakpoints: true })),
  },
  migrations: generated.migrations as Record<string, string>,
};

// Blocks render until the DB migration has applied, so no screen queries an empty schema.
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>Database error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  err: { color: '#dc2626', textAlign: 'center' },
});
