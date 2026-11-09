import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { useUnreadCount } from '@/features/notifications/api';
import { useAuth } from '@/lib/auth';
import { hexColors } from '@/theme/colors';
import { fonts } from '@/theme/tokens';

// Every tab group has an `index` route, so `/` is ambiguous; without this the router picks the
// first group alphabetically (`(dues)`), which is hidden for managers/technicians -> blank screen.
export const unstable_settings = { anchor: '(home)' };

export default function TabsLayout() {
  const { t } = useTranslation('tabs');
  const { role } = useAuth();
  const unread = useUnreadCount().data ?? 0;
  const scheme = useColorScheme();
  const colors = hexColors(scheme);

  // Android-only theming (Material bottom navigation). iOS keeps the system tab bar; iOS 26 draws
  // its own glass background.
  const androidProps =
    Platform.OS === 'android'
      ? {
          backgroundColor: colors.secondarySystemGroupedBackground,
          indicatorColor: colors.tintSoft,
          labelVisibilityMode: 'labeled' as const,
          rippleColor: colors.tintSoft,
          iconColor: { default: colors.secondaryLabel, selected: colors.tint },
          labelStyle: {
            default: { fontFamily: fonts.medium, fontSize: 12, color: colors.secondaryLabel },
            selected: { fontFamily: fonts.semibold, fontSize: 12, color: colors.tint },
          },
          badgeBackgroundColor: colors.red,
          badgeTextColor: '#FFFFFF',
        }
      : {};

  return (
    <NativeTabs tintColor={colors.tint} {...androidProps}>
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
