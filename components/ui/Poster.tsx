import { radius } from '@/constants/theme';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme-context';

// Poster/cover image with a themed placeholder fallback. Poptime cards use 16px radius.
export function Poster({
  uri,
  title,
  width,
  height,
  fallbackIcon = 'film',
}: {
  uri?: string | null;
  title: string;
  width: number;
  height: number;
  fallbackIcon?: IconName;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.wrap,
        { width, height, borderRadius: radius.lg, backgroundColor: c.posterBg, borderColor: c.border },
      ]}>
      {uri ? (
        <Image source={{ uri }} style={styles.img} contentFit="cover" transition={200} />
      ) : (
        <View style={styles.placeholder}>
          <Icon name={fallbackIcon} size={Math.min(width, height) * 0.28} color={c.textFaint} />
          <Text variant="micro" color={c.textFaint} numberOfLines={1} style={styles.letter}>
            {title.slice(0, 14)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  img: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 6 },
  letter: { textAlign: 'center' },
});
