import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { NotificationsProvider } from '@/features/notifications/NotificationsProvider';
import { AuthProvider, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { useColors } from '@/theme/colors';

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
  const { session, profile, isLoading, profileError } = useAuth();

  useEffect(() => {
    if (!isLoading) void SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;
  if (session && profileError) return <ProfileErrorScreen />;

  const signedIn = !!session && !!profile;
  const hasBuilding = signedIn && !!profile.building_id;

  return (
    <Stack screenOptions={{ headerShown: false }}>
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
          <RootNavigator />
        </NotificationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
