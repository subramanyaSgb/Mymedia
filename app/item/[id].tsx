import { accent } from '@/constants/Colors';
import { CATEGORY_LABEL, STATUSES } from '@/constants/categories';
import {
  deleteItem,
  parseMetadata,
  parseProgress,
  q,
  setStatus,
  toggleFavorite,
  updateItem,
} from '@/db/queries';
import type { Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useLiveQuery(q.byId(Number(id)));
  const item = data[0];

  if (!item) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <Text>Not found.</Text>
      </View>
    );
  }

  const meta = parseMetadata(item.metadata);
  const progress = parseProgress(item.progress);
  const isEpisodic = item.category === 'series' || item.category === 'anime';

  const confirmDelete = () =>
    Alert.alert('Delete', `Remove "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: CATEGORY_LABEL[item.category] }} />

      <View style={styles.header}>
        <View style={styles.poster}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.img} contentFit="cover" />
          ) : (
            <Text style={styles.posterLetter}>{item.title.slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{item.title}</Text>
          {item.year ? <Text style={styles.meta}>{item.year}</Text> : null}
          {meta.artist ? <Text style={styles.meta}>{meta.artist}</Text> : null}
          {meta.director ? <Text style={styles.meta}>Dir. {meta.director}</Text> : null}
          {item.catalogRating ? <Text style={styles.meta}>★ {item.catalogRating.toFixed(1)}</Text> : null}
          <Pressable onPress={() => toggleFavorite(item.id, !item.favorite)} style={styles.favBtn}>
            <Text style={{ fontSize: 22 }}>{item.favorite ? '❤️' : '🤍'}</Text>
          </Pressable>
        </View>
      </View>

      {meta.overview ? <Text style={styles.overview}>{meta.overview}</Text> : null}

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.statusRow}>
        {STATUSES.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setStatus(item.id, s.key as Status)}
            style={[styles.statusChip, item.status === s.key && styles.statusChipActive]}>
            <Text style={[styles.statusText, item.status === s.key && styles.statusTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isEpisodic ? (
        <ProgressEditor
          season={progress.season ?? 0}
          episode={progress.episode ?? 0}
          onChange={(season, episode) =>
            updateItem(item.id, { progress: JSON.stringify({ ...progress, season, episode }) })
          }
        />
      ) : null}

      <Text style={styles.sectionLabel}>Your Rating</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => updateItem(item.id, { userRating: n })}>
            <Text style={styles.star}>{(item.userRating ?? 0) >= n ? '★' : '☆'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Notes</Text>
      <TextInput
        style={styles.notes}
        multiline
        placeholder="Add a note…"
        defaultValue={item.notes ?? ''}
        onEndEditing={(e) => updateItem(item.id, { notes: e.nativeEvent.text })}
      />

      <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>Delete from library</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProgressEditor({
  season,
  episode,
  onChange,
}: {
  season: number;
  episode: number;
  onChange: (season: number, episode: number) => void;
}) {
  const [s, setS] = useState(season);
  const [e, setE] = useState(episode);
  const commit = (ns: number, ne: number) => {
    setS(ns);
    setE(ne);
    onChange(ns, ne);
  };
  return (
    <View>
      <Text style={styles.sectionLabel}>Progress</Text>
      <View style={styles.progRow}>
        <Stepper label="Season" value={s} onDec={() => commit(Math.max(0, s - 1), e)} onInc={() => commit(s + 1, e)} />
        <Stepper label="Episode" value={e} onDec={() => commit(s, Math.max(0, e - 1))} onInc={() => commit(s, e + 1)} />
      </View>
    </View>
  );
}

function Stepper({ label, value, onDec, onInc }: { label: string; value: number; onDec: () => void; onInc: () => void }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onDec} style={styles.stepBtn}><Text style={styles.stepBtnText}>−</Text></Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable onPress={onInc} style={styles.stepBtn}><Text style={styles.stepBtnText}>+</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', gap: 14 },
  poster: {
    width: 110,
    height: 160,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  posterLetter: { fontSize: 40, fontWeight: '700', color: '#9ca3af' },
  headerInfo: { flex: 1, justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: '800' },
  meta: { color: '#6b7280', marginTop: 2 },
  favBtn: { marginTop: 8 },
  overview: { marginTop: 16, color: '#374151', lineHeight: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginTop: 22, marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#f3f4f6' },
  statusChipActive: { backgroundColor: accent },
  statusText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  statusTextActive: { color: '#fff' },
  starRow: { flexDirection: 'row', gap: 4 },
  star: { fontSize: 30, color: accent },
  notes: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  progRow: { flexDirection: 'row', gap: 16 },
  stepper: { flex: 1 },
  stepperLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 20, fontWeight: '700', color: accent },
  stepperValue: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  deleteBtn: { marginTop: 32, alignItems: 'center' },
  deleteText: { color: '#dc2626', fontWeight: '600' },
});
