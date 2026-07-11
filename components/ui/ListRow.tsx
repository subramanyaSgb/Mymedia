import { colors, radius, space } from '@/constants/theme';
import { Pressable, StyleSheet, View } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

// Tappable row with leading icon + label + optional count + chevron.
// Shared by Library lists and Profile rows.
export function ListRow({
  icon,
  iconColor,
  label,
  count,
  onPress,
}: {
  icon: IconName;
  iconColor?: string;
  label: string;
  count?: number | string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count != null ? `${label}, ${count}` : label}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceHi }]}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={20} color={iconColor ?? colors.accent} />
      </View>
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      {count != null ? (
        <Text variant="bodyStrong" color={colors.textMuted}>
          {count}
        </Text>
      ) : null}
      <Icon name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
