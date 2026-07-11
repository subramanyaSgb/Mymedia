import { colors, radius } from '@/constants/theme';
import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// Shimmering placeholder box. Matches layout sizes instead of a generic spinner.
export function Skeleton({ width, height, style }: { width?: number | `${number}%`; height: number; style?: ViewStyle }) {
  const o = useSharedValue(0.4);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.box, { width: width ?? '100%', height }, anim, style]} />;
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.surfaceHi, borderRadius: radius.md },
});
