import { haptic, Icon, Screen, Text } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function AddScreen() {
  return (
    <Screen>
      <Text variant="display">Add to Library</Text>
      <Text variant="caption" muted style={styles.sub}>
        Pick a category to get started
      </Text>
      <View style={styles.grid}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.key}
            accessibilityRole="button"
            accessibilityLabel={`Add ${c.label}`}
            onPress={() => {
              haptic.light();
              c.api
                ? router.push({ pathname: '/(tabs)/explore', params: { category: c.key } })
                : router.push('/manual');
            }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.iconWrap}>
              <Icon name={c.icon} size={26} color={colors.accent} />
            </View>
            <Text variant="bodyStrong">{c.label}</Text>
            <Text variant="micro" color={colors.textMuted}>
              {c.api ? 'Search catalog' : 'Add manually'}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: 2, marginBottom: space.lg },
  // grid: two columns via flexBasis math that always sums under 100% with the gap.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  card: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.xl,
    gap: space.xs,
  },
  pressed: { backgroundColor: colors.surfaceHi, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
});
