import { ContinueCard } from '@/components/ContinueCard';
import { MediaCard } from '@/components/MediaCard';
import { Chip, EmptyState, Icon, Screen, SectionHeader, Stat, StatRow, Text } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { getStats, q, type Stats } from '@/db/queries';
import type { Category } from '@/db/schema';
import { TrendingHorizontalScroll, fetchTrendingGridData } from '@/app/trending';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View, ActivityIndicator } from 'react-native';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href as any} asChild>
      <Pressable hitSlop={8} accessibilityRole="link" accessibilityLabel="See all">
        <Text variant="micro" color={colors.accent}>
          SEE ALL
        </Text>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const watching = useLiveQuery(q.continueWatching());
  const recent = useLiveQuery(q.recentlyAdded(12));
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [trending, setTrending] = useState<any[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [filter, setFilter] = useState<Category | 'all'>('all');
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

  const byFilter = <T extends { category: Category }>(rows: T[]) =>
    filter === 'all' ? rows : rows.filter((r) => r.category === filter);

  const watchingRows = byFilter(watching.data);
  const recentRows = byFilter(recent.data);

  const empty = recent.data.length === 0;
  const featuredW = Math.min(width - space.lg * 2 - 36, 320);

  return (
    <Screen
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color={colors.textFaint}>
            {greeting()}
          </Text>
          <Text variant="display">Your library</Text>
        </View>
        <View style={styles.avatar}>
          <Icon name="person" size={20} color={colors.accent} />
        </View>
      </View>

      {/* Category filter chips — matches the mockup's pill row under the greeting. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={filter === c.key} onPress={() => setFilter(c.key)} />
        ))}
      </ScrollView>

      {empty ? (
        <EmptyState
          icon="add-circle-outline"
          title="Nothing here yet"
          subtitle="Search a title in Explore, or use + to add one manually."
        />
      ) : (
        <>
          {watchingRows.length > 0 ? (
            <>
              <SectionHeader title="Continue watching" right={<SeeAll href="/list/status/watching" />} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
                {watchingRows.map((i) => (
                  <ContinueCard key={i.id} item={i} width={featuredW} />
                ))}
              </ScrollView>
            </>
          ) : null}

          <SectionHeader title="Recently added" right={<SeeAll href="/list/all" />} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
            {recentRows.map((i) => (
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
          <SectionHeader title="Trending Now" right={<SeeAll href="/trending" />} />
          <TrendingHorizontalScroll items={trending} cardWidth={110} />
        </>
      ) : null}

      <SectionHeader title="Your statistics" />
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
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', gap: space.sm, marginTop: space.md, paddingRight: space.lg },
  hrow: { gap: space.md, paddingRight: space.lg },
  footer: { height: space.xl },
  trendingLoader: { paddingVertical: space.lg, justifyContent: 'center', alignItems: 'center', height: 160 },
});
