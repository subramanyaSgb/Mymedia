import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { ensureRuntime } from '@/api/runtime';
import { syncItemData } from '@/api/sync';
import { discoverOttReleases, fetchWatchProviders } from '@/api/tmdb';
import { StatusPicker } from '@/components/StatusPicker';
import { Chip, haptic, Icon, Poster, Screen, SectionHeader, Text, EmptyState } from '@/components/ui';
import { LANGUAGES, languageName } from '@/constants/languages';
import { colors, radius, space } from '@/constants/theme';
import { addItem, q } from '@/db/queries';
import type { Status } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

export type OttEntry = {
  kind: 'movie' | 'series';
  sourceId: string;
  title: string;
  imageUrl: string | null;
  date: string | null;
  year: number | null;
  catalogRating: number | null;
  overview: string;
  language: string | null;
};

// Provider logos per item, fetched lazily and cached for the session.
const providerCache = new Map<string, string[]>();

function useProviderLogos(entry: OttEntry): string[] {
  const key = `${entry.kind}-${entry.sourceId}`;
  const [logos, setLogos] = useState<string[]>(providerCache.get(key) ?? []);

  useEffect(() => {
    if (providerCache.has(key)) return;
    fetchWatchProviders(entry.kind, entry.sourceId)
      .then((r) => {
        const l = r.providers
          .filter((p) => p.kind === 'stream' && p.logo)
          .slice(0, 3)
          .map((p) => p.logo!) as string[];
        providerCache.set(key, l);
        setLogos(l);
      })
      .catch(() => providerCache.set(key, []));
  }, [key]);

  return logos;
}

function useOttActions() {
  const inLib = useLiveQuery(q.sourceIds());
  const libMap = useMemo(
    () => new Map(inLib.data.map((r) => [`${r.source}-${r.sourceId}`, r.id])),
    [inLib.data]
  );
  const [pending, setPending] = useState<OttEntry | null>(null);

  const existingIdOf = (e: OttEntry) => libMap.get(`tmdb-${e.sourceId}`);

  const open = (e: OttEntry) => {
    const existingId = existingIdOf(e);
    if (existingId != null) router.push({ pathname: '/item/[id]', params: { id: String(existingId) } });
    else setPending(e);
  };

  const add = async (e: OttEntry, status: Status) => {
    haptic.success();
    const newId = await addItem({
      category: e.kind,
      source: 'tmdb',
      sourceId: e.sourceId,
      title: e.title,
      imageUrl: e.imageUrl,
      year: e.year,
      catalogRating: e.catalogRating,
      metadata: JSON.stringify({ overview: e.overview, originalLanguage: e.language ?? undefined }),
      status,
    });
    syncItemData(newId, e.sourceId, e.kind);
    if (status === 'finished') {
      const [row] = await q.byId(newId);
      if (row) void ensureRuntime(row);
    }
  };

  return { existingIdOf, open, add, pending, setPending };
}

function OttCard({
  entry,
  width,
  added,
  onPress,
  onLongPress,
}: {
  entry: OttEntry;
  width: number;
  added: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const logos = useProviderLogos(entry);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.title}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <View>
        <Poster
          uri={entry.imageUrl}
          title={entry.title}
          width={width}
          height={width * 1.45}
          fallbackIcon={entry.kind === 'movie' ? 'film' : 'tv'}
        />
        <View style={[styles.badge, added && styles.badgeAdded]}>
          <Icon name={added ? 'checkmark' : 'add'} size={14} color={colors.onAccent} />
        </View>
        {logos.length > 0 ? (
          <View style={styles.providerRow}>
            {logos.map((l, i) => (
              <Image key={i} source={{ uri: l }} style={styles.providerLogo} contentFit="cover" />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.meta, { width }]}>
        <Text variant="caption" numberOfLines={2} ellipsizeMode="tail" style={[styles.titleText, { width }]}>
          {entry.title}
        </Text>
        <Text variant="micro" color={colors.textMuted} numberOfLines={1}>
          {[languageName(entry.language), entry.date?.slice(5)].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

// Compact rail for the Home screen.
export function OttHorizontalScroll({ items, cardWidth = 110 }: { items: OttEntry[]; cardWidth?: number }) {
  const { existingIdOf, open, add, pending, setPending } = useOttActions();

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hrow}>
        {items.slice(0, 10).map((e) => (
          <OttCard
            key={`${e.kind}-${e.sourceId}`}
            entry={e}
            width={cardWidth}
            added={existingIdOf(e) != null}
            onPress={() => open(e)}
            onLongPress={() => setPending(e)}
          />
        ))}
      </ScrollView>
      <StatusPicker
        visible={pending != null}
        title={pending?.title ?? ''}
        subtitle="Add to which list?"
        onSelect={(s) => pending && add(pending, s)}
        onClose={() => setPending(null)}
      />
    </>
  );
}

const COLS = 3;

export default function OttScreen() {
  const [items, setItems] = useState<OttEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string | 'all'>('all');
  const { existingIdOf, open, add, pending, setPending } = useOttActions();

  const [gridW, setGridW] = useState(0);
  const gap = space.md;
  const cardW = Math.floor((gridW - gap * (COLS - 1)) / COLS);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    discoverOttReleases(language === 'all' ? undefined : language)
      .then((r) => !cancelled && setItems(r as OttEntry[]))
      .catch((e) => console.error('OTT load failed:', e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'New on OTT' }} />
      <SectionHeader title="Released this fortnight · India" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" active={language === 'all'} onPress={() => setLanguage('all')} />
        {LANGUAGES.map((l) => (
          <Chip key={l.code} label={l.label} active={language === l.code} onPress={() => setLanguage(l.code)} />
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState icon="tv-outline" title="Nothing new" subtitle="No releases found for this filter." />
      ) : (
        <FlatList
          onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
          data={gridW > 0 ? items : []}
          numColumns={COLS}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={{ gap, paddingTop: space.md }}
          scrollEnabled={false}
          keyExtractor={(item) => `${item.kind}-${item.sourceId}`}
          renderItem={({ item }) => (
            <OttCard
              entry={item}
              width={cardW}
              added={existingIdOf(item) != null}
              onPress={() => open(item)}
              onLongPress={() => setPending(item)}
            />
          )}
        />
      )}

      <StatusPicker
        visible={pending != null}
        title={pending?.title ?? ''}
        subtitle="Add to which list?"
        onSelect={(s) => pending && add(pending, s)}
        onClose={() => setPending(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: space.xxl, alignItems: 'center' },
  chips: { flexDirection: 'row', gap: space.sm, paddingRight: space.lg },
  hrow: { gap: space.md, paddingRight: space.lg },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  meta: { marginTop: space.sm, minHeight: 34 },
  titleText: { lineHeight: 17 },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAdded: { backgroundColor: colors.success },
  providerRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 4,
  },
  providerLogo: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.5)',
  },
});
