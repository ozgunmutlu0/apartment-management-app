import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  const { t } = useTranslation('tabs');
  const { t: td } = useTranslation('dues');

  const sheet = {
    presentation: 'formSheet',
    headerLargeTitleEnabled: false,
    sheetAllowedDetents: [0.6, 1] as number[],
    sheetGrabberVisible: true,
  } as const;

  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerLargeTitleShadowVisible: false }}>
      <Stack.Screen name="index" options={{ title: t('manage') }} />
      <Stack.Screen name="dues" options={{ title: t('screens.manageDues') }} />
      <Stack.Screen name="reports" options={{ title: t('screens.reports') }} />
      <Stack.Screen
        name="record-payment"
        options={{ ...sheet, title: td('manage.record.title') }}
      />
      <Stack.Screen
        name="due-payments"
        options={{ ...sheet, title: td('manage.payments.title') }}
      />
      <Stack.Screen
        name="generate-dues"
        options={{ ...sheet, title: td('manage.generateSheet.title') }}
      />
    </Stack>
  );
}
