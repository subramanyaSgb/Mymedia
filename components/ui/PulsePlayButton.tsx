import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Icon } from './Icon';
import { useColors } from './theme-context';

// Poptime's signature red play button with an expanding ripple behind it.
export function PulsePlayButton({ size = 30 }: { size?: number }) {
  const c = useColors();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600 }), -1, false);
  }, [p]);
  const ripple = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.9 }],
    opacity: 0.45 * (1 - p.value),
  }));
  return (
    <View style={[styles.wrap, { width: size * 2, height: size * 2 }]}>
      <Animated.View
        style={[styles.ripple, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent }, ripple]}
      />
      <View style={[styles.btn, { width: size, height: size, borderRadius: size / 2, backgroundColor: c.accent }]}>
        <Icon name="play" size={size * 0.5} color={c.onAccent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute' },
  btn: { alignItems: 'center', justifyContent: 'center' },
});
