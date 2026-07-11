import { colors, space } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

// Quiet uppercase kicker used as the section label across all screens.
// One consistent device instead of three different "section title" styles.
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="kicker" color={colors.textMuted}>
        {title.toUpperCase()}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.xxl,
    marginBottom: space.md,
  },
});
