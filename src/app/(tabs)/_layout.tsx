import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';

import { useUnreadCount } from '@/features/notifications/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/theme/colors';

// Every tab group has an `index` route, so `/` is ambiguous; without this the router picks the
// first group alphabetically (`(dues)`), which is hidden for managers/technicians -> blank screen.
export const unstable_settings = { anchor: '(home)' };

export default function TabsLayout() {
  const { t } = useTranslation('tabs');
  const { role } = useAuth();
  const unread = useUnreadCount().data ?? 0;
  const colors = useColors();

  return (
    <NativeTabs tintColor={colors.tint}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(tickets)">
        <NativeTabs.Trigger.Label>{t(`tickets.${role}`)}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'wrench.and.screwdriver', selected: 'wrench.and.screwdriver.fill' }}
          md="build"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(announcements)">
        <NativeTabs.Trigger.Label>{t('announcements')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'megaphone', selected: 'megaphone.fill' }}
          md="campaign"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(dues)" hidden={role !== 'resident'}>
        <NativeTabs.Trigger.Label>{t('dues')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
          md="payments"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(manage)" hidden={role !== 'manager'}>
        <NativeTabs.Trigger.Label>{t('manage')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Label>{t('profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge hidden={unread === 0}>
          {unread > 99 ? '99+' : String(unread)}
        </NativeTabs.Trigger.Badge>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
