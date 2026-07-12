import { View, StyleSheet } from 'react-native';
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
  const barHeight = 200 / topGenres.length;

  return (
    <View style={styles.container}>
      <Text variant="h2" style={styles.title}>
        Top Genres
      </Text>
      <View style={styles.chartWrapper}>
        {topGenres.map((genre, idx) => (
          <View key={idx} style={[styles.barRow, { height: barHeight }]}>
            <Text variant="micro" style={styles.label} numberOfLines={1}>
              {genre.genre}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${(genre.count / maxValue) * 90}%`,
                  },
                ]}
              />
              <Text variant="micro" color={colors.textMuted}>
                {genre.count}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: space.lg },
  title: { marginBottom: space.md },
  chartWrapper: { width: '100%' },
  barRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { width: 80 },
  barContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: space.md, gap: space.sm },
  bar: { height: 20, backgroundColor: colors.accent, borderRadius: 4 },
  empty: { height: 200, justifyContent: 'center', alignItems: 'center' },
});
