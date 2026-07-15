import { space } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';

// Poptime section title: bold heading + optional right slot ("View all").
export function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="h2">{title}</Text>
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
