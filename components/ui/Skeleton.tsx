import { radius } from '@/constants/theme';
import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useColors } from './theme-context';

// Shimmering placeholder box. Matches layout sizes instead of a generic spinner.
export function Skeleton({ width, height, style }: { width?: number | `${number}%`; height: number; style?: ViewStyle }) {
  const c = useColors();
  const o = useSharedValue(0.4);
  useEffect(() => {
    o.value = withRepeat(withTiming(0.8, { duration: 800 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[{ backgroundColor: c.surfaceHi, borderRadius: radius.md, width: width ?? '100%', height }, anim, style]}
    />
  );
}
