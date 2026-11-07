import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import type { SemanticColors } from '@/theme/colors';

import type { AnnouncementCategory } from '../types';

export const CATEGORY_SYMBOLS = {
  general: { ios: 'megaphone.fill', android: 'campaign' },
  maintenance: { ios: 'wrench.and.screwdriver.fill', android: 'build' },
  event: { ios: 'party.popper.fill', android: 'celebration' },
  urgent: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  payment: { ios: 'creditcard.fill', android: 'payments' },
} as const satisfies Record<AnnouncementCategory, { ios: SFSymbol; android: AndroidSymbol }>;

export function categoryColor(
  category: AnnouncementCategory,
  colors: SemanticColors,
  // Kept for the existing call sites; colors are scheme-aware already.
  _scheme?: 'light' | 'dark' | null,
): ColorValue {
  switch (category) {
    case 'urgent':
      return colors.red;
    case 'maintenance':
      return colors.orange;
    case 'payment':
      return colors.green;
    case 'event':
      return colors.teal;
    default:
      return colors.secondaryLabel;
  }
}
