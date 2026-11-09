import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useColors } from '@/theme/colors';

/** Small cross-platform icon set: SF Symbol on iOS, Material Symbol on Android. */
export const ICONS = {
  home: { ios: 'house.fill', android: 'home' },
  ticket: { ios: 'wrench.and.screwdriver.fill', android: 'build' },
  announcement: { ios: 'megaphone.fill', android: 'campaign' },
  dues: { ios: 'creditcard.fill', android: 'payments' },
  manage: { ios: 'slider.horizontal.3', android: 'tune' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle' },
  notification: { ios: 'bell.fill', android: 'notifications' },
  reservation: { ios: 'calendar', android: 'calendar_month' },
  reports: { ios: 'chart.bar.fill', android: 'bar_chart' },
  empty: { ios: 'tray', android: 'inbox' },
  error: { ios: 'exclamationmark.triangle', android: 'warning' },
  add: { ios: 'plus', android: 'add' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  bell: { ios: 'bell.fill', android: 'notifications' },
  calendar: { ios: 'calendar', android: 'calendar_month' },
  people: { ios: 'person.2.fill', android: 'group' },
  checklist: { ios: 'checklist', android: 'checklist' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  unassigned: { ios: 'person.fill.questionmark', android: 'person_search' },
  statusPending: { ios: 'hourglass', android: 'hourglass_top' },
  statusInReview: { ios: 'magnifyingglass', android: 'search' },
  statusInProgress: { ios: 'hammer.fill', android: 'construction' },
  statusResolved: { ios: 'checkmark.circle.fill', android: 'check_circle' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

export type IconProps = { name: IconName; size?: number; color?: ColorValue };

export function Icon({ name, size = 24, color }: IconProps) {
  const colors = useColors();
  return <SymbolView name={ICONS[name]} size={size} tintColor={color ?? colors.tint} />;
}
