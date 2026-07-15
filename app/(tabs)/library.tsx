import { ListRow, Screen, SectionHeader, Text, useColors } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import { cq, q } from '@/db/queries';
import type { Category } from '@/db/schema';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';

const WATCH: Category[] = ['movie', 'series', 'anime'];

export default function LibraryScreen() {
  const c = useColors();
  const all = useLiveQuery(q.all());
  const collections = useLiveQuery(cq.all());
  const items = all.data;

  const countByCat = (key: string) => items.filter((i) => i.category === key).length;
  const favCount = items.filter((i) => i.favorite).length;

  const catRow = (key: Category, last: boolean) => {
    const c = CATEGORIES.find((x) => x.key === key)!;
    return (
      <ListRow
        key={key}
        icon={c.icon}
        label={c.label}
        count={countByCat(key)}
        last={last}
        onPress={() => router.push(`/list/category/${key}`)}
      />
    );
  };

  return (
    <Screen>
      <Text variant="caption" color={c.textFaint}>
        {items.length} items
      </Text>
      <Text variant="display">Library</Text>

      <SectionHeader title="Watch" />
      {WATCH.map((k, i) => catRow(k, i === WATCH.length - 1))}

      <SectionHeader title="My lists" />
      <ListRow
        icon="heart"
        iconColor={c.danger}
        label="Favorites"
        count={favCount}
        last
        onPress={() => router.push('/list/favorites')}
      />

      <SectionHeader title="Custom Collections" />
      {(collections.data ?? []).slice(0, 5).map((c) => (
        <ListRow
          key={c.id}
          icon="albums-outline"
          label={c.name}
          count={c.count}
          onPress={() => router.push({ pathname: '/collection/[id]', params: { id: String(c.id) } })}
        />
      ))}
      <ListRow
        icon="add-circle-outline"
        iconColor={c.accent}
        label={(collections.data ?? []).length > 0 ? 'All collections' : 'New collection'}
        last
        onPress={() => router.push('/collections')}
      />
    </Screen>
  );
}
