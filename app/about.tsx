import { accent } from '@/constants/Colors';
import { checkForUpdate, currentVersion, RELEASES_PAGE, type UpdateInfo } from '@/api/updates';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

export default function AboutScreen() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      setInfo(await checkForUpdate());
    } catch (e: any) {
      setError(e.message ?? 'Could not check for updates');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const download = () => Linking.openURL(info?.apkUrl ?? RELEASES_PAGE);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'About' }} />

      <Text style={styles.appName}>MyMedia</Text>
      <Text style={styles.tagline}>All your favorites. Organized.</Text>
      <Text style={styles.version}>Version {currentVersion}</Text>

      <View style={styles.card}>
        {checking ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator />
            <Text style={styles.checking}>Checking for updates…</Text>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : info?.available ? (
          <>
            <Text style={styles.updateTitle}>Update available: v{info.latest}</Text>
            <Pressable style={styles.dlBtn} onPress={download}>
              <Text style={styles.dlText}>Download update</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.upToDate}>You're on the latest version.</Text>
        )}
      </View>

      <Pressable onPress={check}>
        <Text style={styles.recheck}>Check again</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(RELEASES_PAGE)}>
        <Text style={styles.link}>All releases on GitHub</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  appName: { fontSize: 30, fontWeight: '800', marginTop: 20 },
  tagline: { color: '#6b7280', marginTop: 4 },
  version: { color: '#9ca3af', marginTop: 8 },
  card: {
    marginTop: 28,
    width: '100%',
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checking: { color: '#6b7280' },
  error: { color: '#dc2626', textAlign: 'center' },
  updateTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dlBtn: { backgroundColor: accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  dlText: { color: '#fff', fontWeight: '700' },
  upToDate: { color: '#16a34a', fontWeight: '600' },
  recheck: { color: accent, marginTop: 20, fontWeight: '600' },
  link: { color: '#6b7280', marginTop: 16, textDecorationLine: 'underline' },
});
