import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/lib/auth';
import { useStackOptions } from '@/theme/navigation';

export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  const { t } = useTranslation('tabs');
  const { role } = useAuth();
  const { screenOptions, sheetOptions } = useStackOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: t(`tickets.${role}`) }} />
      <Stack.Screen
        name="[id]"
        options={{ title: t('screens.ticketDetail'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen
        name="new"
        options={{ title: t('screens.newTicket'), ...sheetOptions([0.6, 1]) }}
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
