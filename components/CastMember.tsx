import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/constants/theme';
import { Text } from './ui/Text';

interface CastMemberProps {
  name: string;
  character?: string;
  profileImage?: string | null;
  tmdbPersonId: number;
}

export function CastMember({ name, character, profileImage, tmdbPersonId }: CastMemberProps) {
  return (
    <Link href={`/person/${tmdbPersonId}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.imageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
        </View>
        <Text variant="caption" numberOfLines={2} style={styles.name}>
          {name}
        </Text>
        {character && (
          <Text variant="micro" color={colors.textMuted} numberOfLines={1}>
            {character}
          </Text>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { width: 100, alignItems: 'center', marginRight: space.md },
  pressed: { opacity: 0.7 },
  imageContainer: { width: 90, height: 90, marginBottom: space.sm, borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%', borderRadius: radius.md },
  placeholder: { backgroundColor: colors.surface },
  name: { textAlign: 'center', marginBottom: space.xs },
});
