import { colors, space } from '@/constants/theme';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Themed screen wrapper — replaces the per-screen `safe`/`content` duplication.
// scroll=false for FlatList screens that manage their own scrolling.
export function Screen({
  children,
  scroll = true,
  padded = true,
  refreshControl,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}) {
  const pad = padded ? { padding: space.lg } : null;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, { paddingBottom: space.xxl }, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
});
