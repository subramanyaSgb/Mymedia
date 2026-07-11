import { Poster } from '@/components/ui';
import { Text } from '@/components/ui/Text';
import { CATEGORY_ICON } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { parseProgress, type Item } from '@/db/queries';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

// Poster card with title/subtitle and progress bar for in-progress items.
export function MediaCard({ item, width = 120 }: { item: Item; width?: number }) {
  const progress = parseProgress(item.progress);
  const pct = progress.percent ?? (item.status === 'finished' ? 100 : 0);
  const showBar = item.status === 'watching' && pct > 0; // no misleading sliver at 0%

  return (
    <Link href={`/item/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
        <Poster
          uri={item.imageUrl}
          title={item.title}
          width={width}
          height={width * 1.45}
          fallbackIcon={CATEGORY_ICON[item.category]}
        />
        <Text variant="caption" numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        {item.year ? (
          <Text variant="micro" color={colors.textMuted}>
            {item.year}
          </Text>
        ) : null}
        {showBar ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  title: { marginTop: space.sm },
  track: { height: 3, borderRadius: radius.pill, backgroundColor: colors.surfaceHi, marginTop: 6, overflow: 'hidden' },
  fill: { height: 3, borderRadius: radius.pill, backgroundColor: colors.accent },
});
