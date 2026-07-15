import { radius, space } from '@/constants/theme';
import { Pressable, StyleSheet } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme-context';

// Poptime pill chip — red when active. Active state uses BOTH color and icon (a11y).
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
  const c = useColors();
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
        active
          ? { backgroundColor: c.accent, borderColor: c.accent }
          : { backgroundColor: c.surface, borderColor: c.surface },
        pressed && { opacity: 0.85 },
      ]}>
      {active ? <Icon name={activeIcon} size={14} color={c.onAccent} /> : null}
      <Text variant="caption" color={active ? c.onAccent : c.textMuted}>
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
    paddingHorizontal: space.md + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
