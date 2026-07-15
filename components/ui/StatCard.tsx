import { space } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useColors } from './theme-context';

// One stat tile, used by Home and Profile. Hairline-divided row — data breathes, no card box.
export function Stat({ label, value }: { label: string; value: number | string }) {
  const c = useColors();
  return (
    <View style={styles.stat}>
      <Text variant="h1">{value}</Text>
      <Text variant="micro" color={c.textFaint} center>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  const c = useColors();
  const kids = Array.isArray(children) ? children : [children];
  return (
    <View style={[styles.row, { borderColor: c.border }]}>
      {kids.map((k, i) => (
        <View key={i} style={styles.cell}>
          {i > 0 ? <View style={[styles.divider, { backgroundColor: c.border }]} /> : null}
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
  },
  cell: { flex: 1, flexDirection: 'row' },
  divider: { width: StyleSheet.hairlineWidth },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
});
