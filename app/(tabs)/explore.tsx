import { searchJikan } from '@/api/jikan';
import { searchTmdb, tmdbConfigured } from '@/api/tmdb';
import type { SearchResult } from '@/api/types';
import { Chip, EmptyState, haptic, Icon, Poster, Screen, Skeleton, Text } from '@/components/ui';
import { useDebounced } from '@/components/useDebounced';
import { CATEGORY_ICON } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { addItem } from '@/db/queries';
import type { Category } from '@/db/schema';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

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
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const hits =
          tab === 'anime' ? await searchJikan(debounced) : await searchTmdb(tab as 'movie' | 'series', debounced);
        if (!cancelled) setResults(hits);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Search failed');
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
    try {
      await addItem({ ...r, status: 'want' });
      setAdded((s) => new Set(s).add(r.key));
      haptic.success();
    } catch {
      haptic.warning();
      setError('Could not add. Try again.');
    }
  };

  const needsToken = tab !== 'anime' && !tmdbConfigured();
  const showEmpty = !loading && !error && debounced.trim().length >= 2 && results.length === 0 && !needsToken;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text variant="display" style={styles.title}>
          Explore
        </Text>
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.search}
            placeholder="Search titles…"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Icon name="close-circle" size={18} color={colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              active={tab === t.key}
              activeIcon={CATEGORY_ICON[t.key]}
              onPress={() => setTab(t.key)}
            />
          ))}
        </View>
      </View>

      {needsToken ? (
        <View style={styles.pad}>
          <EmptyState
            icon="key-outline"
            title="TMDB key needed"
            subtitle="Movie and series search needs a TMDB token. Anime search works without one."
          />
        </View>
      ) : error ? (
        <View style={styles.pad}>
          <EmptyState icon="cloud-offline-outline" title="Search failed" subtitle={error} />
        </View>
      ) : loading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.row}>
              <Skeleton width={46} height={68} />
              <View style={styles.rowInfo}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="40%" height={11} style={{ marginTop: 6 }} />
              </View>
            </View>
          ))}
        </View>
      ) : showEmpty ? (
        <View style={styles.pad}>
          <EmptyState icon="search-outline" title="No results" subtitle={`Nothing found for “${debounced}”.`} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isAdded = added.has(item.key);
            return (
              <View style={styles.row}>
                <Poster
                  uri={item.imageUrl}
                  title={item.title}
                  width={46}
                  height={68}
                  fallbackIcon={CATEGORY_ICON[item.category]}
                />
                <View style={styles.rowInfo}>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text variant="micro" color={colors.textMuted} style={{ marginTop: 2 }}>
                    {item.year ?? '—'}
                    {item.catalogRating ? `  ·  ★ ${item.catalogRating.toFixed(1)}` : ''}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isAdded ? `${item.title} added` : `Add ${item.title}`}
                  disabled={isAdded}
                  onPress={() => add(item)}
                  style={({ pressed }) => [
                    styles.addBtn,
                    isAdded && styles.addBtnDone,
                    pressed && { transform: [{ scale: 0.92 }] },
                  ]}>
                  <Icon name={isAdded ? 'checkmark' : 'add'} size={22} color={colors.onAccent} />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingTop: space.lg },
  title: { marginBottom: space.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  search: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  tabs: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  pad: { paddingHorizontal: space.lg },
  list: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowInfo: { flex: 1 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDone: { backgroundColor: colors.success },
});
