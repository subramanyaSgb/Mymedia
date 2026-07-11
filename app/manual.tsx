import { accent } from '@/constants/Colors';
import { addItem } from '@/db/queries';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Manual entry — used for Songs (no catalog API).
export default function ManualAddScreen() {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled) setImage(res.assets[0].uri);
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    await addItem({
      category: 'song',
      source: 'manual',
      title: title.trim(),
      imageUrl: image,
      metadata: JSON.stringify({ artist: artist.trim() || undefined }),
    });
    router.dismissTo('/(tabs)/library');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Add Song' }} />

      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.img} contentFit="cover" />
        ) : (
          <Text style={styles.imageHint}>＋ Add cover</Text>
        )}
      </Pressable>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Song title" />

      <Text style={styles.label}>Artist</Text>
      <TextInput style={styles.input} value={artist} onChangeText={setArtist} placeholder="Artist" />

      <Pressable style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Add to Library</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  imagePicker: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  img: { width: '100%', height: '100%' },
  imageHint: { color: '#9ca3af', fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 16 },
  saveBtn: { backgroundColor: accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
