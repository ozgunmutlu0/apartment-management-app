import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { useColors } from '@/theme/colors';

import type { TicketCategory } from '../types';

export const CATEGORY_ICONS = {
  elevator: { ios: 'arrow.up.arrow.down.square.fill', android: 'elevator' },
  plumbing: { ios: 'drop.fill', android: 'water_drop' },
  electrical: { ios: 'bolt.fill', android: 'bolt' },
  cleaning: { ios: 'sparkles', android: 'cleaning_services' },
  common_area: { ios: 'building.2.fill', android: 'apartment' },
  heating: { ios: 'flame.fill', android: 'local_fire_department' },
  other: { ios: 'wrench.and.screwdriver.fill', android: 'build' },
} as const satisfies Record<TicketCategory, { ios: SFSymbol; android: AndroidSymbol }>;

export function CategoryIcon({ category, size = 28 }: { category: TicketCategory; size?: number }) {
  const colors = useColors();
  return <SymbolView name={CATEGORY_ICONS[category]} size={size} tintColor={colors.tint} />;
}
