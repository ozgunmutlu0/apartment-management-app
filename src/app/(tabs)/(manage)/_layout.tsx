import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useStackOptions } from '@/theme/navigation';

export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  const { t } = useTranslation('tabs');
  const { t: td } = useTranslation('dues');
  const { screenOptions, sheetOptions } = useStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: t('manage') }} />
      <Stack.Screen name="dues" options={{ title: t('screens.manageDues') }} />
      <Stack.Screen name="reports" options={{ title: t('screens.reports') }} />
      <Stack.Screen
        name="record-payment"
        options={{ ...sheetOptions([0.6, 1]), title: td('manage.record.title') }}
      />
      <Stack.Screen
        name="due-payments"
        options={{ ...sheetOptions([0.6, 1]), title: td('manage.payments.title') }}
      />
      <Stack.Screen
        name="generate-dues"
        options={{ ...sheetOptions([0.6, 1]), title: td('manage.generateSheet.title') }}
      />
    </Stack>
  );
}
