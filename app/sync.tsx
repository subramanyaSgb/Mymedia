import { Icon, Screen, SectionHeader, Text, useColors, useThemedStyles } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { radius, space, type Palette } from '@/constants/theme';
import { getCategoryCounts } from '@/db/queries';
import type { Category } from '@/db/schema';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Data status screen — everything is stored locally in SQLite on this device.
// ponytail: no cloud backend; this reports local storage state per category.
export default function SyncScreen() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [counts, setCounts] = useState<Record<Category, number> | null>(null);

  useFocusEffect(
    useCallback(() => {
      void getCategoryCounts().then(setCounts);
    }, [])
  );

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Data & Sync' }} />

      <View style={styles.statusCard}>
        <View style={styles.cloudIcon}>
          <Icon name="checkmark-done" size={32} color={c.accent} />
        </View>
        <Text variant="h1">All data saved</Text>
        <Text variant="caption" color={c.textMuted} style={styles.statusSub}>
          {total} items stored safely on this device
        </Text>
      </View>

      <SectionHeader title="Storage by category" />
      {CATEGORIES.map((cat, i) => (
        <View key={cat.key} style={[styles.row, i < CATEGORIES.length - 1 && styles.rowBorder]}>
          <Icon name={cat.icon} size={20} color={c.textMuted} />
          <Text variant="body" style={{ flex: 1 }}>
            {cat.label}
          </Text>
          <Text variant="caption" color={c.textFaint}>
            {counts?.[cat.key] ?? 0}
          </Text>
          <Icon name="checkmark-circle" size={18} color={c.success} />
        </View>
      ))}

      <SectionHeader title="About your data" />
      <Text variant="caption" color={c.textMuted} style={styles.note}>
        Your library lives in a local database on this device and survives app updates. Cloud sync
        across devices is planned for a future release.
      </Text>
    </Screen>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  statusCard: {
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.border,
    padding: space.xl,
    marginTop: space.lg,
  },
  cloudIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  statusSub: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: 15 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  note: { lineHeight: 20 },
});
