import { View, StyleSheet, Dimensions } from 'react-native';
import { colors, space } from '@/constants/theme';
import { Text } from '../ui/Text';

interface WatchHistoryChartProps {
  data: Array<{ date: string; count: number }>;
}

export function WatchHistoryChart({ data }: WatchHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text color={colors.textMuted}>No watch history yet</Text>
      </View>
    );
  }

  const chartData = data.map((d) => d.count);
  const maxValue = Math.max(...chartData, 1);
  const width = Dimensions.get('window').width - 32;
  const height = 200;
  const pointSpacing = width / (chartData.length - 1 || 1);

  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>
        Watch History
      </Text>
      <View style={styles.chartWrapper}>
        {chartData.map((value, idx) => (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                height: (value / maxValue) * height,
                marginLeft: idx === 0 ? 0 : (pointSpacing - 6),
              },
            ]}
          />
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
  chartWrapper: { height: 200, width: Dimensions.get('window').width - 32, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: space.sm },
  bar: { width: 6, backgroundColor: colors.accent, borderRadius: 3 },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: space.sm, textAlign: 'center' },
});
