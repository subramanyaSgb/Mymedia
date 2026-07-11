import { accent } from '@/constants/Colors';
import { parseProgress, type Item } from '@/db/queries';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Poster card with title/subtitle and optional progress bar. Reused across Home/Library/lists.
export function MediaCard({ item, width = 120 }: { item: Item; width?: number }) {
  const progress = parseProgress(item.progress);
  const pct = progress.percent ?? (item.status === 'finished' ? 100 : 0);

  return (
    <Link href={`/item/${item.id}`} asChild>
      <Pressable style={[styles.card, { width }]}>
        <View style={[styles.poster, { width, height: width * 1.45 }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.img} contentFit="cover" />
          ) : (
            <Text style={styles.placeholder}>{item.title.slice(0, 1).toUpperCase()}</Text>
          )}
        </View>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        {item.year ? <Text style={styles.sub}>{item.year}</Text> : null}
        {item.status === 'watching' ? (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(pct, 4)}%` }]} />
          </View>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 12 },
  poster: {
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: { width: '100%', height: '100%' },
  placeholder: { fontSize: 32, fontWeight: '700', color: '#9ca3af' },
  title: { marginTop: 6, fontSize: 13, fontWeight: '600' },
  sub: { fontSize: 11, color: '#6b7280' },
  track: { height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', marginTop: 4, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: accent },
});
