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

export default function ListScreen() {
  const { spec } = useLocalSearchParams<{ spec: string[] }>();
  const { title, query } = resolve(Array.isArray(spec) ? spec : [spec]);
  const { data } = useLiveQuery(query);

  // Responsive 3-up grid: derive card width from screen width instead of a fixed 104.
  const { width } = useWindowDimensions();
  const cols = 3;
  const gap = space.md;
  const pad = space.lg;
  const cardW = Math.floor((width - pad * 2 - gap * (cols - 1)) / cols);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={data}
        keyExtractor={(i: Item) => String(i.id)}
        numColumns={cols}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ padding: pad, gap }}
        renderItem={({ item }) => <MediaCard item={item} width={cardW} />}
        ListEmptyComponent={<EmptyState title="Nothing here yet" subtitle="Items you add will show up here." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
