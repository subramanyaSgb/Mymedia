import { View, StyleSheet } from 'react-native';
import { colors, space } from '@/constants/theme';
import { Text } from '../ui/Text';

interface WatchHistoryChartProps {
  data: Array<{ date: string; count: number }>;
}

// Simple native bar chart — fills the parent's width, no window math.
export function WatchHistoryChart({ data }: WatchHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text color={colors.textMuted}>No watch history yet</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>
        Watch History
      </Text>
      <View style={styles.chartWrapper}>
        {data.map((d, idx) => (
          <View key={idx} style={styles.barSlot}>
            <View style={[styles.bar, { height: `${Math.max(4, (d.count / maxValue) * 100)}%` }]} />
          </View>
        ))}
      </View>
      <Text variant="micro" color={colors.textMuted} style={styles.subtitle}>
        Last 30 days
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: space.lg },
  title: { marginBottom: space.md },
  chartWrapper: { height: 180, width: '100%', flexDirection: 'row', alignItems: 'flex-end' },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end', paddingHorizontal: 1 },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  empty: { height: 180, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: space.sm, textAlign: 'center' },
});
