import { currentVersion } from '@/api/updates';
import { ListRow, Screen, SectionHeader, Stat, StatRow, Text } from '@/components/ui';
import { colors } from '@/constants/theme';
import { getStats, getWatchHistoryByDate, getGenreStats, getRatingDistribution, type Stats } from '@/db/queries';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { WatchHistoryChart } from '@/components/charts/WatchHistoryChart';
import { GenreChart } from '@/components/charts/GenreChart';

export default function ProfileScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [watchHistory, setWatchHistory] = useState<Array<{ date: string; count: number }>>([]);
  const [genres, setGenres] = useState<Array<{ genre: string; count: number }>>([]);
  const [ratings, setRatings] = useState<Array<{ rating: number; count: number }>>([]);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        getStats().then(setStats),
        getWatchHistoryByDate().then(setWatchHistory),
        getGenreStats().then(setGenres),
        getRatingDistribution().then(setRatings),
      ]);
    }, [])
  );

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

      {watchHistory.length > 0 && <WatchHistoryChart data={watchHistory} />}
      {genres.length > 0 && <GenreChart data={genres} />}

      {ratings.length > 0 && (
        <View>
          <SectionHeader title="Rating Distribution" />
          {ratings.map((r) => (
            <View key={r.rating} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text>★{r.rating.toFixed(1)}</Text>
              <Text color={colors.textMuted}>{r.count} items</Text>
            </View>
          ))}
        </View>
      )}

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
