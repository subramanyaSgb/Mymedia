import { ensureRuntime } from '@/api/runtime';
import { searchGames } from '@/api/games';
import { searchJikan } from '@/api/jikan';
import { searchSongs } from '@/api/music';
import { syncItemData } from '@/api/sync';
import { searchTmdb, tmdbConfigured } from '@/api/tmdb';
import type { SearchResult } from '@/api/types';
import { StatusPicker } from '@/components/StatusPicker';
import { LANGUAGES } from '@/constants/languages';
import { Chip, EmptyState, haptic, Icon, Poster, Screen, Skeleton, Text } from '@/components/ui';
import { useDebounced } from '@/components/useDebounced';
import { CATEGORY_ICON } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { addItem, deleteBySource, q } from '@/db/queries';
import type { Category, Item, Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

const TABS: { key: Category; label: string }[] = [
  { key: 'movie', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'anime', label: 'Anime' },
  { key: 'song', label: 'Songs' },
  { key: 'game', label: 'Games' },
];

async function runSearch(tab: Category, query: string): Promise<SearchResult[]> {
  if (tab === 'anime') return searchJikan(query);
  if (tab === 'song') return searchSongs(query);
  if (tab === 'game') return searchGames(query);
  return searchTmdb(tab as 'movie' | 'series', query);
}

const readMeta = (item: { metadata?: string | null }) => {
  try {
    return JSON.parse(item.metadata ?? '{}');
  } catch {
    return {};
  }
};
const songAlbumId = (item: { metadata?: string | null }): string | null => readMeta(item).albumId ?? null;
const songAlbumName = (item: { metadata?: string | null }): string | null => readMeta(item).albumName ?? null;

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: Category }>();
  const [tab, setTab] = useState<Category>(params.category ?? 'movie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(query, 400);

  // Which catalog items are ALREADY in the library — live, so deletes reflect here instantly.
  const inLib = useLiveQuery(q.sourceIds());
  const libKeys = new Set(inLib.data.map((r) => `${r.source}-${r.sourceId}`));

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
        const hits = await runSearch(tab, debounced);
        if (!cancelled) setResults(hits);
      } catch (e: any) {
        if (!cancelled) {
          setError(
            tab === 'anime'
              ? 'Anime service is busy. Pull to retry in a moment.'
              : e?.message ?? 'Search failed'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced, tab]);

  const doAdd = async (r: SearchResult, status: Status) => {
    try {
      const id = await addItem({ ...r, status });
      haptic.success();
      if (r.source === 'tmdb') syncItemData(id, r.sourceId, r.category);
      if (status === 'finished') ensureRuntime({ ...r, id, status } as unknown as Item);
    } catch {
      haptic.warning();
      setError('Could not add. Try again.');
    }
  };

  const remove = async (r: SearchResult) => {
    if (!r.sourceId) return;
    await deleteBySource(r.source, r.sourceId);
    haptic.light();
  };

  // Long-press → themed status sheet. Tap → quick-add as "Want".
  const [pending, setPending] = useState<SearchResult | null>(null);

  // Language filter — only meaningful for TMDB results (movies/series).
  const [language, setLanguage] = useState<string | 'all'>('all');
  const isTmdbTab = tab === 'movie' || tab === 'series';
  const shown =
    isTmdbTab && language !== 'all'
      ? results.filter((r) => {
          try {
            return JSON.parse(r.metadata ?? '{}').originalLanguage === language;
          } catch {
            return false;
          }
        })
      : results;

  const needsToken = isTmdbTab && !tmdbConfigured();
  const showEmpty = !loading && !error && debounced.trim().length >= 2 && shown.length === 0 && !needsToken;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text variant="caption" color={colors.textFaint}>
          Movies · Series · Anime · Songs · Games
        </Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Chip
              key={t.key}
              label={t.label}
              active={tab === t.key}
              activeIcon={CATEGORY_ICON[t.key]}
              onPress={() => setTab(t.key)}
            />
          ))}
        </ScrollView>
        {isTmdbTab ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
            <Chip label="All" active={language === 'all'} onPress={() => setLanguage('all')} />
            {LANGUAGES.map((l) => (
              <Chip key={l.code} label={l.label} active={language === l.code} onPress={() => setLanguage(l.code)} />
            ))}
          </ScrollView>
        ) : null}
        <Text variant="micro" color={colors.textFaint} style={styles.hint}>
          Tap + to add · long-press to pick a list · tap ✓ to remove
        </Text>
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
          <EmptyState icon="cloud-offline-outline" title="Search unavailable" subtitle={error} />
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
          data={shown}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isAdded = libKeys.has(`${item.source}-${item.sourceId}`);
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
                  <Text variant="bodyStrong" numberOfLines={2} ellipsizeMode="tail" style={styles.rowTitle}>
                    {item.title}
                  </Text>
                  <View style={styles.metaLine}>
                    <Text variant="micro" color={colors.textMuted}>
                      {item.year ?? '—'}
                    </Text>
                    {item.catalogRating ? (
                      <>
                        <Icon name="star" size={11} color={colors.accent} />
                        <Text variant="micro" color={colors.textMuted}>
                          {item.catalogRating.toFixed(1)}
                        </Text>
                      </>
                    ) : null}
                  </View>
                  {item.metadata ? (() => {
                    try {
                      const meta = JSON.parse(item.metadata);
                      if (item.category === 'song' && meta.artist) {
                        return (
                          <Text variant="micro" color={colors.textMuted} numberOfLines={1}>
                            {meta.artist}
                          </Text>
                        );
                      }
                      return meta.genres?.length > 0 ? (
                        <View style={styles.genresRow}>
                          {meta.genres.slice(0, 2).map((g: string, idx: number) => (
                            <Chip key={idx} label={g} />
                          ))}
                        </View>
                      ) : null;
                    } catch {
                      return null;
                    }
                  })() : null}
                  {item.category === 'song' && songAlbumId(item) ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="View album"
                      onPress={() =>
                        router.push({ pathname: '/album/[albumId]', params: { albumId: songAlbumId(item)! } })
                      }
                      hitSlop={6}
                      style={styles.albumLink}>
                      <Icon name="albums-outline" size={12} color={colors.accent} />
                      <Text variant="micro" color={colors.accent} numberOfLines={1}>
                        {songAlbumName(item) ?? 'View album'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isAdded ? `Remove ${item.title}` : `Add ${item.title}`}
                  onPress={() => (isAdded ? remove(item) : doAdd(item, 'want'))}
                  onLongPress={() => !isAdded && setPending(item)}
                  delayLongPress={280}
                  hitSlop={8}
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

      <StatusPicker
        visible={pending != null}
        title={pending?.title ?? ''}
        category={pending?.category}
        subtitle="Add to which list?"
        onSelect={(s) => pending && doAdd(pending, s)}
        onClose={() => setPending(null)}
      />
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
  tabs: { flexDirection: 'row', gap: space.sm, marginTop: space.md, paddingRight: space.lg },
  langRow: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, paddingRight: space.lg },
  hint: { marginTop: space.sm },
  pad: { paddingHorizontal: space.lg },
  list: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowInfo: { flex: 1 },
  rowTitle: { width: '100%' },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  genresRow: { flexDirection: 'row', gap: space.xs, marginTop: space.xs, flexWrap: 'wrap' },
  albumLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: space.xs },
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
