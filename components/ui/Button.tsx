import { radius, space, type Palette } from '@/constants/theme';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme-context';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

// Poptime pill button: red primary, amber secondary; pressed state darkens to near-black
// (the template's hover behavior). 48px min height for accessible targets.
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
  const c = useColors();
  const v = variants(c)[variant];
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
        { backgroundColor: pressed && v.pressedBg ? v.pressedBg : v.bg, borderColor: v.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      {({ pressed }) => (
        <>
          {icon ? <Icon name={icon} size={18} color={pressed && v.pressedFg ? v.pressedFg : v.fg} /> : null}
          <Text variant="bodyStrong" color={pressed && v.pressedFg ? v.pressedFg : v.fg}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const variants = (c: Palette) =>
  ({
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent, pressedBg: '#020B10', pressedFg: '#ffffff' },
    secondary: { bg: c.accent2, fg: c.onAccent2, border: c.accent2, pressedBg: '#020B10', pressedFg: '#ffffff' },
    ghost: { bg: c.surface, fg: c.text, border: c.border, pressedBg: c.surfaceHi, pressedFg: c.text },
    danger: { bg: 'transparent', fg: c.danger, border: c.border, pressedBg: c.surfaceHi, pressedFg: c.danger },
  }) as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: space.xl,
  },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
