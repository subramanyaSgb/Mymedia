import { ensureRuntime } from '@/api/runtime';
import { findSoundtrackAlbumId } from '@/api/music';
import { syncItemData } from '@/api/sync';
import {
  fetchCollection,
  fetchTvRecommendations,
  fetchVideos,
  fetchWatchProviders,
  tmdbConfigured,
} from '@/api/tmdb';
import { CollectionPicker } from '@/components/CollectionPicker';
import { TrailerPlayer } from '@/components/TrailerPlayer';
import { Button, Chip, haptic, Icon, SectionHeader, Text } from '@/components/ui';
import { CATEGORY_ICON, CATEGORY_LABEL, CATEGORY_STATUS, STATUS_ICON, statuses } from '@/constants/categories';
import { languageName } from '@/constants/languages';
import { PROVIDER_LINKS } from '@/constants/providers';
import { colors, radius, space } from '@/constants/theme';
import {
  addItem,
  deleteItem,
  hasCredits,
  parseMetadata,
  parseProgress,
  q,
  setStatus,
  toggleFavorite,
  updateItem,
} from '@/db/queries';
import type { Item, Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, updatedAt } = useLiveQuery(q.byId(Number(id)));
  const item = data[0];
  const { width } = useWindowDimensions();
  const [showCollections, setShowCollections] = useState(false);

  // Backfill: older items (or items added before sync existed) get credits on first open.
  useEffect(() => {
    if (!item || item.source !== 'tmdb' || !item.sourceId) return;
    hasCredits(item.id).then((has) => {
      if (!has) syncItemData(item.id, item.sourceId, item.category);
    });
  }, [item?.id, item?.source, item?.sourceId]);

  if (!item) {
    const loaded = updatedAt != null;
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        {loaded ? (
          <>
            <Icon name="alert-circle-outline" size={32} color={colors.textFaint} />
            <Text variant="body" muted style={{ marginTop: space.sm }}>
              This item no longer exists.
            </Text>
          </>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }

  const meta = parseMetadata(item.metadata);
  const progress = parseProgress(item.progress);
  const isEpisodic = item.category === 'series' || item.category === 'anime';
  const heroH = Math.round(width * 1.1);

  const confirmDelete = () =>
    Alert.alert('Delete', `Remove "${item.title}" from your library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          haptic.medium();
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} bounces={false}>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerTintColor: colors.text,
        }}
      />

      {/* Full-bleed hero: poster art fading into the black background. */}
      <View style={[styles.hero, { height: heroH }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.heroImg} contentFit="cover" transition={250} />
        ) : (
          <View style={styles.heroFallback}>
            <Icon name={CATEGORY_ICON[item.category]} size={64} color={colors.textFaint} />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.55)', colors.bg]}
          locations={[0, 0.35, 0.75, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroText}>
          <Text variant="kicker" color={colors.textMuted}>
            {CATEGORY_LABEL[item.category].toUpperCase()}
            {item.year ? `  ·  ${item.year}` : ''}
          </Text>
          <Text variant="display" style={styles.title}>
            {item.title}
          </Text>
          <View style={styles.metaRow}>
            {item.catalogRating ? (
              <View style={styles.metaChip}>
                <Icon name="star" size={13} color={colors.accent} />
                <Text variant="caption" muted>
                  {item.catalogRating.toFixed(1)}
                </Text>
              </View>
            ) : null}
            {meta.runtime && !isEpisodic ? (
              <Text variant="caption" muted>
                {formatRuntime(meta.runtime)}
              </Text>
            ) : null}
            {isEpisodic && meta.seasons ? (
              <Text variant="caption" muted>
                {meta.seasons} {meta.seasons === 1 ? 'season' : 'seasons'}
                {meta.episodes ? ` · ${meta.episodes} ep` : ''}
              </Text>
            ) : null}
            {meta.artist ? (
              <Text variant="caption" muted>
                {meta.artist}
              </Text>
            ) : null}
            {meta.originalLanguage ? (
              <Text variant="caption" muted>
                {languageName(meta.originalLanguage)}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
              accessibilityState={{ selected: item.favorite }}
              hitSlop={10}
              onPress={() => {
                haptic.light();
                toggleFavorite(item.id, !item.favorite);
              }}>
              <Icon
                name={item.favorite ? 'heart' : 'heart-outline'}
                size={20}
                color={item.favorite ? colors.danger : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Status — one connected segmented control, category-aware vocabulary. */}
        <View style={styles.segment}>
          {statuses(item.category).map((s, i) => {
            const active = item.status === s.key;
            return (
              <Pressable
                key={s.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  haptic.light();
                  setStatus(item.id, s.key as Status);
                  if (s.key === 'finished') ensureRuntime(item as Item);
                }}
                style={[
                  styles.segmentBtn,
                  active && styles.segmentActive,
                  i > 0 && styles.segmentDivider,
                ]}>
                <Icon
                  name={STATUS_ICON[s.key]}
                  size={15}
                  color={active ? colors.onAccent : colors.textFaint}
                />
                <Text variant="micro" color={active ? colors.onAccent : colors.textMuted}>
                  {CATEGORY_STATUS[item.category].short[s.key]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label="Add to collection"
          variant="ghost"
          icon="albums-outline"
          onPress={() => setShowCollections(true)}
          style={styles.collectionBtn}
        />

        {meta.overview ? (
          <>
            <SectionHeader title="Overview" />
            <Text variant="body" muted style={styles.overview}>
              {meta.overview}
            </Text>
          </>
        ) : null}

        {meta.genres && meta.genres.length > 0 ? (
          <>
            <SectionHeader title="Genres" />
            <View style={styles.genresRow}>
              {meta.genres.map((genre, idx) => (
                <Chip key={idx} label={genre} />
              ))}
            </View>
          </>
        ) : null}
      </View>

      {/* Songs: album link (opens full soundtrack). */}
      {item.category === 'song' && meta.albumId ? (
        <View style={styles.section}>
          <SectionHeader title="Album" />
          <Button
            label={meta.albumName ? `View "${meta.albumName}"` : 'View full album'}
            variant="ghost"
            icon="albums-outline"
            onPress={() =>
              router.push({ pathname: '/album/[albumId]', params: { albumId: meta.albumId! } })
            }
          />
        </View>
      ) : null}

      {/* Trailer + streaming providers for TMDB titles. */}
      {item.source === 'tmdb' && item.sourceId ? (
        <>
          <TrailerSection kind={item.category === 'movie' ? 'movie' : 'series'} sourceId={item.sourceId} />
          <WhereToWatchSection kind={item.category === 'movie' ? 'movie' : 'series'} sourceId={item.sourceId} />
        </>
      ) : null}

      {/* Soundtrack — best-match album for movies. */}
      {item.category === 'movie' ? <SoundtrackSection title={item.title} /> : null}

      {/* Cast — clickable, opens the person's profile + filmography. */}
      <CastSection itemId={item.id} />

      {/* Crew — director & writers, also clickable. */}
      <CrewSection itemId={item.id} role="director" title="Director" />
      <CrewSection itemId={item.id} role="writer" title="Writers" />

      {/* Same series: movie collections from TMDB, recommendations for TV. */}
      {item.category === 'movie' && meta.collectionId ? (
        <CollectionRail collectionId={meta.collectionId} collectionName={meta.collectionName} currentSourceId={item.sourceId} />
      ) : null}
      {item.category === 'series' && item.source === 'tmdb' && item.sourceId ? (
        <RecommendationsRail sourceId={item.sourceId} />
      ) : null}

      <View style={styles.body}>
        {isEpisodic ? (
          <>
            <SectionHeader title="Progress" />
            <ProgressEditor
              season={progress.season ?? 0}
              episode={progress.episode ?? 0}
              onChange={(season, episode) =>
                updateItem(item.id, { progress: JSON.stringify({ ...progress, season, episode }) })
              }
            />
          </>
        ) : null}

        <SectionHeader title="Your rating" />
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${n} of 5`}
              hitSlop={6}
              onPress={() => {
                haptic.light();
                updateItem(item.id, { userRating: n });
              }}>
              <Icon
                name={(item.userRating ?? 0) >= n ? 'star' : 'star-outline'}
                size={26}
                color={(item.userRating ?? 0) >= n ? colors.accent : colors.textFaint}
              />
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Notes" />
        <TextInput
          style={styles.notes}
          multiline
          placeholder="Add a note…"
          placeholderTextColor={colors.textFaint}
          defaultValue={item.notes ?? ''}
          onEndEditing={(e) => updateItem(item.id, { notes: e.nativeEvent.text })}
        />

        <Button
          label="Remove from library"
          variant="danger"
          icon="trash-outline"
          onPress={confirmDelete}
          style={styles.delete}
        />
      </View>

      <CollectionPicker
        visible={showCollections}
        itemIds={[item.id]}
        onClose={() => setShowCollections(false)}
      />
    </ScrollView>
  );
}

// --- Sections ---

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
    haptic.light();
    setS(ns);
    setE(ne);
    onChange(ns, ne);
  };
  return (
    <View style={styles.progRow}>
      <Stepper label="Season" value={s} onDec={() => commit(Math.max(0, s - 1), e)} onInc={() => commit(s + 1, e)} />
      <Stepper label="Episode" value={e} onDec={() => commit(s, Math.max(0, e - 1))} onInc={() => commit(s, e + 1)} />
    </View>
  );
}

function Stepper({ label, value, onDec, onInc }: { label: string; value: number; onDec: () => void; onInc: () => void }) {
  return (
    <View style={styles.stepper}>
      <Text variant="micro" color={colors.textFaint}>
        {label.toUpperCase()}
      </Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onDec} accessibilityLabel={`Decrease ${label}`} style={styles.stepBtn}>
          <Icon name="remove" size={18} color={colors.text} />
        </Pressable>
        <Text variant="h2" style={styles.stepperValue}>
          {value}
        </Text>
        <Pressable onPress={onInc} accessibilityLabel={`Increase ${label}`} style={styles.stepBtn}>
          <Icon name="add" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

function SoundtrackSection({ title }: { title: string }) {
  const [albumId, setAlbumId] = useState<string | null | 'loading'>('loading');

  useEffect(() => {
    findSoundtrackAlbumId(title).then(setAlbumId);
  }, [title]);

  if (albumId === 'loading' || !albumId) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Soundtrack" />
      <Button
        label="View soundtrack album"
        variant="ghost"
        icon="musical-notes-outline"
        onPress={() => router.push({ pathname: '/album/[albumId]', params: { albumId } })}
      />
      <Text variant="micro" color={colors.textFaint} style={{ marginTop: space.xs }}>
        Best match by title — open to save any track
      </Text>
    </View>
  );
}

function TrailerSection({ kind, sourceId }: { kind: 'movie' | 'series'; sourceId: string }) {
  const [video, setVideo] = useState<{ key: string; name: string } | null>(null);

  useEffect(() => {
    if (!tmdbConfigured()) return;
    fetchVideos(kind, sourceId)
      .then((videos) => setVideo(videos[0] ?? null))
      .catch(() => {});
  }, [kind, sourceId]);

  if (!video) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Trailer" />
      <TrailerPlayer videoKey={video.key} name={video.name} />
    </View>
  );
}

type Provider = { id: number; name: string; logo: string | null; kind: 'stream' | 'rent' | 'buy' };

function WhereToWatchSection({ kind, sourceId }: { kind: 'movie' | 'series'; sourceId: string }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [tmdbLink, setTmdbLink] = useState<string | null>(null);

  useEffect(() => {
    if (!tmdbConfigured()) return;
    fetchWatchProviders(kind, sourceId)
      .then((r) => {
        setProviders(r.providers);
        setTmdbLink(r.link);
      })
      .catch(() => {});
  }, [kind, sourceId]);

  if (providers.length === 0) return null;

  const open = (p: Provider) => {
    haptic.light();
    const url = PROVIDER_LINKS[p.id]?.url ?? tmdbLink;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Where to Watch" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerScroll}>
        {providers.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${p.name}`}
            onPress={() => open(p)}
            style={({ pressed }) => [styles.providerCard, pressed && { opacity: 0.8 }]}>
            {p.logo ? (
              <Image source={{ uri: p.logo }} style={styles.providerLogo} contentFit="cover" />
            ) : (
              <View style={[styles.providerLogo, styles.providerLogoFallback]}>
                <Icon name="tv-outline" size={20} color={colors.textFaint} />
              </View>
            )}
            <Text variant="micro" numberOfLines={1} style={styles.providerName}>
              {p.name}
            </Text>
            <Text variant="micro" color={colors.textFaint}>
              {p.kind === 'stream' ? 'STREAM' : p.kind === 'rent' ? 'RENT' : 'BUY'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text variant="micro" color={colors.textFaint} style={styles.providerHint}>
        Tap to open the app — search the title there
      </Text>
    </View>
  );
}

function CastSection({ itemId }: { itemId: number }) {
  const { data } = useLiveQuery(q.castForItem(itemId));

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Cast" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castScroll}>
        {data.map((member) => (
          <Pressable
            key={member.id}
            accessibilityRole="button"
            accessibilityLabel={`View ${member.name}`}
            disabled={!member.tmdbPersonId}
            onPress={() =>
              router.push({ pathname: '/person/[tmdbPersonId]', params: { tmdbPersonId: String(member.tmdbPersonId) } })
            }
            style={({ pressed }) => [styles.castCard, pressed && { opacity: 0.8 }]}>
            {member.profileImage ? (
              <Image
                source={{ uri: member.profileImage }}
                style={styles.castImage}
                contentFit="cover"
                transition={250}
              />
            ) : (
              <View style={[styles.castImage, styles.castImageFallback]}>
                <Icon name="person" size={28} color={colors.textFaint} />
              </View>
            )}
            <Text variant="caption" numberOfLines={2} style={styles.castName}>
              {member.name}
            </Text>
            {member.character ? (
              <Text variant="micro" muted numberOfLines={1}>
                {member.character}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function CrewSection({
  itemId,
  role,
  title,
}: {
  itemId: number;
  role: 'director' | 'writer' | 'producer' | 'cinematographer' | 'composer';
  title: string;
}) {
  const { data } = useLiveQuery(q.crewForItem(itemId, role));

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {data.map((member) => (
        <Pressable
          key={member.id}
          accessibilityRole="button"
          accessibilityLabel={`View ${member.name}`}
          disabled={!member.tmdbPersonId}
          onPress={() =>
            router.push({ pathname: '/person/[tmdbPersonId]', params: { tmdbPersonId: String(member.tmdbPersonId) } })
          }
          style={({ pressed }) => [styles.crewRow, pressed && { opacity: 0.8 }]}>
          {member.profileImage ? (
            <Image source={{ uri: member.profileImage }} style={styles.crewImage} contentFit="cover" transition={250} />
          ) : (
            <View style={[styles.crewImage, styles.crewImageFallback]}>
              <Icon name="person" size={20} color={colors.textFaint} />
            </View>
          )}
          <Text variant="body" style={{ flex: 1 }}>
            {member.name}
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.textFaint} />
        </Pressable>
      ))}
    </View>
  );
}

// TMDB catalog entry (collection part / recommendation) rendered as a poster with add button.
type CatalogEntry = {
  id: number;
  title: string;
  poster: string | null;
  year: number | null;
  rating: number | null;
  overview: string;
};

function CatalogRail({
  title,
  entries,
  category,
}: {
  title: string;
  entries: CatalogEntry[];
  category: 'movie' | 'series';
}) {
  const inLib = useLiveQuery(q.sourceIds());
  const libMap = new Map(inLib.data.map((r) => [`${r.source}-${r.sourceId}`, r.id]));

  if (entries.length === 0) return null;

  const add = async (e: CatalogEntry) => {
    haptic.success();
    const newId = await addItem({
      category,
      source: 'tmdb',
      sourceId: String(e.id),
      title: e.title,
      imageUrl: e.poster,
      year: e.year,
      catalogRating: e.rating,
      metadata: JSON.stringify({ overview: e.overview }),
      status: 'want',
    });
    syncItemData(newId, String(e.id), category);
  };

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castScroll}>
        {entries.map((e) => {
          const existingId = libMap.get(`tmdb-${e.id}`);
          const added = existingId != null;
          return (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.title}
              onPress={() =>
                added
                  ? router.push({ pathname: '/item/[id]', params: { id: String(existingId) } })
                  : add(e)
              }
              style={({ pressed }) => [styles.seriesCard, pressed && { opacity: 0.85 }]}>
              {e.poster ? (
                <Image source={{ uri: e.poster }} style={styles.seriesImage} contentFit="cover" transition={250} />
              ) : (
                <View style={[styles.seriesImage, styles.seriesImageFallback]}>
                  <Icon name={CATEGORY_ICON[category]} size={24} color={colors.textFaint} />
                </View>
              )}
              <View style={[styles.railAddBtn, added && styles.railAddBtnDone]}>
                <Icon name={added ? 'checkmark' : 'add'} size={16} color={colors.onAccent} />
              </View>
              <Text variant="caption" numberOfLines={2} style={styles.seriesTitle}>
                {e.title}
              </Text>
              {e.year ? (
                <Text variant="micro" muted numberOfLines={1}>
                  {e.year}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CollectionRail({
  collectionId,
  collectionName,
  currentSourceId,
}: {
  collectionId: number;
  collectionName?: string;
  currentSourceId: string | null;
}) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    if (!tmdbConfigured()) return;
    fetchCollection(collectionId)
      .then((data) => {
        const parts = ((data.parts ?? []) as any[])
          .filter((p) => String(p.id) !== currentSourceId)
          .map((p): CatalogEntry => ({
            id: p.id,
            title: p.title,
            poster: p.poster_path ? `https://image.tmdb.org/t/p/w342${p.poster_path}` : null,
            year: p.release_date ? Number(p.release_date.slice(0, 4)) : null,
            rating: p.vote_average ?? null,
            overview: p.overview ?? '',
          }));
        setEntries(parts);
      })
      .catch(() => {});
  }, [collectionId, currentSourceId]);

  return <CatalogRail title={collectionName ? `From ${collectionName}` : 'From This Series'} entries={entries} category="movie" />;
}

function RecommendationsRail({ sourceId }: { sourceId: string }) {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    if (!tmdbConfigured()) return;
    fetchTvRecommendations(sourceId)
      .then((data) => {
        const recs = ((data.results ?? []) as any[]).slice(0, 12).map((p): CatalogEntry => ({
          id: p.id,
          title: p.name,
          poster: p.poster_path ? `https://image.tmdb.org/t/p/w342${p.poster_path}` : null,
          year: p.first_air_date ? Number(p.first_air_date.slice(0, 4)) : null,
          rating: p.vote_average ?? null,
          overview: p.overview ?? '',
        }));
        setEntries(recs);
      })
      .catch(() => {});
  }, [sourceId]);

  return <CatalogRail title="More Like This" entries={entries} category="series" />;
}

function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },

  hero: { width: '100%' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, gap: 6 },
  title: { lineHeight: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: 2 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  body: { paddingHorizontal: space.lg },

  segment: {
    flexDirection: 'row',
    marginTop: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.accent },
  segmentDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },

  collectionBtn: { marginTop: space.md },

  overview: { lineHeight: 22 },
  genresRow: { flexDirection: 'row', gap: space.sm, flexWrap: 'wrap', marginBottom: space.sm },
  starRow: { flexDirection: 'row', gap: space.md },
  notes: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
    fontSize: 15,
  },
  progRow: { flexDirection: 'row', gap: space.xl },
  stepper: { flex: 1, gap: space.sm },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 28, textAlign: 'center' },
  delete: { marginTop: space.xxl },

  section: { paddingHorizontal: space.lg, marginTop: space.lg },
  providerScroll: { gap: space.md, paddingRight: space.lg },
  providerCard: { width: 72, alignItems: 'center', gap: 3 },
  providerLogo: { width: 52, height: 52, borderRadius: radius.md },
  providerLogoFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  providerName: { width: 72, textAlign: 'center' },
  providerHint: { marginTop: space.sm },
  castScroll: { gap: space.md, paddingRight: space.lg },
  castCard: { width: 100, gap: space.xs, alignItems: 'center' },
  castImage: { width: 100, height: 140, borderRadius: radius.md },
  castImageFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  castName: { textAlign: 'center', fontWeight: '600', width: 100 },

  crewRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  crewImage: { width: 44, height: 44, borderRadius: radius.sm },
  crewImageFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },

  seriesCard: { width: 110, gap: space.xs },
  seriesImage: { width: 110, height: 156, borderRadius: radius.md },
  seriesImageFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  seriesTitle: { fontWeight: '600', width: 110, lineHeight: 17 },
  railAddBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railAddBtnDone: { backgroundColor: colors.success },
});
