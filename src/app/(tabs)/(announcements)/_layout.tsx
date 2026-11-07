import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  const { t } = useTranslation('tabs');

  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerLargeTitleShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('announcements') }} />
      <Stack.Screen
        name="[id]"
        options={{ title: t('screens.announcementDetail'), headerLargeTitleEnabled: false }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: t('screens.newAnnouncement'),
          presentation: 'formSheet',
          sheetAllowedDetents: [0.6, 1],
          sheetGrabberVisible: true,
          headerLargeTitleEnabled: false,
        }}
      />
    </Stack>
  );
}
