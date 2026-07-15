import { Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';

// Lazy embedded YouTube player: shows a play row first, mounts the WebView on tap.
export function TrailerPlayer({ videoKey, name }: { videoKey: string; name?: string }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [playing, setPlaying] = useState(false);
  const { width } = useWindowDimensions();
  const playerW = width - space.lg * 2;
  const playerH = Math.round((playerW * 9) / 16);

  if (!playing) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Play trailer"
        onPress={() => setPlaying(true)}
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

  return (
    <View style={[styles.player, { width: playerW, height: playerH }]}>
      <WebView
        source={{ uri: `https://www.youtube.com/embed/${videoKey}?autoplay=1&playsinline=1` }}
        style={{ backgroundColor: c.bg }}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
      />
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
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
  player: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.bg },
});
