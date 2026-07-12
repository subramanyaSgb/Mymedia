import { View, StyleSheet } from 'react-native';
import { colors, radius, space } from '@/constants/theme';
import { Text } from '../ui/Text';

interface WatchHistoryChartProps {
  data: Array<{ date: string; count: number }>;
}

// Simple native bar chart in a card surface — fills the parent's width.
export function WatchHistoryChart({ data }: WatchHistoryChartProps) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={styles.card}>
      <View style={styles.chart}>
        {data.map((d, idx) => (
          <View key={idx} style={styles.barSlot}>
            <View style={[styles.bar, { height: `${Math.max(5, (d.count / maxValue) * 100)}%` }]} />
          </View>
        ))}
      </View>
      <Text variant="micro" color={colors.textFaint} style={styles.subtitle}>
        LAST 30 DAYS
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.lg,
  },
  chart: { height: 140, width: '100%', flexDirection: 'row', alignItems: 'flex-end' },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end', paddingHorizontal: 1 },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  subtitle: { marginTop: space.md, textAlign: 'center', letterSpacing: 1 },
});
