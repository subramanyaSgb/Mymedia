import { colors, radius, space } from '@/constants/theme';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'danger';

// One button for the whole app (replaces saveBtn/dlBtn/delete-text variants).
// Includes tactile press feedback and a 48px min height for accessible tap targets.
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
      <Text variant="bodyStrong" color={v.fg}>
        {label}
      </Text>
    </Pressable>
  );
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.accent, fg: colors.onAccent, border: colors.accent },
  ghost: { bg: colors.surfaceHi, fg: colors.text, border: colors.border },
  danger: { bg: 'transparent', fg: colors.danger, border: colors.border },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  disabled: { opacity: 0.45 },
});
