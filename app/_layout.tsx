import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import 'react-native-reanimated';

import { checkForUpdate } from '@/api/updates';
import { ThemeProvider, useColors, useScheme } from '@/components/ui';
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
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Roboto is the Android system font — nothing to load; hide splash on first frame.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  useUpdatePrompt();
  const { scheme } = useScheme();
  const c = useColors();

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.bg,
      card: c.bg,
      text: c.text,
      border: c.border,
      primary: c.accent,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <DatabaseProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.bg },
            headerBackTitle: 'Back',
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="item/[id]" />
          <Stack.Screen name="list/[...spec]" />
          <Stack.Screen name="about" />
        </Stack>
      </DatabaseProvider>
    </NavThemeProvider>
  );
}
