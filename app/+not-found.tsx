import { EmptyState, Text } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <EmptyState icon="help-circle-outline" title="This screen doesn't exist." />
        <Link href="/">
          <Text variant="bodyStrong" color={colors.accent}>
            Go to home
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.bg },
});
