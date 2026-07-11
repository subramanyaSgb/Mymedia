import { Button, Chip, haptic, Icon, Poster, Text } from '@/components/ui';
import { CATEGORY_ICON, CATEGORY_LABEL, STATUS_ICON, STATUSES } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, updatedAt } = useLiveQuery(q.byId(Number(id)));
  const item = data[0];

  // Distinguish "still loading" from "genuinely missing" — fixes the "Not found" flash.
  if (!item) {
    const loaded = updatedAt != null; // live query has resolved at least once
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: CATEGORY_LABEL[item.category] }} />

      <View style={styles.header}>
        <Poster
          uri={item.imageUrl}
          title={item.title}
          width={112}
          height={164}
          fallbackIcon={CATEGORY_ICON[item.category]}
        />
        <View style={styles.headerInfo}>
          <Text variant="h1">{item.title}</Text>
          {item.year ? (
            <Text variant="caption" muted style={styles.metaLine}>
              {item.year}
            </Text>
          ) : null}
          {meta.artist ? (
            <Text variant="caption" muted style={styles.metaLine}>
              {meta.artist}
            </Text>
          ) : null}
          {item.catalogRating ? (
            <View style={styles.ratingRow}>
              <Icon name="star" size={14} color={colors.accent} />
              <Text variant="caption" muted>
                {item.catalogRating.toFixed(1)}
              </Text>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityState={{ selected: item.favorite }}
            onPress={() => {
              haptic.light();
              toggleFavorite(item.id, !item.favorite);
            }}
            style={styles.favBtn}>
            <Icon name={item.favorite ? 'heart' : 'heart-outline'} size={22} color={item.favorite ? colors.danger : colors.textMuted} />
            <Text variant="caption" color={item.favorite ? colors.danger : colors.textMuted}>
              {item.favorite ? 'Favorited' : 'Favorite'}
            </Text>
          </Pressable>
        </View>
      </View>

      {meta.overview ? (
        <Text variant="body" muted style={styles.overview}>
          {meta.overview}
        </Text>
      ) : null}

      <Label text="Status" />
      <View style={styles.chipRow}>
        {STATUSES.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            active={item.status === s.key}
            activeIcon={STATUS_ICON[s.key]}
            onPress={() => {
              haptic.light();
              setStatus(item.id, s.key as Status);
            }}
          />
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

      <Label text="Your Rating" />
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
            <Icon name={(item.userRating ?? 0) >= n ? 'star' : 'star-outline'} size={30} color={colors.accent} />
          </Pressable>
        ))}
      </View>

      <Label text="Notes" />
      <TextInput
        style={styles.notes}
        multiline
        placeholder="Add a note…"
        placeholderTextColor={colors.textFaint}
        defaultValue={item.notes ?? ''}
        onEndEditing={(e) => updateItem(item.id, { notes: e.nativeEvent.text })}
      />

      <Button label="Delete from library" variant="danger" icon="trash-outline" onPress={confirmDelete} style={styles.delete} />
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text variant="micro" color={colors.textMuted} style={styles.label}>
      {text.toUpperCase()}
    </Text>
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
    haptic.light();
    setS(ns);
    setE(ne);
    onChange(ns, ne);
  };
  return (
    <View>
      <Label text="Progress" />
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
      <Text variant="micro" color={colors.textMuted}>
        {label.toUpperCase()}
      </Text>
      <View style={styles.stepperControls}>
        <Pressable onPress={onDec} accessibilityLabel={`Decrease ${label}`} style={styles.stepBtn}>
          <Icon name="remove" size={20} color={colors.accent} />
        </Pressable>
        <Text variant="h2" style={styles.stepperValue}>
          {value}
        </Text>
        <Pressable onPress={onInc} accessibilityLabel={`Increase ${label}`} style={styles.stepBtn}>
          <Icon name="add" size={20} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', gap: space.lg },
  headerInfo: { flex: 1 },
  metaLine: { marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  favBtn: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.md },
  overview: { marginTop: space.lg, lineHeight: 21 },
  label: { marginTop: space.xl, marginBottom: space.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  starRow: { flexDirection: 'row', gap: space.sm },
  notes: {
    backgroundColor: colors.surface,
    borderWidth: 1,
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
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 28, textAlign: 'center' },
  delete: { marginTop: space.xxl },
});
