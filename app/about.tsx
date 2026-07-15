import { downloadAndInstall } from '@/api/installUpdate';
import { checkForUpdate, currentVersion, RELEASES_PAGE, type UpdateInfo } from '@/api/updates';
import { Button, Card, haptic, Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

export default function AboutScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setError(null);
    try {
      setInfo(await checkForUpdate());
    } catch (e: any) {
      setError(e?.message ?? 'Could not check for updates');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  // In-app download with progress, then the system installer takes over.
  // Browser fallback only if the in-app path fails.
  const [progress, setProgress] = useState<number | null>(null);
  const download = async () => {
    haptic.light();
    if (!info?.apkUrl) {
      Linking.openURL(RELEASES_PAGE);
      return;
    }
    try {
      setProgress(0);
      await downloadAndInstall(info.apkUrl, setProgress);
      setProgress(null);
    } catch {
      setProgress(null);
      haptic.warning();
      Linking.openURL(info.apkUrl); // fallback: browser download
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'About' }} />

      <View style={styles.logo}>
        <Icon name="film" size={30} color={c.accent} />
      </View>
      <Text variant="display" center>
        MyMedia
      </Text>
      <Text variant="caption" muted center style={styles.tagline}>
        Everything you watch, in one place.
      </Text>
      <Text variant="caption" color={c.textFaint} center>
        Version {currentVersion}
      </Text>

      <Card style={styles.card}>
        {checking ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator color={c.accent} />
            <Text variant="caption" muted>
              Checking for updates…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.rowCenter}>
            <Icon name="cloud-offline-outline" size={18} color={c.danger} />
            <Text variant="caption" color={c.danger} center>
              {error}
            </Text>
          </View>
        ) : info?.available ? (
          <View style={styles.updateBlock}>
            <View style={styles.rowCenter}>
              <Icon name="arrow-up-circle" size={18} color={c.accent} />
              <Text variant="bodyStrong">Update available: v{info.latest}</Text>
            </View>
            {progress != null ? (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.max(progress, 3)}%` }]} />
                </View>
                <Text variant="micro" color={c.textMuted}>
                  {progress < 100 ? `Downloading… ${progress}%` : 'Opening installer…'}
                </Text>
              </View>
            ) : (
              <Button label="Download & install" icon="download-outline" onPress={download} style={styles.dlBtn} />
            )}
          </View>
        ) : (
          <View style={styles.rowCenter}>
            <Icon name="checkmark-circle" size={18} color={c.success} />
            <Text variant="caption" color={c.success}>
              You're on the latest version.
            </Text>
          </View>
        )}
      </Card>

      <Pressable onPress={check} style={styles.linkBtn} accessibilityRole="button">
        <Text variant="caption" color={c.accent}>
          Check again
        </Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(RELEASES_PAGE)} style={styles.linkBtn} accessibilityRole="button">
        <Text variant="caption" color={c.textMuted}>
          All releases on GitHub
        </Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg, padding: space.xl, alignItems: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: c.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xl,
    marginBottom: space.md,
  },
  tagline: { marginTop: space.xs, marginBottom: space.sm },
  card: { marginTop: space.xl, width: '100%' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  updateBlock: { alignItems: 'center', gap: space.md },
  dlBtn: { alignSelf: 'stretch' },
  progressWrap: { alignSelf: 'stretch', alignItems: 'center', gap: space.sm },
  progressTrack: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceHi,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: radius.pill, backgroundColor: c.accent },
  linkBtn: { paddingVertical: space.md, minHeight: 44, justifyContent: 'center' },
});
