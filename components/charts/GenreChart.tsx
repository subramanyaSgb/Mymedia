import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-svg-charts';
import { colors, space } from '@/constants/theme';
import { Text } from '../ui/Text';

interface GenreChartProps {
  data: Array<{ genre: string; count: number }>;
}

export function GenreChart({ data }: GenreChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text color={colors.textMuted}>No genre data yet</Text>
      </View>
    );
  }

  const topGenres = data.slice(0, 10);
  const chartData = topGenres.map((d) => d.count);
  const maxValue = Math.max(...chartData, 1);

  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>
        Top Genres
      </Text>
      <View style={styles.chartWrapper}>
        <BarChart
          style={styles.chart}
          data={chartData}
          svg={{
            fill: colors.accent,
          }}
          contentInset={{ top: 10, bottom: 10, left: 40, right: 10 }}
          yMin={0}
          yMax={maxValue}
          horizontal={true}
        />
      </View>
      <ScrollView style={styles.legend} horizontal showsHorizontalScrollIndicator={false}>
        {topGenres.map((g, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.accent }]} />
            <Text variant="micro" numberOfLines={1}>
              {g.genre} ({g.count})
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: space.lg },
  title: { marginBottom: space.md },
  chartWrapper: { height: 200, width: Dimensions.get('window').width - 32 },
  chart: { height: '100%', width: '100%' },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
  legend: { marginTop: space.md, paddingHorizontal: 0 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: space.lg, paddingVertical: space.sm },
  legendColor: { width: 12, height: 12, borderRadius: 2, marginRight: space.xs },
});
