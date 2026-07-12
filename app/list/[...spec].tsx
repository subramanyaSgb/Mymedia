import { ensureRuntime } from '@/api/runtime';
import { MediaCard } from '@/components/MediaCard';
import { EmptyState, haptic, Icon, Text } from '@/components/ui';
import { CATEGORY_LABEL, STATUS_LABEL } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { deleteItem, q, setStatus, type Item } from '@/db/queries';
import type { Category, Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

// Route: /list/favorites | /list/all | /list/category/<cat> | /list/status/<status>
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

  // Multi-select: long-press enters selection mode, tap toggles, bar applies bulk actions.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const selectionMode = selected.size > 0;

  // Measure the list's real width (window width lies under Android edge-to-edge)
  // and compute an exact card width so COLS cards + gaps fill the row.
  const [listW, setListW] = useState(0);
  const gap = space.md;
  const pad = space.lg;
  const cardW = Math.floor((listW - pad * 2 - gap * (COLS - 1)) / COLS);

  // Pad the final row so a trailing 1–2 items don't stretch/misalign.
  const remainder = data.length % COLS;
  const padded = remainder === 0 ? data : [...data, ...Array(COLS - remainder).fill(null)];

  const toggle = (id: number) => {
    haptic.light();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    haptic.light();
    setSelected(new Set(data.map((i) => i.id)));
  };

  const clear = () => setSelected(new Set());

  const applyStatus = async (status: Status) => {
    const targets = data.filter((i) => selected.has(i.id));
    for (const item of targets) {
      await setStatus(item.id, status);
      if (status === 'finished') void ensureRuntime(item); // keep Hours Logged accurate
    }
    haptic.success();
    clear();
  };

  const bulkDelete = () =>
    Alert.alert('Delete', `Remove ${selected.size} item${selected.size > 1 ? 's' : ''} from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          for (const id of selected) await deleteItem(id);
          clear();
        },
      },
    ]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: selectionMode ? `${selected.size} selected` : title }} />
      <FlatList
        onLayout={(e) => setListW(e.nativeEvent.layout.width)}
        data={listW > 0 ? padded : []}
        extraData={selected}
        keyExtractor={(i: Item | null, idx) => (i ? String(i.id) : `spacer-${idx}`)}
        numColumns={COLS}
        columnWrapperStyle={{ gap }}
        contentContainerStyle={{ padding: pad, rowGap: space.xl, paddingBottom: selectionMode ? 140 : pad }}
        renderItem={({ item }) =>
          item ? (
            <MediaCard
              item={item}
              width={cardW}
              selectionMode={selectionMode}
              selected={selected.has(item.id)}
              onPress={selectionMode ? () => toggle(item.id) : undefined}
              onLongPress={!selectionMode ? () => toggle(item.id) : undefined}
            />
          ) : (
            <View style={{ width: cardW }} />
          )
        }
        ListEmptyComponent={
          listW > 0 ? <EmptyState title="Nothing here yet" subtitle="Items you add will show up here." /> : null
        }
      />

      {selectionMode ? (
        <View style={styles.actionBar}>
          <View style={styles.actionTop}>
            <Pressable onPress={selectAll} hitSlop={8} accessibilityLabel="Select all">
              <Text variant="micro" color={colors.accent}>
                SELECT ALL
              </Text>
            </Pressable>
            <Pressable onPress={clear} hitSlop={8} accessibilityLabel="Cancel selection">
              <Text variant="micro" color={colors.textMuted}>
                CANCEL
              </Text>
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <ActionBtn icon="bookmark-outline" label="Want" onPress={() => applyStatus('want')} />
            <ActionBtn icon="play-circle-outline" label="Watching" onPress={() => applyStatus('watching')} />
            <ActionBtn icon="checkmark-done-outline" label="Finished" onPress={() => applyStatus('finished')} />
            <ActionBtn icon="trash-outline" label="Delete" danger onPress={bulkDelete} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ActionBtn({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={22} color={danger ? colors.danger : colors.text} />
      <Text variant="micro" color={danger ? colors.danger : colors.textMuted}>
        {label.toUpperCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  actionBar: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.lg,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.xs },
  actionRow: { flexDirection: 'row' },
  actionBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: space.sm },
});
