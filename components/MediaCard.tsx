import { Icon, Poster, useThemedStyles } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { useProviderLogo } from '@/components/useProviderLogo';
import { CATEGORY_ICON } from '@/constants/categories';
import { radius, space, type Palette } from '@/constants/theme';
import { parseProgress, type Item } from '@/db/queries';
import { Image } from 'expo-image';
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
  showProvider = false,
  onPress,
  onLongPress,
}: {
  item: Item;
  width?: number;
  selectionMode?: boolean;
  selected?: boolean;
  showProvider?: boolean; // overlay the streaming-provider logo (video items only)
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const progress = parseProgress(item.progress);
  const pct = progress.percent ?? (item.status === 'finished' ? 100 : 0);
  const showBar = item.status === 'watching' && pct > 0; // no misleading sliver at 0%
  const providerLogo = useProviderLogo(showProvider ? item : { category: 'song', source: 'manual', sourceId: null });

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
              {selected ? <Icon name="checkmark" size={14} color="#ffffff" /> : null}
            </View>
          </>
        ) : null}
        {showProvider && providerLogo && !selectionMode ? (
          <Image source={{ uri: providerLogo }} style={styles.providerBadge} contentFit="cover" />
        ) : null}
      </View>
      {/* Numeric width on the text itself — percentage widths are unreliable inside
          Android horizontal ScrollViews and caused single-line clipping. */}
      <View style={[styles.meta, { width }]}>
        <Text
          variant="caption"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.titleText, { width }]}>
          {item.title}
        </Text>
        <Text variant="micro" muted>
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

  // Selection mode: taps toggle selection (no navigation).
  if (selectionMode && onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  // Normal mode: tap ALWAYS opens the detail page; long-press (if given) enters selection.
  return (
    <Link href={`/item/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        onLongPress={onLongPress}
        delayLongPress={280}
        style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        {content}
      </Pressable>
    </Link>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
    meta: { marginTop: space.sm, minHeight: 34, justifyContent: 'flex-start' },
    titleText: { lineHeight: 17 },
    track: { height: 3, borderRadius: radius.pill, backgroundColor: c.surfaceHi, marginTop: 4, overflow: 'hidden' },
    fill: { height: 3, borderRadius: radius.pill, backgroundColor: c.accent },
    selectedDim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(228,47,8,0.25)',
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: c.accent,
    },
    selectCircle: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectCircleOn: { backgroundColor: c.accent, borderColor: c.accent },
    providerBadge: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      width: 26,
      height: 26,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.5)',
    },
  });
