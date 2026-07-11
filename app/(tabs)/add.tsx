import { CATEGORIES } from '@/constants/categories';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.h1}>Add to Library</Text>
        <Text style={styles.sub}>Pick a category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              style={styles.card}
              onPress={() =>
                // Catalog categories go to search; songs use the manual form.
                c.api
                  ? router.push({ pathname: '/(tabs)/explore', params: { category: c.key } })
                  : router.push('/manual')
              }>
              <Text style={styles.icon}>{c.icon}</Text>
              <Text style={styles.label}>{c.label}</Text>
              <Text style={styles.hint}>{c.api ? 'Search catalog' : 'Add manually'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  h1: { fontSize: 28, fontWeight: '800' },
  sub: { color: '#6b7280', marginTop: 2, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  icon: { fontSize: 34 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  hint: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
