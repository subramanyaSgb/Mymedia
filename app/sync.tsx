import { Icon, Screen, SectionHeader, Text } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import { getCategoryCounts } from '@/db/queries';
import type { Category } from '@/db/schema';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

// Data status screen — everything is stored locally in SQLite on this device.
// ponytail: no cloud backend; this reports local storage state per category.
export default function SyncScreen() {
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
          <Icon name="checkmark-done" size={32} color={colors.accent} />
        </View>
        <Text variant="h1">All data saved</Text>
        <Text variant="caption" color={colors.textMuted} style={styles.statusSub}>
          {total} items stored safely on this device
        </Text>
      </View>

      <SectionHeader title="Storage by category" />
      {CATEGORIES.map((c, i) => (
        <View key={c.key} style={[styles.row, i < CATEGORIES.length - 1 && styles.rowBorder]}>
          <Icon name={c.icon} size={20} color={colors.textMuted} />
          <Text variant="body" style={{ flex: 1 }}>
            {c.label}
          </Text>
          <Text variant="caption" color={colors.textFaint}>
            {counts?.[c.key] ?? 0}
          </Text>
          <Icon name="checkmark-circle" size={18} color={colors.success} />
        </View>
      ))}

      <SectionHeader title="About your data" />
      <Text variant="caption" color={colors.textMuted} style={styles.note}>
        Your library lives in a local database on this device and survives app updates. Cloud sync
        across devices is planned for a future release.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: space.xl,
    marginTop: space.lg,
  },
  cloudIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  statusSub: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingVertical: 15 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  note: { lineHeight: 20 },
});
