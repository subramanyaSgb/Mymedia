import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

type IconName = SymbolViewProps['name'];

function icon(name: IconName) {
  return ({ color }: { color: ColorValue }) => (
    <SymbolView name={name} tintColor={color} size={26} />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon({ ios: 'house.fill', android: 'home', web: 'home' }) }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon({ ios: 'magnifyingglass', android: 'search', web: 'search' }) }} />
      <Tabs.Screen name="add" options={{ title: 'Add', tabBarIcon: icon({ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }) }} />
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarIcon: icon({ ios: 'square.stack.fill', android: 'collections', web: 'collections' }) }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon({ ios: 'person.fill', android: 'person', web: 'person' }) }} />
    </Tabs>
  );
}
