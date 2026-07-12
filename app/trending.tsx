import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { ensureRuntime } from '@/api/runtime';
import { syncItemData } from '@/api/sync';
import { fetchTrendingMovies } from '@/api/tmdb';
import { StatusPicker } from '@/components/StatusPicker';
import { haptic, Icon, Poster, Screen, SectionHeader, Text, EmptyState } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { addItem, q } from '@/db/queries';
import type { Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

const COLS = 3;

// A trending catalog entry — NOT a library item (no local id until added).
export type TrendingEntry = {
  sourceId: string;
  title: string;
  imageUrl: string | null;
  year: number | null;
  catalogRating: number | null;
  overview: string;
};

export async function fetchTrendingGridData(): Promise<TrendingEntry[]> {
  const data = await fetchTrendingMovies('week');
  return (data.results || []).map((r: any) => ({
    sourceId: String(r.id),
    title: r.title,
    imageUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    year: r.release_date ? Number(r.release_date.slice(0, 4)) : null,
    catalogRating: r.vote_average ?? null,
    overview: r.overview ?? '',
  }));
}

// Shared behavior: tap opens the library item when added, otherwise a themed add sheet.
function useTrendingActions() {
  const inLib = useLiveQuery(q.sourceIds());
  const libMap = useMemo(
    () => new Map(inLib.data.map((r) => [`${r.source}-${r.sourceId}`, r.id])),
    [inLib.data]
  );
  const [pending, setPending] = useState<TrendingEntry | null>(null);

  const existingIdOf = (e: TrendingEntry) => libMap.get(`tmdb-${e.sourceId}`);

  const open = (e: TrendingEntry) => {
    const existingId = existingIdOf(e);
    if (existingId != null) {
      router.push({ pathname: '/item/[id]', params: { id: String(existingId) } });
    } else {
      setPending(e);
    }
  };

  const add = async (e: TrendingEntry, status: Status) => {
    haptic.success();
    const newId = await addItem({
      category: 'movie',
      source: 'tmdb',
      sourceId: e.sourceId,
      title: e.title,
      imageUrl: e.imageUrl,
      year: e.year,
      catalogRating: e.catalogRating,
      metadata: JSON.stringify({ overview: e.overview }),
      status,
    });
    syncItemData(newId, e.sourceId, 'movie');
    if (status === 'finished') {
      const [row] = await q.byId(newId);
      if (row) void ensureRuntime(row);
    }
  };

  return { existingIdOf, open, add, pending, setPending };
}

function TrendingCard({
  entry,
  width,
  added,
  onPress,
  onLongPress,
}: {
  entry: TrendingEntry;
  width: number;
  added: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <View>
        <Poster uri={entry.imageUrl} title={entry.title} width={width} height={width * 1.45} fallbackIcon="film" />
        <View style={[styles.badge, added && styles.badgeAdded]}>
          <Icon name={added ? 'checkmark' : 'add'} size={14} color={colors.onAccent} />
        </View>
      </View>
      <View style={[styles.meta, { width }]}>
        <Text variant="caption" numberOfLines={2} ellipsizeMode="tail" style={[styles.titleText, { width }]}>
          {entry.title}
        </Text>
        <Text variant="micro" color={colors.textMuted}>
          {entry.year ?? ' '}
        </Text>
      </View>
    </Pressable>
  );
}

export function TrendingHorizontalScroll({ items, cardWidth = 110 }: { items: TrendingEntry[]; cardWidth?: number }) {
  const { existingIdOf, open, add, pending, setPending } = useTrendingActions();

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
        {items.slice(0, 10).map((e) => (
          <TrendingCard
            key={e.sourceId}
            entry={e}
            width={cardWidth}
            added={existingIdOf(e) != null}
            onPress={() => open(e)}
            onLongPress={() => setPending(e)}
          />
        ))}
      </ScrollView>
      <StatusPicker
        visible={pending != null}
        title={pending?.title ?? ''}
        subtitle="Add to which list?"
        onSelect={(s) => pending && add(pending, s)}
        onClose={() => setPending(null)}
      />
    </>
  );
}

export default function TrendingScreen() {
  const [items, setItems] = useState<TrendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { existingIdOf, open, add, pending, setPending } = useTrendingActions();

  const [gridW, setGridW] = useState(0);
  const gap = space.md;
  const cardW = Math.floor((gridW - gap * (COLS - 1)) / COLS);

  useEffect(() => {
    (async () => {
      try {
        setItems(await fetchTrendingGridData());
      } catch (e) {
        console.error('Error loading trending:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Trending Now' }} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Trending Now' }} />
        <EmptyState icon="trending-up-outline" title="No trends" subtitle="Check back later" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Trending Now' }} />
      <SectionHeader title="Popular This Week" />
      <Text variant="micro" color={colors.textFaint} style={styles.hint}>
        Tap to open or add · long-press to pick a list
      </Text>
      <FlatList
        onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
        data={gridW > 0 ? items : []}
        numColumns={COLS}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ gap }}
        scrollEnabled={false}
        keyExtractor={(item) => item.sourceId}
        renderItem={({ item }) => (
          <TrendingCard
            entry={item}
            width={cardW}
            added={existingIdOf(item) != null}
            onPress={() => open(item)}
            onLongPress={() => setPending(item)}
          />
        )}
      />
      <StatusPicker
        visible={pending != null}
        title={pending?.title ?? ''}
        subtitle="Add to which list?"
        onSelect={(s) => pending && add(pending, s)}
        onClose={() => setPending(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hrow: { gap: space.md, paddingRight: space.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  meta: { marginTop: space.sm, minHeight: 34 },
  titleText: { lineHeight: 17 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAdded: { backgroundColor: colors.success },
  hint: { marginBottom: space.md },
});
