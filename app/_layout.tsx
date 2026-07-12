import { SpaceGrotesk_700Bold, useFonts } from '@expo-google-fonts/space-grotesk';
import { DarkTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { checkForUpdate } from '@/api/updates';
import { colors } from '@/constants/theme';
import { DatabaseProvider } from '@/db/provider';

// App is dark-only. Nav theme uses our tokens so chrome matches the screens.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

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
  const [loaded] = useFonts({ SpaceGrotesk_700Bold });

  // Hide the splash once fonts resolve OR after a short timeout — never gate the
  // whole app on font loading, or a font failure leaves a permanent blank screen.
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 500);
    if (loaded) SplashScreen.hideAsync().catch(() => {});
    return () => clearTimeout(t);
  }, [loaded]);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useUpdatePrompt();

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <DatabaseProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
            headerBackTitle: 'Back',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="list/[...spec]" />
          <Stack.Screen name="manual" options={{ presentation: 'modal' }} />
          <Stack.Screen name="about" />
        </Stack>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
