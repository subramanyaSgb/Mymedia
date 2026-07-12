import { fetchAlbum, type Album } from '@/api/music';
import { EmptyState, haptic, Icon, Screen, Text } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { addItem, deleteBySource, q } from '@/db/queries';
import type { SearchResult } from '@/api/types';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function AlbumScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const [album, setAlbum] = useState<Album | null | 'loading'>('loading');

  const inLib = useLiveQuery(q.sourceIds());
  const libKeys = useMemo(
    () => new Set(inLib.data.map((r) => `${r.source}-${r.sourceId}`)),
    [inLib.data]
  );

  useEffect(() => {
    if (!albumId) return;
    fetchAlbum(albumId).then(setAlbum);
  }, [albumId]);

  const save = async (t: SearchResult) => {
    haptic.success();
    await addItem({ ...t, status: 'finished' }); // songs: "saved" == in library; status unused in UI
  };

  const remove = async (t: SearchResult) => {
    if (!t.sourceId) return;
    haptic.light();
    await deleteBySource(t.source, t.sourceId);
  };

  const saveAll = async () => {
    if (album === 'loading' || !album) return;
    haptic.success();
    for (const t of album.tracks) {
      if (!libKeys.has(`${t.source}-${t.sourceId}`)) await addItem({ ...t, status: 'finished' });
    }
  };

  if (album === 'loading') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!album) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Album' }} />
        <EmptyState icon="musical-notes-outline" title="Album unavailable" subtitle="Couldn't load this album." />
      </Screen>
    );
  }

  const savedCount = album.tracks.filter((t) => libKeys.has(`${t.source}-${t.sourceId}`)).length;
  const allSaved = savedCount === album.tracks.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: album.name }} />

      <View style={styles.header}>
        {album.cover ? (
          <Image source={{ uri: album.cover }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Icon name="musical-notes" size={40} color={colors.textFaint} />
          </View>
        )}
        <Text variant="h1" center style={styles.albumName}>
          {album.name}
        </Text>
        {album.artist ? (
          <Text variant="caption" color={colors.textMuted} center>
            {album.artist}
            {album.year ? ` · ${album.year}` : ''}
          </Text>
        ) : null}
        <Text variant="micro" color={colors.textFaint} center>
          {album.tracks.length} tracks · {savedCount} saved
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={saveAll}
          disabled={allSaved}
          style={({ pressed }) => [styles.saveAll, allSaved && styles.saveAllDone, pressed && { opacity: 0.85 }]}>
          <Icon name={allSaved ? 'checkmark-done' : 'add'} size={18} color={colors.onAccent} />
          <Text variant="bodyStrong" color={colors.onAccent}>
            {allSaved ? 'All saved' : 'Save whole album'}
          </Text>
        </Pressable>
      </View>

      {album.tracks.map((t, i) => {
        const saved = libKeys.has(`${t.source}-${t.sourceId}`);
        const meta = (() => {
          try {
            return JSON.parse(t.metadata ?? '{}');
          } catch {
            return {};
          }
        })();
        return (
          <View key={t.key} style={styles.trackRow}>
            <Text variant="caption" color={colors.textFaint} style={styles.trackNum}>
              {i + 1}
            </Text>
            <View style={{ flex: 1 }}>
              <Text variant="body" numberOfLines={1} style={{ width: '100%' }}>
                {t.title}
              </Text>
              {meta.artist ? (
                <Text variant="micro" color={colors.textMuted} numberOfLines={1}>
                  {meta.artist}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? `Remove ${t.title}` : `Save ${t.title}`}
              onPress={() => (saved ? remove(t) : save(t))}
              style={[styles.trackBtn, saved && styles.trackBtnDone]}>
              <Icon name={saved ? 'checkmark' : 'add'} size={18} color={colors.onAccent} />
            </Pressable>
          </View>
        );
      })}
      <View style={{ height: space.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { alignItems: 'center', gap: space.xs, marginBottom: space.lg },
  cover: { width: 160, height: 160, borderRadius: radius.lg, marginBottom: space.md },
  coverFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  albumName: { marginTop: space.xs },
  saveAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    marginTop: space.md,
  },
  saveAllDone: { backgroundColor: colors.success },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  trackNum: { width: 22, textAlign: 'center' },
  trackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnDone: { backgroundColor: colors.success },
});
