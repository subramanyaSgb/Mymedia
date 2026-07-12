import { haptic, Icon, Text } from '@/components/ui';
import { STATUS_ICON, statuses } from '@/constants/categories';
import { colors, radius, space } from '@/constants/theme';
import type { Category, Status } from '@/db/schema';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

// Themed bottom sheet replacing the native 3-option Alert for picking a status.
// Vocabulary + which states are offered come from the item's category.
export function StatusPicker({
  visible,
  title,
  subtitle,
  category = 'movie',
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  category?: Category;
  current?: Status | null; // highlights the item's current status when updating
  onSelect: (status: Status) => void;
  onClose: () => void;
}) {
  const options = statuses(category);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text variant="h2" numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="micro" color={colors.textMuted} style={styles.subtitle}>
            {subtitle.toUpperCase()}
          </Text>
        ) : null}
        {options.map((s) => {
          const active = current === s.key;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                haptic.light();
                onSelect(s.key);
                onClose();
              }}
              style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.8 }]}>
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Icon name={STATUS_ICON[s.key]} size={18} color={active ? colors.onAccent : colors.accent} />
              </View>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {s.label}
              </Text>
              {active ? <Icon name="checkmark" size={18} color={colors.accent} /> : null}
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.8 }]}>
          <Text variant="bodyStrong" color={colors.textMuted}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    paddingTop: space.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: space.md,
  },
  title: { marginBottom: 2 },
  subtitle: { marginBottom: space.md, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    marginBottom: space.xs,
  },
  rowActive: { backgroundColor: colors.accentDim },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.accent },
  cancel: { alignItems: 'center', paddingVertical: space.md, marginTop: space.sm },
});
