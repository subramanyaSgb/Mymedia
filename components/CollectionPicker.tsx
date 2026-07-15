import { Button, haptic, Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { addToCollection, cq, createCollection, removeFromCollection } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// Bottom-sheet collection picker. Single item: toggles membership.
// Multiple items (bulk): tapping a collection adds all of them.
export function CollectionPicker({
  visible,
  itemIds,
  onClose,
}: {
  visible: boolean;
  itemIds: number[];
  onClose: () => void;
}) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const { data: all } = useLiveQuery(cq.all());
  const single = itemIds.length === 1;
  const { data: memberships } = useLiveQuery(cq.forItem(itemIds[0] ?? -1));
  const memberIds = new Set((memberships ?? []).map((m) => m.collectionId));
  const [newName, setNewName] = useState('');

  const apply = async (collectionId: number) => {
    haptic.light();
    if (single && memberIds.has(collectionId)) {
      await removeFromCollection(collectionId, itemIds[0]);
      return;
    }
    for (const id of itemIds) await addToCollection(collectionId, id);
    if (!single) haptic.success();
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const cid = await createCollection(name);
    for (const id of itemIds) await addToCollection(cid, id);
    setNewName('');
    haptic.success();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text variant="h1" style={{ marginBottom: space.md }}>
          {single ? 'Collections' : `Add ${itemIds.length} items to collection`}
        </Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {(all ?? []).map((col) => {
            const isIn = single && memberIds.has(col.id);
            return (
              <Pressable
                key={col.id}
                accessibilityRole="button"
                onPress={() => apply(col.id)}
                style={styles.row}>
                <Icon
                  name={single ? (isIn ? 'checkmark-circle' : 'ellipse-outline') : 'add-circle-outline'}
                  size={22}
                  color={isIn ? c.accent : c.textFaint}
                />
                <Text variant="body" style={{ flex: 1 }}>
                  {col.name}
                </Text>
                <Text variant="micro" color={c.textMuted}>
                  {col.count}
                </Text>
              </Pressable>
            );
          })}
          {(all ?? []).length === 0 ? (
            <Text variant="caption" muted style={{ paddingVertical: space.md }}>
              No collections yet — create one below.
            </Text>
          ) : null}
        </ScrollView>
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
        <Button label="Done" onPress={onClose} style={{ marginTop: space.md }} />
      </View>
    </Modal>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingBottom: space.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  newRow: { flexDirection: 'row', gap: space.sm, marginTop: space.md, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: c.surfaceHi,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    color: c.text,
    fontSize: 15,
  },
  createBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
