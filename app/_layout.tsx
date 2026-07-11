import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { checkForUpdate } from '@/api/updates';
import { useColorScheme } from '@/components/useColorScheme';
import { DatabaseProvider } from '@/db/provider';

// One-shot update check on launch: prompt the user if a newer release exists.
function useUpdatePrompt() {
  useEffect(() => {
    checkForUpdate()
      .then((info) => {
        if (!info.available) return;
        Alert.alert(
          'Update available',
          `Version ${info.latest} is available (you have ${info.current}).`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'View', onPress: () => router.push('/about') },
          ]
        );
      })
      .catch(() => {}); // offline / no releases yet — silent
  }, []);
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  useUpdatePrompt();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="item/[id]" options={{ headerBackTitle: 'Back' }} />
          <Stack.Screen name="list/[...spec]" options={{ headerBackTitle: 'Back' }} />
          <Stack.Screen name="manual" options={{ presentation: 'modal', headerBackTitle: 'Back' }} />
          <Stack.Screen name="about" options={{ headerBackTitle: 'Back' }} />
        </Stack>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
