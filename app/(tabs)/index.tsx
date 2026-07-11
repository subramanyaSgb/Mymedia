import { MediaCard } from '@/components/MediaCard';
import { EmptyState, Screen, Skeleton, Stat, StatRow, Text } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { getStats, q, type Item, type Stats } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const watching = useLiveQuery(q.continueWatching());
  const recent = useLiveQuery(q.recentlyAdded(12));
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(() => getStats().then(setStats), []);
  useFocusEffect(useCallback(() => void loadStats(), [loadStats]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const empty = recent.data.length === 0;

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }>
      <Text variant="display">MyMedia</Text>
      <Text variant="caption" muted style={styles.tagline}>
        Everything you watch, in one place.
      </Text>

      {empty ? (
        <EmptyState
          icon="add-circle-outline"
          title="Your library is empty"
          subtitle="Search a title in Explore, or tap + to add one manually."
        />
      ) : (
        <>
          <Section title="Continue Watching" items={watching.data} emptyText="Nothing in progress." />
          <Section title="Recently Added" items={recent.data} />
        </>
      )}

      <View style={styles.statsBlock}>
        <Text variant="h2" style={styles.statsHeading}>
          Your Statistics
        </Text>
        <StatRow>
          <Stat label="Days" value={stats?.daysTracked ?? 0} />
          <Stat label="Watched" value={stats?.itemsWatched ?? 0} />
          <Stat label="Hours" value={stats?.hoursLogged ?? 0} />
          <Stat label="Total" value={stats?.totalItems ?? 0} />
        </StatRow>
      </View>
    </Screen>
  );
}

function Section({ title, items, emptyText }: { title: string; items: Item[]; emptyText?: string }) {
  return (
    <View style={styles.section}>
      <Text variant="h2" style={styles.sectionTitle}>
        {title}
      </Text>
      {items.length === 0 && emptyText ? (
        <Text variant="caption" color={colors.textFaint}>
          {emptyText}
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
          {items.map((i) => (
            <MediaCard key={i.id} item={i} width={118} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagline: { marginTop: 2, marginBottom: space.sm },
  section: { marginTop: space.xl },
  sectionTitle: { marginBottom: space.md },
  hrow: { gap: space.md, paddingRight: space.lg },
  statsBlock: { marginTop: space.xxl },
  statsHeading: { marginBottom: space.md },
});
