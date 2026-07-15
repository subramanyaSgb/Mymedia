import { EmptyState, haptic, Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { cq, createCollection, deleteCollection } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function CollectionsScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { data } = useLiveQuery(cq.all());
  const [newName, setNewName] = useState('');

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    await createCollection(name);
    setNewName('');
    haptic.success();
  };

  const confirmDelete = (id: number, name: string) =>
    Alert.alert('Delete collection', `Delete "${name}"? Items stay in your library.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCollection(id) },
    ]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Custom Collections' }} />
      <View style={styles.newRow}>
        <TextInput
          style={styles.input}
          placeholder="New collection…"
          placeholderTextColor={c.textFaint}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={create}
          returnKeyType="done"
        />
        <Pressable onPress={create} accessibilityLabel="Create collection" style={styles.createBtn}>
          <Icon name="add" size={22} color={c.onAccent} />
        </Pressable>
      </View>
      <FlatList
        data={data}
        keyExtractor={(col) => String(col.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item: col }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/collection/[id]', params: { id: String(col.id) } })}
            onLongPress={() => confirmDelete(col.id, col.name)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
            {col.cover ? (
              <Image source={{ uri: col.cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={[styles.cover, styles.coverFallback]}>
                <Icon name="albums-outline" size={22} color={c.textFaint} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1} ellipsizeMode="tail" style={{ width: '100%' }}>
                {col.name}
              </Text>
              <Text variant="micro" color={c.textMuted}>
                {col.count} {col.count === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={c.textFaint} />
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="No collections yet"
            subtitle="Create one above, or add items from their detail page."
          />
        }
      />
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  newRow: { flexDirection: 'row', gap: space.sm, padding: space.lg, paddingBottom: space.md },
  input: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: c.text,
    fontSize: 15,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: space.md,
  },
  cover: { width: 48, height: 48, borderRadius: radius.sm },
  coverFallback: { backgroundColor: c.surfaceHi, alignItems: 'center', justifyContent: 'center' },
});
