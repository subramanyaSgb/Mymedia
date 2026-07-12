import { Icon, Poster } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { CATEGORY_ICON } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { parseProgress, type Item } from '@/db/queries';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

// Poster card with title/subtitle and progress bar for in-progress items.
// When onPress/onLongPress are provided the card is a plain Pressable
// (selection mode); otherwise it links to the item detail.
export function MediaCard({
  item,
  width = 120,
  selectionMode = false,
  selected = false,
  onPress,
  onLongPress,
}: {
  item: Item;
  width?: number;
  selectionMode?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const progress = parseProgress(item.progress);
  const pct = progress.percent ?? (item.status === 'finished' ? 100 : 0);
  const showBar = item.status === 'watching' && pct > 0; // no misleading sliver at 0%

  const content = (
    <>
      <View>
        <Poster
          uri={item.imageUrl}
          title={item.title}
          width={width}
          height={width * 1.45}
          fallbackIcon={CATEGORY_ICON[item.category]}
        />
        {selectionMode ? (
          <>
            {selected ? <View style={styles.selectedDim} /> : null}
            <View style={[styles.selectCircle, selected && styles.selectCircleOn]}>
              {selected ? <Icon name="checkmark" size={14} color={colors.onAccent} /> : null}
            </View>
          </>
        ) : null}
      </View>
      {/* Fixed-height meta block so every card is identical → clean grid alignment. */}
      <View style={styles.meta}>
        <Text variant="caption" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="micro" color={colors.textMuted}>
          {item.year ?? ' '}
        </Text>
      </View>
      {showBar ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      ) : null}
    </>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityState={{ selected }}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={280}
        style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return (
    <Link href={`/item/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        {content}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  meta: { marginTop: space.sm, height: 34, justifyContent: 'flex-start' },
  track: { height: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceHi, marginTop: 4, overflow: 'hidden' },
  fill: { height: 3, borderRadius: radius.pill, backgroundColor: colors.accent },
  selectedDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(140,92,255,0.28)',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  selectCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.text,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
