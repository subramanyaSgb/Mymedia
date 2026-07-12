import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-svg-charts';
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

  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>
        Watch History
      </Text>
      <View style={styles.chartWrapper}>
        <LineChart
          style={styles.chart}
          data={chartData}
          svg={{
            stroke: colors.accent,
            strokeWidth: 2,
          }}
          contentInset={{ top: 10, bottom: 10, left: 0, right: 0 }}
          yMin={0}
          yMax={maxValue}
        />
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
  chartWrapper: { height: 200, width: Dimensions.get('window').width - 32, marginHorizontal: -space.lg },
  chart: { height: '100%', width: '100%' },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
  subtitle: { marginTop: space.sm, textAlign: 'center' },
});
