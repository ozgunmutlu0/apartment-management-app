import i18n from '@/i18n';

import type { TicketUnit } from './types';

export { formatRelative } from '@/lib/relativeTime';

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });
}

export function unitLabel(unit: TicketUnit): string | null {
  if (!unit) return null;
  return unit.block ? `${unit.block}-${unit.number}` : unit.number;
}
