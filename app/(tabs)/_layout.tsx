import { colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

type Ion = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: Ion) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} size={size} color={color as string} />
  );
}

// Center Add tab rendered as a raised accent button (matches the mockup's FAB).
function addIcon() {
  return (
    <View style={styles.fab}>
      <Ionicons name="add" size={28} color={colors.onAccent} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('search') }} />
      <Tabs.Screen
        name="add"
        options={{ title: '', tabBarIcon: addIcon, tabBarAccessibilityLabel: 'Add song' }}
        listeners={{
          tabPress: (e) => {
            // Open the manual-add form directly instead of showing a redundant screen.
            e.preventDefault();
            router.push('/manual');
          },
        }}
      />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: icon('albums') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
});
