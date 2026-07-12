import { ContinueCard } from '@/components/ContinueCard';
import { MediaCard } from '@/components/MediaCard';
import { EmptyState, Screen, SectionHeader, Stat, StatRow, Text } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { getStats, q, type Stats } from '@/db/queries';
import { TrendingHorizontalScroll, fetchTrendingGridData } from '@/app/trending';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View, ActivityIndicator } from 'react-native';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const watching = useLiveQuery(q.continueWatching());
  const recent = useLiveQuery(q.recentlyAdded(12));
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const { width } = useWindowDimensions();

  const loadStats = useCallback(() => getStats().then(setStats), []);

  const loadTrending = useCallback(async () => {
    try {
      setTrendingLoading(true);
      const data = await fetchTrendingGridData();
      setTrending(data);
    } catch (e) {
      console.error('Error loading trending:', e);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadStats();
    void loadTrending();
  }, [loadStats, loadTrending]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadTrending()]);
    setRefreshing(false);
  }, [loadStats, loadTrending]);

  const empty = recent.data.length === 0;
  const featuredW = Math.min(width - space.lg * 2 - 36, 320);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }>
      <Text variant="caption" color={colors.textFaint}>
        {greeting()}
      </Text>
      <Text variant="display">Your library</Text>

      {empty ? (
        <EmptyState
          icon="add-circle-outline"
          title="Nothing here yet"
          subtitle="Search a title in Explore, or use + to add one manually."
        />
      ) : (
        <>
          {watching.data.length > 0 ? (
            <>
              <SectionHeader title="Continue watching" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
                {watching.data.map((i) => (
                  <ContinueCard key={i.id} item={i} width={featuredW} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionHeader title="Recently added" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
            {recent.data.map((i) => (
              <MediaCard key={i.id} item={i} width={110} />
            ))}
          </ScrollView>
        </>
      )}

      {trendingLoading ? (
        <>
          <SectionHeader title="Trending Now" />
          <View style={styles.trendingLoader}>
            <ActivityIndicator color={colors.accent} />
          </View>
        </>
      ) : trending.length > 0 ? (
        <>
          <SectionHeader title="Trending Now" />
          <TrendingHorizontalScroll items={trending} cardWidth={110} />
        </>
      ) : null}

      <SectionHeader title="Statistics" />
      <StatRow>
        <Stat label="Days" value={stats?.daysTracked ?? 0} />
        <Stat label="Watched" value={stats?.itemsWatched ?? 0} />
        <Stat label="Hours" value={stats?.hoursLogged ?? 0} />
        <Stat label="Total" value={stats?.totalItems ?? 0} />
      </StatRow>
      <View style={styles.footer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hrow: { gap: space.md, paddingRight: space.lg },
  footer: { height: space.xl },
  trendingLoader: { paddingVertical: space.lg, justifyContent: 'center', alignItems: 'center', height: 160 },
});
