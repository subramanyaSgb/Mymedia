import { MediaCard } from '@/components/MediaCard';
import { EmptyState } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { cq, type Item } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLS = 3;

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: info } = useLiveQuery(cq.byId(Number(id)));
  const { data: rows } = useLiveQuery(cq.items(Number(id)));
  const data = (rows ?? []).map((r) => r.item);

  const { width } = useWindowDimensions();
  const gap = space.md;
  const pad = space.lg;
  const cardW = (width - pad * 2 - gap * (COLS - 1)) / COLS;

  const remainder = data.length % COLS;
  const padded = remainder === 0 ? data : [...data, ...Array(COLS - remainder).fill(null)];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: info?.[0]?.name ?? 'Collection' }} />
      <FlatList
        data={padded}
        keyExtractor={(i: Item | null, idx) => (i ? String(i.id) : `spacer-${idx}`)}
        numColumns={COLS}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ padding: pad, rowGap: space.xl }}
        renderItem={({ item }) =>
          item ? <MediaCard item={item} width={cardW} /> : <View style={{ width: cardW }} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="Empty collection"
            subtitle="Add items from their detail page → Add to collection."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
