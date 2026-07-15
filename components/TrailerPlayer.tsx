import { haptic, Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

// Opens the trailer in the YouTube app (web fallback). Embedded WebView players
// kept breaking as YouTube tightened embed rules (errors 153, 152-4), so we
// stopped embedding — the native app always plays.
export function TrailerPlayer({ videoKey, name }: { videoKey: string; name?: string }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  const open = async () => {
    haptic.light();
    try {
      await Linking.openURL(`vnd.youtube:${videoKey}`); // YouTube app
    } catch {
      Linking.openURL(`https://www.youtube.com/watch?v=${videoKey}`).catch(() => {});
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Play trailer on YouTube"
      onPress={open}
      style={({ pressed }) => [styles.playRow, pressed && { opacity: 0.85 }]}>
      <View style={styles.playIcon}>
        <Icon name="play" size={22} color={c.onAccent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">Play trailer</Text>
        {name ? (
          <Text variant="micro" color={c.textMuted} numberOfLines={1}>
            {name}
          </Text>
        ) : null}
      </View>
      <Icon name="logo-youtube" size={22} color={c.danger} />
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    playRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: space.md,
    },
    playIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
