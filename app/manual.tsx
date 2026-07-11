import { Button, haptic, Icon, Text } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { addItem } from '@/db/queries';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

// Manual entry — used for Songs (no catalog API).
export default function ManualAddScreen() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        category: 'song',
        source: 'manual',
        title: title.trim(),
        imageUrl: image,
        metadata: JSON.stringify({ artist: artist.trim() || undefined }),
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
      <Stack.Screen options={{ title: 'Add Song' }} />

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

      <Field label="Title" value={title} onChange={setTitle} placeholder="Song title" />
      <Field label="Artist" value={artist} onChange={setArtist} placeholder="Artist (optional)" />

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
