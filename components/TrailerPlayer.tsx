import { Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
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

  // Loading the embed URL directly gives YouTube no referer → "error 153". Serving an
  // iframe from an HTML document with baseUrl youtube.com gives the embed a valid origin.
  const html = `<!DOCTYPE html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden}</style>
    </head><body>
    <iframe src="https://www.youtube.com/embed/${videoKey}?autoplay=1&playsinline=1&rel=0"
      style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
    </body></html>`;

  return (
    <View>
      <View style={[styles.player, { width: playerW, height: playerH }]}>
        <WebView
          source={{ html, baseUrl: 'https://www.youtube.com' }}
          originWhitelist={['*']}
          style={{ backgroundColor: c.bg }}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
      {/* Escape hatch — some videos disallow embedding entirely (YouTube 150/153). */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Watch on YouTube"
        onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoKey}`).catch(() => {})}
        style={styles.ytLink}>
        <Icon name="logo-youtube" size={14} color={c.danger} />
        <Text variant="micro" color={c.textMuted}>
          Not playing? Watch on YouTube
        </Text>
      </Pressable>
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
  ytLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: space.sm,
    minHeight: 40,
  },
});
