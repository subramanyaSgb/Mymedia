import { useDebounced } from '@/components/useDebounced';
import { accent } from '@/constants/Colors';
import { searchJikan } from '@/api/jikan';
import { searchTmdb, tmdbConfigured } from '@/api/tmdb';
import type { SearchResult } from '@/api/types';
import { addItem } from '@/db/queries';
import type { Category } from '@/db/schema';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS: { key: Category; label: string }[] = [
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'anime', label: 'Anime' },
];

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: Category }>();
  const [tab, setTab] = useState<Category>(params.category ?? 'movie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const debounced = useDebounced(query, 400);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (debounced.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const hits =
          tab === 'anime'
            ? await searchJikan(debounced)
            : await searchTmdb(tab as 'movie' | 'series', debounced);
        if (!cancelled) setResults(hits);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Search failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, tab]);

  const add = async (r: SearchResult) => {
    await addItem({ ...r, status: 'want' });
    setAdded((s) => new Set(s).add(r.key));
  };

  const needsToken = tab !== 'anime' && !tmdbConfigured();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.h1}>Explore</Text>
        <TextInput
          style={styles.search}
          placeholder="Search titles…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {needsToken ? (
        <Text style={styles.note}>
          Add a TMDB token (app.json → extra.tmdbToken) to search movies and series. Anime search
          works without a key.
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : null}

      <FlatList
        data={results}
        keyExtractor={(r) => r.key}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.thumb}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumbImg} contentFit="cover" />
              ) : (
                <Text style={styles.thumbLetter}>{item.title.slice(0, 1)}</Text>
              )}
            </View>
            <View style={styles.rowInfo}>
              <Text numberOfLines={2} style={styles.rowTitle}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta}>
                {item.year ?? '—'}
                {item.catalogRating ? ` · ★ ${item.catalogRating.toFixed(1)}` : ''}
              </Text>
            </View>
            <Pressable
              disabled={added.has(item.key)}
              onPress={() => add(item)}
              style={[styles.addBtn, added.has(item.key) && styles.addBtnDone]}>
              <Text style={styles.addBtnText}>{added.has(item.key) ? '✓' : '＋'}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          !loading && debounced.length >= 2 && !needsToken ? (
            <Text style={styles.note}>No results.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, paddingBottom: 8 },
  h1: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  search: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 12, fontSize: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: accent },
  tabText: { fontWeight: '600', color: '#374151' },
  tabTextActive: { color: '#fff' },
  note: { color: '#6b7280', padding: 16, lineHeight: 20 },
  error: { color: '#dc2626', paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  thumb: {
    width: 46,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbLetter: { fontSize: 20, color: '#9ca3af', fontWeight: '700' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' },
  addBtnDone: { backgroundColor: '#22c55e' },
  addBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
