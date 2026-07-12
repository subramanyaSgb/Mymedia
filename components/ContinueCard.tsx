import { Icon, Poster, Text } from '@/components/ui';
import { CATEGORY_ICON, CATEGORY_LABEL } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { parseProgress, type Item } from '@/db/queries';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

// Wide featured card for Continue Watching — poster left, meta + progress right.
export function ContinueCard({ item, width }: { item: Item; width: number }) {
  const progress = parseProgress(item.progress);
  const line =
    progress.season || progress.episode
      ? `S${progress.season ?? 1} · E${progress.episode ?? 1}`
      : CATEGORY_LABEL[item.category];

  return (
    <Link href={`/item/${item.id}`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Continue ${item.title}`}
        style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
        <Poster
          uri={item.imageUrl}
          title={item.title}
          width={72}
          height={104}
          fallbackIcon={CATEGORY_ICON[item.category]}
        />
        <View style={styles.info}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="micro" color={colors.textMuted} style={styles.line}>
            {line.toUpperCase()}
          </Text>
          <View style={styles.playRow}>
            <Icon name="play-circle" size={18} color={colors.accent} />
            <Text variant="micro" color={colors.accent}>
              CONTINUE
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  info: { flex: 1, justifyContent: 'center' },
  line: { marginTop: 4 },
  playRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
});
