import { colors, space } from '@/constants/theme';
import { Pressable, StyleSheet, View } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

// Minimal hairline row: icon, label, count, chevron. No boxes — whitespace does the work.
export function ListRow({
  icon,
  iconColor,
  label,
  count,
  onPress,
  last,
}: {
  icon: IconName;
  iconColor?: string;
  label: string;
  count?: number | string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count != null ? `${label}, ${count}` : label}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [styles.row, !last && styles.border, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={20} color={iconColor ?? colors.textMuted} />
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      {count != null ? (
        <Text variant="caption" color={colors.textFaint}>
          {count}
        </Text>
      ) : null}
      <Icon name="chevron-forward" size={16} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: 15,
  },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { flex: 1 },
});
