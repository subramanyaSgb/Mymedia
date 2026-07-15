import { space } from '@/constants/theme';
import { Pressable, StyleSheet } from 'react-native';
import { haptic } from './feedback';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme-context';

// Minimal hairline row: icon, label, count, chevron.
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
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count != null ? `${label}, ${count}` : label}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
        pressed && { opacity: 0.6 },
      ]}>
      <Icon name={icon} size={20} color={iconColor ?? c.textMuted} />
      <Text variant="body" style={styles.label}>
        {label}
      </Text>
      {count != null ? (
        <Text variant="caption" color={c.textFaint}>
          {count}
        </Text>
      ) : null}
      <Icon name="chevron-forward" size={16} color={c.textFaint} />
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
  label: { flex: 1 },
});
