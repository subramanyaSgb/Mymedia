import { MediaCard } from '@/components/MediaCard';
import { accent } from '@/constants/Colors';
import { getStats, q, type Item, type Stats } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const watching = useLiveQuery(q.continueWatching());
  const recent = useLiveQuery(q.recentlyAdded(10));
  const [stats, setStats] = useState<Stats | null>(null);

  // Stats are an aggregate query (not reactive) — refresh whenever Home regains focus.
  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hi}>MyMedia</Text>
        <Text style={styles.tagline}>All your favorites. Organized.</Text>

        <Section title="Continue Watching" items={watching.data} empty="Nothing in progress yet." />
        <Section title="Recently Added" items={recent.data} empty="Add your first title from Explore or +." />

        <View style={styles.statsCard}>
          <Text style={styles.statsHeading}>Your Statistics</Text>
          <View style={styles.statsRow}>
            <Stat label="Days Tracked" value={stats?.daysTracked ?? 0} />
            <Stat label="Items Watched" value={stats?.itemsWatched ?? 0} />
            <Stat label="Hours Logged" value={stats?.hoursLogged ?? 0} />
            <Stat label="Total" value={stats?.totalItems ?? 0} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items, empty }: { title: string; items: Item[]; empty: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>{empty}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items.map((i) => (
            <MediaCard key={i.id} item={i} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  hi: { fontSize: 28, fontWeight: '800' },
  tagline: { color: '#6b7280', marginTop: 2, marginBottom: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  emptyText: { color: '#9ca3af', fontStyle: 'italic' },
  statsCard: { marginTop: 24, backgroundColor: '#f5f3ff', borderRadius: 16, padding: 16 },
  statsHeading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: accent },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2, textAlign: 'center' },
});
