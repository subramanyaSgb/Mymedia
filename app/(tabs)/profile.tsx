import { currentVersion } from '@/api/updates';
import { Chip, Icon, ListRow, Screen, SectionHeader, Text, type IconName } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { languageName } from '@/constants/languages';
import { colors, radius, space } from '@/constants/theme';
import {
  cq,
  getGenreStats,
  getLanguageStats,
  getRatingDistribution,
  getStats,
  getWatchHistoryByDate,
  q,
  type Stats,
} from '@/db/queries';
import type { Category } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { WatchHistoryChart } from '@/components/charts/WatchHistoryChart';
import { GenreChart } from '@/components/charts/GenreChart';

type Badge = { icon: string; name: string; desc: string; earned: boolean };

function computeBadges(
  all: { category: Category; status: string; userRating: number | null }[],
  hoursLogged: number,
  collectionCount: number
): Badge[] {
  const finished = (cat?: Category) =>
    all.filter((i) => i.status === 'finished' && (!cat || i.category === cat)).length;
  const rated = all.filter((i) => i.userRating != null).length;
  return [
    { icon: 'footsteps-outline', name: 'First Steps', desc: 'Add your first item', earned: all.length >= 1 },
    { icon: 'film-outline', name: 'Film Buff', desc: 'Finish 25 movies', earned: finished('movie') >= 25 },
    { icon: 'tv-outline', name: 'Binge Watcher', desc: 'Finish 10 series', earned: finished('series') >= 10 },
    { icon: 'sparkles-outline', name: 'Otaku', desc: 'Finish 10 anime', earned: finished('anime') >= 10 },
    { icon: 'musical-notes-outline', name: 'Melophile', desc: 'Log 100 songs', earned: all.filter((i) => i.category === 'song').length >= 100 },
    { icon: 'trophy-outline', name: 'Century', desc: 'Track 100 items', earned: all.length >= 100 },
    { icon: 'time-outline', name: 'Marathoner', desc: 'Log 100 hours', earned: hoursLogged >= 100 },
    { icon: 'star-outline', name: 'Critic', desc: 'Rate 20 items', earned: rated >= 20 },
    { icon: 'albums-outline', name: 'Collector', desc: 'Create 3 collections', earned: collectionCount >= 3 },
  ];
}

function StatCard({ icon, label, value }: { icon: IconName; label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={18} color={colors.accent} />
      </View>
      <Text variant="h1">{value}</Text>
      <Text variant="micro" color={colors.textMuted}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const [tab, setTab] = useState<Category | 'all'>('all');
  const [stats, setStats] = useState<Stats | null>(null);
  const [watchHistory, setWatchHistory] = useState<Array<{ date: string; count: number }>>([]);
  const [genres, setGenres] = useState<Array<{ genre: string; count: number }>>([]);
  const [languages, setLanguages] = useState<Array<{ genre: string; count: number }>>([]);
  const [ratings, setRatings] = useState<Array<{ rating: number; count: number }>>([]);

  const all = useLiveQuery(q.all());
  const collections = useLiveQuery(cq.all());

  const load = useCallback(() => {
    void Promise.all([
      getStats(tab === 'all' ? undefined : tab).then(setStats),
      getWatchHistoryByDate().then(setWatchHistory),
      getGenreStats().then(setGenres),
      getLanguageStats().then(setLanguages),
      getRatingDistribution().then(setRatings),
    ]);
  }, [tab]);

  useFocusEffect(load);
  useEffect(load, [load]);

  const completion =
    stats && stats.totalItems > 0 ? Math.round((stats.itemsWatched / stats.totalItems) * 100) : 0;

  const badges = computeBadges(all.data, stats?.hoursLogged ?? 0, (collections.data ?? []).length);
  const earned = badges.filter((b) => b.earned);
  const orderedBadges = [...earned, ...badges.filter((b) => !b.earned)];
  const maxRatingCount = Math.max(...ratings.map((r) => r.count), 1);
  const languagesNamed = languages.map((l) => ({ ...l, genre: languageName(l.genre) ?? l.genre }));

  return (
    <Screen>
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Icon name="person" size={26} color={colors.accent} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h1">Your Stats</Text>
          <Text variant="caption" color={colors.textMuted}>
            {all.data.length} items · {stats?.daysTracked ?? 0} days tracked
          </Text>
        </View>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        <Chip label="All" active={tab === 'all'} onPress={() => setTab('all')} />
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={tab === c.key} onPress={() => setTab(c.key)} />
        ))}
      </ScrollView>

      {/* Overview — 2×2 icon stat cards */}
      <SectionHeader title="Overview" />
      <View style={styles.statGrid}>
        <StatCard icon="albums-outline" label="Total" value={stats?.totalItems ?? 0} />
        <StatCard icon="checkmark-done-outline" label="Watched" value={stats?.itemsWatched ?? 0} />
        <StatCard icon="time-outline" label="Hours" value={stats?.hoursLogged ?? 0} />
        <StatCard icon="pie-chart-outline" label="Completed" value={`${completion}%`} />
      </View>

      {watchHistory.length > 0 && (
        <>
          <SectionHeader title="Watch Activity" />
          <WatchHistoryChart data={watchHistory} />
        </>
      )}

      {languagesNamed.length > 0 && (
        <>
          <SectionHeader title="Languages" />
          <GenreChart data={languagesNamed} />
        </>
      )}

      {genres.length > 0 && (
        <>
          <SectionHeader title="Top Genres" />
          <GenreChart data={genres} />
        </>
      )}

      {ratings.length > 0 && (
        <View>
          <SectionHeader title="Rating Distribution" />
          <View style={styles.ratingCard}>
            {ratings.map((r) => (
              <View key={r.rating} style={styles.ratingRow}>
                <View style={styles.ratingLabel}>
                  <Icon name="star" size={13} color={colors.accent} />
                  <Text variant="caption">{r.rating.toFixed(0)}</Text>
                </View>
                <View style={styles.ratingTrack}>
                  <View style={[styles.ratingFill, { width: `${(r.count / maxRatingCount) * 100}%` }]} />
                </View>
                <Text variant="micro" color={colors.textMuted} style={styles.ratingCount}>
                  {r.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Badges — horizontal scroller, earned first */}
      <SectionHeader title={`Badges  ·  ${earned.length}/${badges.length}`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
        {orderedBadges.map((b) => (
          <View key={b.name} style={[styles.badge, !b.earned && styles.badgeLocked]}>
            <View style={[styles.badgeIcon, b.earned && styles.badgeIconEarned]}>
              <Icon name={b.icon as any} size={24} color={b.earned ? colors.onAccent : colors.textFaint} />
            </View>
            <Text variant="micro" style={styles.badgeName} color={b.earned ? colors.text : colors.textFaint}>
              {b.name}
            </Text>
            <Text variant="micro" color={colors.textFaint} numberOfLines={2} style={styles.badgeDesc}>
              {b.desc}
            </Text>
          </View>
        ))}
      </ScrollView>

      <SectionHeader title="Settings" />
      <ListRow icon="cloud-outline" label="Data & Sync" onPress={() => router.push('/sync')} />
      <ListRow
        icon="information-circle-outline"
        label="About & Updates"
        count={`v${currentVersion}`}
        last
        onPress={() => router.push('/about')}
      />
      <View style={{ height: space.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, paddingRight: space.lg },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  statCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },

  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.sm,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ratingLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 36 },
  ratingTrack: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    overflow: 'hidden',
  },
  ratingFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  ratingCount: { width: 28, textAlign: 'right' },

  badgeRow: { gap: space.sm, paddingRight: space.lg },
  badge: {
    width: 110,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    alignItems: 'center',
    gap: 5,
  },
  badgeLocked: { opacity: 0.45 },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIconEarned: { backgroundColor: colors.accent },
  badgeName: { textAlign: 'center', fontWeight: '700', width: 90 },
  badgeDesc: { textAlign: 'center', width: 90 },
});
