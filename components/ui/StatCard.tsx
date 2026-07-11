import { colors, radius, space } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

// One stat tile, used identically by Home and Profile (was two different designs).
export function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text variant="h1" color={colors.accent}>
        {value}
      </Text>
      <Text variant="micro" color={colors.textMuted} center>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: space.xl,
    paddingHorizontal: space.md,
  },
  stat: { flex: 1, alignItems: 'center', gap: space.xs },
});
