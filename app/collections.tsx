import { EmptyState, haptic, Icon, Text } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { cq, createCollection, deleteCollection } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

export default function CollectionsScreen() {
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
          placeholderTextColor={colors.textFaint}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={create}
          returnKeyType="done"
        />
        <Pressable onPress={create} accessibilityLabel="Create collection" style={styles.createBtn}>
          <Icon name="add" size={22} color={colors.onAccent} />
        </Pressable>
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item: c }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/collection/[id]', params: { id: String(c.id) } })}
            onLongPress={() => confirmDelete(c.id, c.name)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
            {c.cover ? (
              <Image source={{ uri: c.cover }} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={[styles.cover, styles.coverFallback]}>
                <Icon name="albums-outline" size={22} color={colors.textFaint} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {c.name}
              </Text>
              <Text variant="micro" color={colors.textMuted}>
                {c.count} {c.count === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textFaint} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  newRow: { flexDirection: 'row', gap: space.sm, padding: space.lg, paddingBottom: space.md },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.md,
  },
  cover: { width: 48, height: 48, borderRadius: radius.sm },
  coverFallback: { backgroundColor: colors.surfaceHi, alignItems: 'center', justifyContent: 'center' },
});
