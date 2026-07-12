import { colors, radius, space } from '@/constants/theme';
import { Pressable, StyleSheet } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

// Selectable pill — shared by explore tabs and detail status control.
// Active state uses BOTH color and an icon so it's not color-only (a11y).
export function Chip({
  label,
  active,
  onPress,
  activeIcon = 'checkmark',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void; // omit for display-only chips (e.g. genre tags)
  activeIcon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.active : styles.inactive,
        pressed && { opacity: 0.85 },
      ]}>
      {active ? <Icon name={activeIcon} size={14} color={colors.onAccent} /> : null}
      <Text variant="caption" color={active ? colors.onAccent : colors.textMuted}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  active: { backgroundColor: colors.accent, borderColor: colors.accent },
  inactive: { backgroundColor: colors.surface, borderColor: colors.border },
});
