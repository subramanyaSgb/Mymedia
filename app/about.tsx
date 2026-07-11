import { checkForUpdate, currentVersion, RELEASES_PAGE, type UpdateInfo } from '@/api/updates';
import { Button, Card, haptic, Icon, Text } from '@/components/ui';
import { colors, radius, space } from '@/constants/theme';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

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
      setError(e?.message ?? 'Could not check for updates');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  const download = () => {
    haptic.light();
    Linking.openURL(info?.apkUrl ?? RELEASES_PAGE);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'About' }} />

      <View style={styles.logo}>
        <Icon name="film" size={30} color={colors.accent} />
      </View>
      <Text variant="display" center>
        MyMedia
      </Text>
      <Text variant="caption" muted center style={styles.tagline}>
        Everything you watch, in one place.
      </Text>
      <Text variant="caption" color={colors.textFaint} center>
        Version {currentVersion}
      </Text>

      <Card style={styles.card}>
        {checking ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator color={colors.accent} />
            <Text variant="caption" muted>
              Checking for updates…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.rowCenter}>
            <Icon name="cloud-offline-outline" size={18} color={colors.danger} />
            <Text variant="caption" color={colors.danger} center>
              {error}
            </Text>
          </View>
        ) : info?.available ? (
          <View style={styles.updateBlock}>
            <View style={styles.rowCenter}>
              <Icon name="arrow-up-circle" size={18} color={colors.accent} />
              <Text variant="bodyStrong">Update available: v{info.latest}</Text>
            </View>
            <Button label="Download update" icon="download-outline" onPress={download} style={styles.dlBtn} />
          </View>
        ) : (
          <View style={styles.rowCenter}>
            <Icon name="checkmark-circle" size={18} color={colors.success} />
            <Text variant="caption" color={colors.success}>
              You're on the latest version.
            </Text>
          </View>
        )}
      </Card>

      <Pressable onPress={check} style={styles.linkBtn} accessibilityRole="button">
        <Text variant="caption" color={colors.accent}>
          Check again
        </Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(RELEASES_PAGE)} style={styles.linkBtn} accessibilityRole="button">
        <Text variant="caption" color={colors.textMuted}>
          All releases on GitHub
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: space.xl, alignItems: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.accentDim,
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
  linkBtn: { paddingVertical: space.md, minHeight: 44, justifyContent: 'center' },
});
