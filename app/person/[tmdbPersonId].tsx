import { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPersonDetails, fetchPersonCredits } from '@/api/tmdb';
import { syncItemData } from '@/api/sync';
import { Chip, haptic, Icon, SectionHeader, Text } from '@/components/ui';
import { colors, space, radius } from '@/constants/theme';
import { addItem, q } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

// One entry in the person's filmography, normalized from TMDB combined_credits.
type FilmEntry = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  poster: string | null;
  year: number | null;
  rating: number | null;
  overview: string;
  role: string; // character or job
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'Series' },
] as const;

export default function PersonScreen() {
  const { tmdbPersonId } = useLocalSearchParams<{ tmdbPersonId: string }>();
  const [person, setPerson] = useState<any>(null);
  const [films, setFilms] = useState<FilmEntry[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Live library membership so add buttons flip instantly.
  const inLib = useLiveQuery(q.sourceIds());
  const libKeys = useMemo(
    () => new Set(inLib.data.map((r) => `${r.source}-${r.sourceId}`)),
    [inLib.data]
  );

  useEffect(() => {
    if (!tmdbPersonId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [personData, creditsData] = await Promise.all([
          fetchPersonDetails(tmdbPersonId),
          fetchPersonCredits(tmdbPersonId),
        ]);
        if (cancelled) return;
        setPerson(personData);

        // Merge acting + crew credits (director/writer), dedup by media id, sort by popularity.
        const seen = new Map<number, FilmEntry>();
        const push = (c: any, role: string) => {
          if (!c.id || seen.has(c.id)) return;
          if (c.media_type !== 'movie' && c.media_type !== 'tv') return;
          seen.set(c.id, {
            tmdbId: c.id,
            mediaType: c.media_type,
            title: c.media_type === 'movie' ? c.title : c.name,
            poster: c.poster_path ? `https://image.tmdb.org/t/p/w342${c.poster_path}` : null,
            year: (() => {
              const d = c.media_type === 'movie' ? c.release_date : c.first_air_date;
              return d ? Number(d.slice(0, 4)) : null;
            })(),
            rating: c.vote_average ?? null,
            overview: c.overview ?? '',
            role,
          });
        };
        const castCredits = [...((creditsData.cast ?? []) as any[])].sort(
          (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)
        );
        for (const c of castCredits) push(c, c.character || 'Actor');
        const crewCredits = ((creditsData.crew ?? []) as any[])
          .filter((c) => c.job === 'Director' || c.job === 'Writer' || c.job === 'Screenplay')
          .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        for (const c of crewCredits) push(c, c.job);
        setFilms([...seen.values()]);
      } catch (e) {
        console.error('Error loading person:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tmdbPersonId]);

  const filtered = films.filter((f) => filter === 'all' || f.mediaType === filter);

  const add = async (f: FilmEntry) => {
    haptic.success();
    const category = f.mediaType === 'movie' ? 'movie' : 'series';
    const newId = await addItem({
      category,
      source: 'tmdb',
      sourceId: String(f.tmdbId),
      title: f.title,
      imageUrl: f.poster,
      year: f.year,
      catalogRating: f.rating,
      metadata: JSON.stringify({ overview: f.overview }),
      status: 'want',
    });
    syncItemData(newId, String(f.tmdbId), category);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text color={colors.textMuted}>Person not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} bounces={false}>
      <Stack.Screen options={{ title: person.name, headerTransparent: true, headerTintColor: colors.text }} />

      {/* Hero */}
      <View style={styles.heroSection}>
        {person.profile_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w500${person.profile_path}` }}
            style={styles.profileImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.profileImage, styles.profileFallback]}>
            <Icon name="person" size={64} color={colors.textFaint} />
          </View>
        )}
        <LinearGradient colors={['transparent', colors.bg]} style={styles.heroGradient} />
        <View style={styles.heroText}>
          <Text variant="display">{person.name}</Text>
          {person.known_for_department ? (
            <Text variant="caption" color={colors.textMuted}>
              {person.known_for_department}
              {person.birthday ? ` · Born ${person.birthday}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {person.biography ? (
          <>
            <SectionHeader title="Bio" />
            <Pressable onPress={() => setBioExpanded((v) => !v)}>
              <Text variant="body" muted numberOfLines={bioExpanded ? undefined : 4} style={styles.bio}>
                {person.biography}
              </Text>
              <Text variant="micro" color={colors.accent}>
                {bioExpanded ? 'SHOW LESS' : 'READ MORE'}
              </Text>
            </Pressable>
          </>
        ) : null}

        <SectionHeader title="Filmography" />
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text color={colors.textMuted}>No filmography available</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((f) => {
              const added = libKeys.has(`tmdb-${f.tmdbId}`);
              return (
                <View key={`${f.mediaType}-${f.tmdbId}`} style={styles.gridItem}>
                  <View>
                    {f.poster ? (
                      <Image source={{ uri: f.poster }} style={styles.poster} contentFit="cover" />
                    ) : (
                      <View style={[styles.poster, styles.posterFallback]}>
                        <Icon name="image" size={32} color={colors.textFaint} />
                      </View>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={added ? `${f.title} is in your library` : `Add ${f.title}`}
                      disabled={added}
                      onPress={() => add(f)}
                      style={[styles.addBtn, added && styles.addBtnDone]}>
                      <Icon name={added ? 'checkmark' : 'add'} size={18} color={colors.onAccent} />
                    </Pressable>
                  </View>
                  <Text variant="caption" numberOfLines={2} style={styles.title}>
                    {f.title}
                  </Text>
                  <Text variant="micro" color={colors.textMuted} numberOfLines={1}>
                    {[f.year, f.role].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },

  heroSection: { width: '100%', height: 360 },
  profileImage: { width: '100%', height: '100%' },
  profileFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
  heroText: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.md, gap: 4 },

  body: { paddingHorizontal: space.lg },
  bio: { lineHeight: 21, marginBottom: space.xs },

  filterRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },

  empty: { paddingVertical: space.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  gridItem: { width: '47.5%', marginBottom: space.md },
  poster: { width: '100%', aspectRatio: 2 / 3, borderRadius: radius.md, marginBottom: space.sm },
  posterFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 2 },
  addBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDone: { backgroundColor: colors.success },
});
