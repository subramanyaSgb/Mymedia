import { accent } from '@/constants/Colors';
import { currentVersion } from '@/api/updates';
import { getStats, type Stats } from '@/db/queries';
import { useFocusEffect, Link } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  useFocusEffect(
    useCallback(() => {
      getStats().then(setStats);
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.h1}>Profile</Text>

        <View style={styles.statsCard}>
          <Big label="Days Tracked" value={stats?.daysTracked ?? 0} />
          <Big label="Items Watched" value={stats?.itemsWatched ?? 0} />
          <Big label="Hours Logged" value={stats?.hoursLogged ?? 0} />
        </View>

        <View style={styles.statsCard}>
          <Big label="Total Items" value={stats?.totalItems ?? 0} />
        </View>

        <Link href="/about" asChild>
          <Pressable style={styles.row}>
            <Text style={styles.rowLabel}>About & Updates</Text>
            <Text style={styles.rowValue}>v{currentVersion} ›</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.big}>
      <Text style={styles.bigValue}>{value}</Text>
      <Text style={styles.bigLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  h1: { fontSize: 28, fontWeight: '800', marginBottom: 16 },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  big: { alignItems: 'center' },
  bigValue: { fontSize: 24, fontWeight: '800', color: accent },
  bigLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  rowLabel: { fontSize: 16, fontWeight: '500' },
  rowValue: { color: '#6b7280' },
});
