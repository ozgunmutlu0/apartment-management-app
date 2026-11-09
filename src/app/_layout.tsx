import '@/i18n';

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, useColorScheme } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { NotificationsProvider } from '@/features/notifications/NotificationsProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { NavigationTheme } from '@/theme/NavigationTheme';
import { hexColors, useColors } from '@/theme/colors';

// Keep the splash screen up until the session and profile are resolved.
void SplashScreen.preventAutoHideAsync();

function ProfileErrorScreen() {
  const { t } = useTranslation('auth');
  const colors = useColors();
  const { refreshProfile, signOut } = useAuth();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: colors.systemBackground,
      }}
    >
      <EmptyState icon="error" title={t('gate.profileError')} />
      <PrimaryButton title={t('gate.retry')} onPress={() => void refreshProfile()} />
      <PrimaryButton variant="plain" title={t('gate.signOut')} onPress={() => void signOut()} />
    </View>
  );
}

function RootNavigator() {
  const scheme = useColorScheme();
  const colors = hexColors(scheme);
  const { session, profile, isLoading, profileError } = useAuth();
  // A font error must not trap the splash screen: fall back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });
  const ready = !isLoading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  if (session && profileError) return <ProfileErrorScreen />;

  const signedIn = !!session && !!profile;
  const hasBuilding = signedIn && !!profile.building_id;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.systemGroupedBackground },
        statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
      }}
    >
      <Stack.Protected guard={hasBuilding}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !hasBuilding}>
        <Stack.Screen name="join-building" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationsProvider>
          <NavigationTheme>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationTheme>
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
