import { haptic, Icon, Text, useColors, useThemedStyles } from '@/components/ui';
import { radius, space, type Palette } from '@/constants/theme';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

// Inline trailer via react-native-youtube-iframe (official IFrame Player API with
// proper origin attribution — raw embed URLs get rejected by YouTube: 153/152-4).
// Lazy-mounted on tap; falls back to a YouTube link if the video can't embed.
export function TrailerPlayer({ videoKey, name }: { videoKey: string; name?: string }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const { width } = useWindowDimensions();
  const playerW = width - space.lg * 2;
  const playerH = Math.round((playerW * 9) / 16);

  const openYoutube = useCallback(() => {
    haptic.light();
    Linking.openURL(`vnd.youtube:${videoKey}`).catch(() =>
      Linking.openURL(`https://www.youtube.com/watch?v=${videoKey}`).catch(() => {})
    );
  }, [videoKey]);

  if (!playing || failed) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={failed ? 'Watch trailer on YouTube' : 'Play trailer'}
        onPress={() => {
          if (failed) {
            openYoutube();
          } else {
            haptic.light();
            setPlaying(true);
          }
        }}
        style={({ pressed }) => [styles.playRow, pressed && { opacity: 0.85 }]}>
        <View style={styles.playIcon}>
          <Icon name="play" size={22} color={c.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{failed ? 'Watch on YouTube' : 'Play trailer'}</Text>
          <Text variant="micro" color={c.textMuted} numberOfLines={1}>
            {failed ? "This video can't play in-app" : name ?? ''}
          </Text>
        </View>
        <Icon name="logo-youtube" size={22} color={c.danger} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.player, { width: playerW }]}>
      <YoutubePlayer
        height={playerH}
        width={playerW}
        play
        videoId={videoKey}
        onError={() => setFailed(true)}
        webViewProps={{ androidLayerType: 'hardware' }}
      />
    </View>
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
    player: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#000' },
  });
