import { View, StyleSheet } from 'react-native';
import { radius, space, type Palette } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/components/ui';
import { Text } from '../ui/Text';

interface GenreChartProps {
  data: Array<{ genre: string; count: number }>;
}

// Horizontal bars, naturally-sized rows (no fixed heights → nothing overlaps).
export function GenreChart({ data }: GenreChartProps) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  if (!data || data.length === 0) return null;

  const topGenres = data.slice(0, 8);
  const maxValue = Math.max(...topGenres.map((d) => d.count), 1);

  return (
    <View style={styles.card}>
      {topGenres.map((genre, idx) => (
        <View key={idx} style={styles.row}>
          <Text variant="micro" color={c.textMuted} style={styles.label} numberOfLines={1}>
            {genre.genre}
          </Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.max(4, (genre.count / maxValue) * 100)}%` }]} />
          </View>
          <Text variant="micro" color={c.textFaint} style={styles.count}>
            {genre.count}
          </Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: space.lg,
    gap: space.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  label: { width: 82 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceHi,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radius.pill, backgroundColor: c.accent },
  count: { width: 26, textAlign: 'right' },
});
