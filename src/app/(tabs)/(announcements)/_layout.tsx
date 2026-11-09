import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackOptions } from '@/theme/navigation';

export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  const { t } = useTranslation('tabs');
  const { screenOptions, sheetOptions } = useStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: t('announcements') }} />
      <Stack.Screen
        name="[id]"
        options={{ title: t('screens.announcementDetail'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen
        name="new"
        options={{ title: t('screens.newAnnouncement'), ...sheetOptions([0.6, 1]) }}
      />
    </Stack>
  );
}
