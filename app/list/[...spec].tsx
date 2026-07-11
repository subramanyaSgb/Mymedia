import { MediaCard } from '@/components/MediaCard';
import { CATEGORY_LABEL, STATUS_LABEL } from '@/constants/categories';
import { q, type Item } from '@/db/queries';
import type { Category, Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={data}
        keyExtractor={(i: Item) => String(i.id)}
        numColumns={3}
        columnWrapperStyle={styles.rowGap}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => <MediaCard item={item} width={104} />}
        ListEmptyComponent={<Text style={styles.empty}>Nothing here yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 12 },
  rowGap: { gap: 8, marginBottom: 8 },
  empty: { color: '#9ca3af', fontStyle: 'italic', padding: 16 },
});
