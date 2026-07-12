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
  const { data: localFilmography = [] } = useLiveQuery(
    tmdbPersonId ? q.filmographyForPerson(Number(tmdbPersonId)) : q.all()
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
    if (filter === 'anime') return false; // TMDB doesn't support anime filter via API
    return c.media_type === filter;
  }) || [];

  const localFiltered = (localFilmography || []).filter((item: any) => {
    if (filter === 'all') return true;
    if (filter === 'movie') return item.category === 'movie';
    if (filter === 'tv') return item.category === 'series';
    if (filter === 'anime') return item.category === 'anime';
    return false;
  });

  // Use local filmography if available, fallback to TMDB
  const displayFilms = localFiltered.length > 0 ? localFiltered : filtered;

  return (
    <>
      <Modal visible={showModal} transparent animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              onPress={() => setShowModal(false)}
              style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} bounces={false}>
            {/* Hero section with gradient overlay */}
            <View style={styles.heroSection}>
              {person.profile_path ? (
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w342${person.profile_path}` }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.profileImage, styles.profileFallback]}>
                  <Icon name="person" size={64} color={colors.textFaint} />
                </View>
              )}
              <LinearGradient
                colors={['transparent', colors.bg]}
                style={styles.heroGradient}
              />
            </View>

            <View style={styles.infoSection}>
              <Text variant="h1" style={styles.name}>
                {person.name}
              </Text>
              {person.birthday && (
                <Text variant="body" color={colors.textMuted} style={styles.info}>
                  Born {person.birthday}
                </Text>
              )}
              {person.biography && (
                <>
                  <SectionHeader title="Bio" />
                  <Text variant="body" muted style={styles.bio}>
                    {person.biography}
                  </Text>
                </>
              )}

              <SectionHeader title="Filmography" />
              <View style={styles.filterRow}>
                {(['all', 'movie', 'tv', 'anime'] as const).map((f) => (
                  <Button
                    key={f}
                    label={f === 'all' ? 'All' : f === 'movie' ? 'Movies' : f === 'tv' ? 'Series' : 'Anime'}
                    onPress={() => setFilter(f)}
                    variant={filter === f ? 'primary' : 'ghost'}
                    style={styles.filterButton}
                  />
                ))}
              </View>

              {displayFilms.length === 0 ? (
                <View style={styles.empty}>
                  <Text color={colors.textMuted}>No filmography available</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {displayFilms.map((item: any) => (
                    <View key={item.itemId || item.id} style={styles.gridItem}>
                      {item.imageUrl || item.poster_path ? (
                        <Image
                          source={{
                            uri: item.imageUrl || `https://image.tmdb.org/t/p/w185${item.poster_path}`,
                          }}
                          style={styles.poster}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.poster, styles.posterFallback]}>
                          <Icon name="image" size={32} color={colors.textFaint} />
                        </View>
                      )}
                      <Text variant="caption" numberOfLines={2} style={styles.title}>
                        {item.title || item.name}
                      </Text>
                      {(item.year || item.release_date) && (
                        <Text variant="micro" color={colors.textMuted}>
                          {(item.year || item.release_date?.slice(0, 4))}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Screen>
        <Stack.Screen
          options={{
            title: person?.name || 'Loading...',
          }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: { paddingBottom: space.xxl },

  heroSection: { width: '100%', height: 300, overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  profileFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },

  infoSection: { paddingHorizontal: space.lg, marginTop: space.lg },
  name: { marginBottom: space.sm, fontSize: 28 },
  info: { marginBottom: space.lg },
  bio: { marginBottom: space.lg, lineHeight: 20 },

  filterRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.lg },
  filterButton: { flex: 1 },

  empty: { paddingVertical: space.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.lg },
  gridItem: { width: '48%' },
  poster: { width: '100%', height: 200, borderRadius: radius.md, marginBottom: space.sm },
  posterFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: space.xs },
});
