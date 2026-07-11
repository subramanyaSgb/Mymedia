import { ListRow, Screen, SectionHeader, Text } from '@/components/ui';
import { CATEGORIES, STATUS_ICON, STATUSES } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { q } from '@/db/queries';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';

export default function LibraryScreen() {
  const all = useLiveQuery(q.all());
  const items = all.data;

  const countByCat = (key: string) => items.filter((i) => i.category === key).length;
  const countByStatus = (key: string) => items.filter((i) => i.status === key).length;
  const favCount = items.filter((i) => i.favorite).length;

  return (
    <Screen>
      <Text variant="caption" color={colors.textFaint}>
        {items.length} items
      </Text>
      <Text variant="display">Library</Text>

      <SectionHeader title="Categories" />
      {CATEGORIES.map((c, i) => (
        <ListRow
          key={c.key}
          icon={c.icon}
          label={c.label}
          count={countByCat(c.key)}
          last={i === CATEGORIES.length - 1}
          onPress={() => router.push(`/list/category/${c.key}`)}
        />
      ))}

      <SectionHeader title="My lists" />
      <ListRow
        icon="heart"
        iconColor={colors.danger}
        label="Favorites"
        count={favCount}
        onPress={() => router.push('/list/favorites')}
      />
      {STATUSES.map((s, i) => (
        <ListRow
          key={s.key}
          icon={STATUS_ICON[s.key]}
          label={s.label}
          count={countByStatus(s.key)}
          last={i === STATUSES.length - 1}
          onPress={() => router.push(`/list/status/${s.key}`)}
        />
      ))}
    </Screen>
  );
}
