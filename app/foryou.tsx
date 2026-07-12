import { fetchMovieDetails, fetchTvDetails, tmdbConfigured } from '@/api/tmdb';
import { EmptyState, Icon, Screen, SectionHeader, Text } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { getSetting, parseMetadata, setSetting } from '@/db/queries';
import { db } from '@/db/client';
import { items } from '@/db/schema';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

export type FeedEntry = {
  itemId: number;
  title: string;
  imageUrl: string | null;
  line: string; // "S02E05 airs Mar 3" / "Releases Mar 14"
  kind: 'episode' | 'release';
};

const CACHE_KEY = 'foryou-cache';

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

// Build the feed from TMDB: next episodes for tracked series, release dates for want-list movies.
export async function buildForYouFeed(): Promise<FeedEntry[]> {
  if (!tmdbConfigured()) return [];
  const all = await db.select().from(items);
  const feed: FeedEntry[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const series = all.filter(
    (i) => i.category === 'series' && i.source === 'tmdb' && i.sourceId && i.status !== 'finished'
  );
  const wantMovies = all.filter(
    (i) => i.category === 'movie' && i.source === 'tmdb' && i.sourceId && i.status === 'want'
  );

  await Promise.allSettled([
    ...series.slice(0, 25).map(async (s) => {
      const d = await fetchTvDetails(s.sourceId!);
      const next = d.next_episode_to_air;
      const last = d.last_episode_to_air;
      if (next?.air_date) {
        feed.push({
          itemId: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
          line: `S${String(next.season_number).padStart(2, '0')}E${String(next.episode_number).padStart(2, '0')} airs ${fmtDate(next.air_date)}`,
          kind: 'episode',
        });
      } else if (last?.air_date && last.air_date >= monthAgo) {
        feed.push({
          itemId: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
          line: `New: S${String(last.season_number).padStart(2, '0')}E${String(last.episode_number).padStart(2, '0')} (${fmtDate(last.air_date)})`,
          kind: 'episode',
        });
      }
    }),
    ...wantMovies.slice(0, 25).map(async (m) => {
      const meta = parseMetadata(m.metadata);
      let releaseDate = meta.releaseDate;
      if (!releaseDate) {
        const d = await fetchMovieDetails(m.sourceId!);
        releaseDate = d.release_date;
      }
      if (releaseDate && releaseDate >= today) {
        feed.push({
          itemId: m.id,
          title: m.title,
          imageUrl: m.imageUrl,
          line: `Releases ${fmtDate(releaseDate)}`,
          kind: 'release',
        });
      }
    }),
  ]);

  return feed;
}

// Once-a-day cache in the settings KV; force=true bypasses (pull-to-refresh).
export async function getForYouFeed(force = false): Promise<FeedEntry[]> {
  const today = new Date().toISOString().slice(0, 10);
  if (!force) {
    const raw = await getSetting(CACHE_KEY);
    if (raw) {
      try {
        const cached = JSON.parse(raw) as { date: string; feed: FeedEntry[] };
        if (cached.date === today) return cached.feed;
      } catch {}
    }
  }
  const feed = await buildForYouFeed();
  await setSetting(CACHE_KEY, JSON.stringify({ date: today, feed }));
  return feed;
}

export default function ForYouScreen() {
  const [feed, setFeed] = useState<FeedEntry[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((force = false) => {
    getForYouFeed(force)
      .then(setFeed)
      .catch(() => setFeed([]));
  }, []);

  useEffect(() => load(), [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getForYouFeed(true).then(setFeed).catch(() => {});
    setRefreshing(false);
  };

  const episodes = (feed ?? []).filter((f) => f.kind === 'episode');
  const releases = (feed ?? []).filter((f) => f.kind === 'release');

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}>
      <Stack.Screen options={{ title: 'For You' }} />

      {feed === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : feed.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="Nothing new right now"
          subtitle="New episodes of series you track and release dates of movies you want will show here."
        />
      ) : (
        <>
          {episodes.length > 0 ? (
            <>
              <SectionHeader title="New & upcoming episodes" />
              {episodes.map((f) => (
                <FeedRow key={`e-${f.itemId}`} entry={f} />
              ))}
            </>
          ) : null}
          {releases.length > 0 ? (
            <>
              <SectionHeader title="Releasing soon" />
              {releases.map((f) => (
                <FeedRow key={`r-${f.itemId}`} entry={f} />
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function FeedRow({ entry }: { entry: FeedEntry }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: String(entry.itemId) } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      {entry.imageUrl ? (
        <Image source={{ uri: entry.imageUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Icon name="film" size={18} color={colors.textFaint} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1} style={{ width: '100%' }}>
          {entry.title}
        </Text>
        <Text variant="micro" color={colors.accent}>
          {entry.line}
        </Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: space.xxl, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.sm,
  },
  thumb: { width: 44, height: 62, borderRadius: radius.sm },
  thumbFallback: { backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' },
});
