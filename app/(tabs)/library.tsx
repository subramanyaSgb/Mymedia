import { ListRow, Screen, Text } from '@/components/ui';
import { CATEGORIES, STATUS_ICON, STATUSES } from '@/constants/categories';
import { colors, space } from '@/constants/theme';
import { q } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function LibraryScreen() {
  const all = useLiveQuery(q.all());
  const items = all.data;

  const countByCat = (key: string) => items.filter((i) => i.category === key).length;
  const countByStatus = (key: string) => items.filter((i) => i.status === key).length;
  const favCount = items.filter((i) => i.favorite).length;

  return (
    <Screen>
      <Text variant="display" style={styles.h1}>
        Library
      </Text>

      <Text variant="micro" color={colors.textMuted} style={styles.section}>
        CATEGORIES
      </Text>
      <View style={styles.group}>
        {CATEGORIES.map((c) => (
          <ListRow
            key={c.key}
            icon={c.icon}
            label={c.label}
            count={countByCat(c.key)}
            onPress={() => router.push(`/list/category/${c.key}`)}
          />
        ))}
      </View>

      <Text variant="micro" color={colors.textMuted} style={styles.section}>
        MY LISTS
      </Text>
      <View style={styles.group}>
        <ListRow icon="heart" iconColor={colors.danger} label="Favorites" count={favCount} onPress={() => router.push('/list/favorites')} />
        {STATUSES.map((s) => (
          <ListRow
            key={s.key}
            icon={STATUS_ICON[s.key]}
            label={s.label}
            count={countByStatus(s.key)}
            onPress={() => router.push(`/list/status/${s.key}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { marginBottom: space.sm },
  section: { marginTop: space.xl, marginBottom: space.sm, marginLeft: space.md },
  group: { gap: space.xs },
});
