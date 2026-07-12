import { Button, Chip, haptic, Icon, Text } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { addItem } from '@/db/queries';
import type { Category } from '@/db/schema';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// Manual entry — Songs, Books and Games have no catalog API.
const MANUAL_CATEGORIES: { key: Category; label: string; creatorLabel: string }[] = [
  { key: 'song', label: 'Song', creatorLabel: 'Artist' },
  { key: 'book', label: 'Book', creatorLabel: 'Author' },
  { key: 'game', label: 'Game', creatorLabel: 'Studio' },
];

export default function ManualAddScreen() {
  const [category, setCategory] = useState<Category>('song');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creatorLabel = MANUAL_CATEGORIES.find((c) => c.key === category)!.creatorLabel;

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const save = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      haptic.warning();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addItem({
        category,
        source: 'manual',
        title: title.trim(),
        imageUrl: image,
        metadata: JSON.stringify(
          category === 'song'
            ? { artist: artist.trim() || undefined }
            : { creator: artist.trim() || undefined }
        ),
      });
      haptic.success();
      router.dismissTo('/(tabs)/library');
    } catch {
      setError('Could not save. Try again.');
      haptic.warning();
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Add Manually' }} />

      <View style={styles.catRow}>
        {MANUAL_CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </View>

      <Pressable style={styles.imagePicker} onPress={pickImage} accessibilityLabel="Add cover image">
        {image ? (
          <Image source={{ uri: image }} style={styles.img} contentFit="cover" />
        ) : (
          <View style={styles.imageEmpty}>
            <Icon name="image-outline" size={26} color={colors.textFaint} />
            <Text variant="micro" color={colors.textFaint}>
              Add cover
            </Text>
          </View>
        )}
      </Pressable>

      <Field label="Title" value={title} onChange={setTitle} placeholder="Title" />
      <Field label={creatorLabel} value={artist} onChange={setArtist} placeholder={`${creatorLabel} (optional)`} />

      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Button label={saving ? 'Saving…' : 'Add to Library'} icon="add" onPress={save} disabled={saving} style={styles.save} />
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text variant="micro" color={colors.textMuted}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  catRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.xl, justifyContent: 'center' },
  imagePicker: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: space.xl,
  },
  img: { width: '100%', height: '100%' },
  imageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xs },
  field: { gap: space.sm, marginBottom: space.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: 15,
    color: colors.text,
  },
  error: { marginBottom: space.md },
  save: { marginTop: space.sm },
});
