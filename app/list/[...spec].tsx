import { MediaCard } from '@/components/MediaCard';
import { EmptyState } from '@/components/ui';
import { CATEGORY_LABEL, STATUS_LABEL } from '@/constants/categories';
import { colors, space } from '@/constants/theme';
import { q, type Item } from '@/db/queries';
import type { Category, Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { FlatList, StyleSheet, View } from 'react-native';

// Route: /list/favorites | /list/category/<cat> | /list/status/<status>
function resolve(spec: string[]) {
  if (spec[0] === 'favorites') return { title: 'Favorites', query: q.favorites() };
  if (spec[0] === 'all') return { title: 'All items', query: q.all() };
  if (spec[0] === 'category') {
    const cat = spec[1] as Category;
    return { title: CATEGORY_LABEL[cat] ?? 'Category', query: q.byCategory(cat) };
  }
  if (spec[0] === 'status') {
    const st = spec[1] as Status;
    return { title: STATUS_LABEL[st] ?? 'Status', query: q.byStatus(st) };
  }
  return { title: 'List', query: q.all() };
}

const COLS = 3;

export default function ListScreen() {
  const { spec } = useLocalSearchParams<{ spec: string[] }>();
  const { title, query } = resolve(Array.isArray(spec) ? spec : [spec]);
  const { data } = useLiveQuery(query);

  // Compute an exact card width so COLS cards + gaps fill the row with no ragged edge.
  const { width } = useWindowDimensions();
  const gap = space.md;
  const pad = space.lg;
  const cardW = (width - pad * 2 - gap * (COLS - 1)) / COLS;

  // Pad the final row so a trailing 1–2 items don't stretch/misalign.
  const remainder = data.length % COLS;
  const padded = remainder === 0 ? data : [...data, ...Array(COLS - remainder).fill(null)];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={padded}
        keyExtractor={(i: Item | null, idx) => (i ? String(i.id) : `spacer-${idx}`)}
        numColumns={COLS}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ padding: pad, rowGap: space.xl }}
        renderItem={({ item }) =>
          item ? <MediaCard item={item} width={cardW} /> : <View style={{ width: cardW }} />
        }
        ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="Items you add will show up here." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
