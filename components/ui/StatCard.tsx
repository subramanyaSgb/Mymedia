import { colors, space } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

// One stat tile, used identically by Home and Profile.
// De-boxed: white numbers, hairline separators — data breathes instead of sitting in a card.
export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text variant="h1">{value}</Text>
      <Text variant="micro" color={colors.textFaint} center>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  // Interleave hairline dividers between stats.
  const kids = Array.isArray(children) ? children : [children];
  return (
    <View style={styles.row}>
      {kids.map((k, i) => (
        <View key={i} style={styles.cell}>
          {i > 0 ? <View style={styles.divider} /> : null}
          {k}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cell: { flex: 1, flexDirection: 'row' },
  divider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
});
