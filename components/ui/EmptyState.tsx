import { space } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useColors } from './theme-context';

// One composed empty state used everywhere a list can be empty.
export function EmptyState({
  icon = 'film-outline',
  title,
  subtitle,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: c.surface }]}>
        <Icon name={icon} size={28} color={c.textMuted} />
      </View>
      <Text variant="h2" center>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" muted center style={styles.sub}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.xxl, gap: space.sm },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  sub: { maxWidth: 260 },
});
