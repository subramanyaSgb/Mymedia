import { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable, Modal } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPersonDetails, fetchPersonCredits } from '@/api/tmdb';
import { Button, Text, Screen, Icon, SectionHeader } from '@/components/ui';
import { colors, space, radius } from '@/constants/theme';
import { MediaCard } from '@/components/MediaCard';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { q } from '@/db/queries';

export default function PersonScreen() {
  const { tmdbPersonId } = useLocalSearchParams<{ tmdbPersonId: string }>();
  const [person, setPerson] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);

  // Local filmography from database
  const { data: localFilmography } = useLiveQuery(
    tmdbPersonId ? q.filmographyForPerson(Number(tmdbPersonId)) : () => db.select().from(items).where(eq(items.id, -1))
  );

  useEffect(() => {
    if (!tmdbPersonId) return;
    loadPerson();
  }, [tmdbPersonId]);

  async function loadPerson() {
    try {
      setLoading(true);
      const personData = await fetchPersonDetails(tmdbPersonId!);
      const creditsData = await fetchPersonCredits(tmdbPersonId!);
      setPerson(personData);
      setCredits(creditsData);
    } catch (e) {
      console.error('Error loading person:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!person) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Not found' }} />
        <View style={styles.center}>
          <Text color={colors.textMuted}>Person not found</Text>
        </View>
      </Screen>
    );
  }

  const filtered = credits?.cast?.filter((c: any) => {
    if (filter === 'all') return true;
    return c.media_type === filter;
  }) || [];

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: person.name,
        }}
      />
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {person.profile_path && (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w342${person.profile_path}` }}
            style={styles.profileImage}
            contentFit="cover"
          />
        )}
        <Text variant="h1" style={styles.name}>
          {person.name}
        </Text>
        {person.birthday && (
          <Text variant="body" color={colors.textMuted} style={styles.info}>
            Born: {person.birthday}
          </Text>
        )}
        {person.biography && (
          <>
            <SectionHeader title="Bio" />
            <Text variant="body" style={styles.bio}>
              {person.biography.substring(0, 300)}...
            </Text>
          </>
        )}

        <SectionHeader title="Filmography" />
        <View style={styles.filterRow}>
          {(['all', 'movie', 'tv'] as const).map((f) => (
            <Button
              key={f}
              title={f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'Series'}
              onPress={() => setFilter(f)}
              size="sm"
              variant={filter === f ? 'primary' : 'secondary'}
              style={styles.filterButton}
            />
          ))}
        </View>

        <View style={styles.grid}>
          {filtered.slice(0, 20).map((item: any, i: number) => (
            <View key={i} style={styles.gridItem}>
              {item.poster_path && (
                <Image
                  source={{
                    uri: `https://image.tmdb.org/t/p/w185${item.poster_path}`,
                  }}
                  style={styles.poster}
                  contentFit="cover"
                />
              )}
              <Text variant="caption" numberOfLines={2} style={styles.title}>
                {item.title || item.name}
              </Text>
              {item.release_date && (
                <Text variant="micro" color={colors.textMuted}>
                  {item.release_date.slice(0, 4)}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: space.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileImage: { width: 200, height: 300, borderRadius: radius.lg, marginBottom: space.lg, alignSelf: 'center' },
  name: { marginBottom: space.sm },
  info: { marginBottom: space.lg },
  bio: { marginBottom: space.lg, lineHeight: 20 },
  filterRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  filterButton: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.lg },
  gridItem: { width: '48%' },
  poster: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: space.sm },
  title: { marginBottom: space.xs },
});
