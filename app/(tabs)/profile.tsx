import { currentVersion } from '@/api/updates';
import { ListRow, Screen, SectionHeader, Stat, StatRow, Text } from '@/components/ui';
import { colors } from '@/constants/theme';
import { getStats, type Stats } from '@/db/queries';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export default function ProfileScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  useFocusEffect(useCallback(() => void getStats().then(setStats), []));

  return (
    <Screen>
      <Text variant="caption" color={colors.textFaint}>
        MyMedia
      </Text>
      <Text variant="display">Profile</Text>

      <SectionHeader title="Statistics" />
      <StatRow>
        <Stat label="Days" value={stats?.daysTracked ?? 0} />
        <Stat label="Watched" value={stats?.itemsWatched ?? 0} />
        <Stat label="Hours" value={stats?.hoursLogged ?? 0} />
        <Stat label="Total" value={stats?.totalItems ?? 0} />
      </StatRow>

      <SectionHeader title="Settings" />
      <ListRow
        icon="information-circle-outline"
        label="About & Updates"
        count={`v${currentVersion}`}
        last
        onPress={() => router.push('/about')}
      />
    </Screen>
  );
}
