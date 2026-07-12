import { View, StyleSheet } from 'react-native';
import { colors, radius, space } from '@/constants/theme';
import { Text } from '../ui/Text';

interface GenreChartProps {
  data: Array<{ genre: string; count: number }>;
}

// Horizontal bars, naturally-sized rows (no fixed heights → nothing overlaps).
export function GenreChart({ data }: GenreChartProps) {
  if (!data || data.length === 0) return null;

  const topGenres = data.slice(0, 8);
  const maxValue = Math.max(...topGenres.map((d) => d.count), 1);

  return (
    <View style={styles.card}>
      {topGenres.map((genre, idx) => (
        <View key={idx} style={styles.row}>
          <Text variant="micro" color={colors.textMuted} style={styles.label} numberOfLines={1}>
            {genre.genre}
          </Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.max(4, (genre.count / maxValue) * 100)}%` }]} />
          </View>
          <Text variant="micro" color={colors.textFaint} style={styles.count}>
            {genre.count}
          </Text>
        </View>
      ))}
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
    gap: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  label: { width: 82 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceHi,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.accent },
  count: { width: 26, textAlign: 'right' },
});
