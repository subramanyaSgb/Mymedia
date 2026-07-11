import { currentVersion } from '@/api/updates';
import { ListRow, Screen, Stat, StatRow, Text } from '@/components/ui';
import { colors, space } from '@/constants/theme';
import { getStats, type Stats } from '@/db/queries';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  useFocusEffect(useCallback(() => void getStats().then(setStats), []));

  return (
    <Screen>
      <Text variant="display" style={styles.h1}>
        Profile
      </Text>

      <StatRow>
        <Stat label="Days" value={stats?.daysTracked ?? 0} />
        <Stat label="Watched" value={stats?.itemsWatched ?? 0} />
        <Stat label="Hours" value={stats?.hoursLogged ?? 0} />
      </StatRow>

      <View style={styles.spacer} />
      <StatRow>
        <Stat label="Total Items" value={stats?.totalItems ?? 0} />
      </StatRow>

      <Text variant="micro" color={colors.textMuted} style={styles.section}>
        SETTINGS
      </Text>
      <ListRow icon="information-circle-outline" label="About & Updates" count={`v${currentVersion}`} onPress={() => router.push('/about')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginBottom: space.lg },
  spacer: { height: space.md },
  section: { marginTop: space.xl, marginBottom: space.sm, marginLeft: space.md },
});
