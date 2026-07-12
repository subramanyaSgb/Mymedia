import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { fetchTrendingMovies } from '@/api/tmdb';
import { Screen, SectionHeader, Text, EmptyState } from '@/components/ui';
import { MediaCard } from '@/components/MediaCard';
import { colors, space } from '@/constants/theme';

const COLS = 3;

export async function fetchTrendingGridData() {
  const data = await fetchTrendingMovies('week');
  return (data.results || []).map((r: any, i: number) => ({
    id: i,
    category: 'movie' as const,
    source: 'tmdb' as const,
    sourceId: String(r.id),
    title: r.title,
    imageUrl: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null,
    year: r.release_date ? Number(r.release_date.slice(0, 4)) : null,
    catalogRating: r.vote_average,
  }));
}

// Renders inside an already-padded parent (Screen): measures its own width via
// onLayout — never the window width, which lies on edge-to-edge Android.
export function TrendingGridView({ items }: { items: any[] }) {
  const gap = space.md;
  const [gridW, setGridW] = useState(0);
  const cardW = Math.floor((gridW - gap * (COLS - 1)) / COLS);

  return (
    <FlatList
      onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
      data={gridW > 0 ? items : []}
      numColumns={COLS}
      columnWrapperStyle={{ gap }}
      contentContainerStyle={{ gap }}
      scrollEnabled={false}
      keyExtractor={(item) => item.sourceId}
      renderItem={({ item }) => <MediaCard item={item} width={cardW} />}
    />
  );
}

export function TrendingHorizontalScroll({ items, cardWidth = 110 }: { items: any[]; cardWidth?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
      {items.slice(0, 10).map((i) => (
        <MediaCard key={i.sourceId} item={i} width={cardWidth} />
      ))}
    </ScrollView>
  );
}

export default function TrendingScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  async function loadTrending() {
    try {
      setLoading(true);
      const results = await fetchTrendingGridData();
      setItems(results);
    } catch (e) {
      console.error('Error loading trending:', e);
    } finally {
      setLoading(false);
    }
  }

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
      <TrendingGridView items={items} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hrow: { gap: space.md, paddingRight: space.lg },
});
