import { accent } from '@/constants/Colors';
import { CATEGORIES, STATUSES } from '@/constants/categories';
import { q } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
  const all = useLiveQuery(q.all());
  const items = all.data;

  const countByCat = (key: string) => items.filter((i) => i.category === key).length;
  const countByStatus = (key: string) => items.filter((i) => i.status === key).length;
  const favCount = items.filter((i) => i.favorite).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Library</Text>

        <Text style={styles.h2}>Categories</Text>
        {CATEGORIES.map((c) => (
          <Row key={c.key} href={`/list/category/${c.key}`} icon={c.icon} label={c.label} count={countByCat(c.key)} />
        ))}

        <Text style={styles.h2}>My Lists</Text>
        <Row href="/list/favorites" icon="❤️" label="Favorites" count={favCount} />
        {STATUSES.map((s) => (
          <Row key={s.key} href={`/list/status/${s.key}`} icon="📌" label={s.label} count={countByStatus(s.key)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ href, icon, label, count }: { href: string; icon: string; label: string; count: number }) {
  return (
    <Link href={href as any} asChild>
      <Pressable style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.chev}>›</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  h2: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginTop: 20, marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  icon: { fontSize: 20, width: 30 },
  label: { flex: 1, fontSize: 16, fontWeight: '500' },
  count: { fontSize: 15, color: accent, fontWeight: '700', marginRight: 8 },
  chev: { fontSize: 22, color: '#c4c4c4' },
});
