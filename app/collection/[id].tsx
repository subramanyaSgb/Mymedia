import { MediaCard } from '@/components/MediaCard';
import { EmptyState, useThemedStyles } from '@/components/ui';
import { space, type Palette } from '@/constants/theme';
import { cq, type Item } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

const COLS = 3;

export default function CollectionScreen() {
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: info } = useLiveQuery(cq.byId(Number(id)));
  const { data: rows } = useLiveQuery(cq.items(Number(id)));
  const data = (rows ?? []).map((r) => r.item);

  const [listW, setListW] = useState(0);
  const gap = space.md;
  const pad = space.lg;
  const cardW = Math.floor((listW - pad * 2 - gap * (COLS - 1)) / COLS);

  const remainder = data.length % COLS;
  const padded = remainder === 0 ? data : [...data, ...Array(COLS - remainder).fill(null)];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: info?.[0]?.name ?? 'Collection' }} />
      <FlatList
        onLayout={(e) => setListW(e.nativeEvent.layout.width)}
        data={listW > 0 ? padded : []}
        keyExtractor={(i: Item | null, idx) => (i ? String(i.id) : `spacer-${idx}`)}
        numColumns={COLS}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ padding: pad, rowGap: space.xl }}
        renderItem={({ item }) =>
          item ? <MediaCard item={item} width={cardW} /> : <View style={{ width: cardW }} />
        }
        ListEmptyComponent={
          listW > 0 ? (
            <EmptyState
              icon="albums-outline"
              title="Empty collection"
              subtitle="Add items from their detail page → Add to collection."
            />
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
});
