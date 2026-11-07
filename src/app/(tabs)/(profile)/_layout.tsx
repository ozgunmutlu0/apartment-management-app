import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function Layout() {
  const { t } = useTranslation('tabs');

  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerLargeTitleShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('profile') }} />
      <Stack.Screen name="reservations" options={{ title: t('screens.reservations') }} />
      <Stack.Screen name="notifications" options={{ title: t('screens.notifications') }} />
    </Stack>
  );
}
