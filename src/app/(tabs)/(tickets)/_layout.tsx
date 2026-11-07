import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';

export default function Layout() {
  const { t } = useTranslation('tabs');
  const { role } = useAuth();
  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerLargeTitleShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t(`tickets.${role}`) }} />
      <Stack.Screen
        name="[id]"
        options={{ title: t('screens.ticketDetail'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: t('screens.newTicket'),
          presentation: 'formSheet',
          sheetAllowedDetents: [0.6, 1],
          sheetGrabberVisible: true,
          headerLargeTitleEnabled: false,
        }}
      />
      <Stack.Screen
        name="photo"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
