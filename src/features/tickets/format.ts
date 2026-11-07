import i18n from '@/i18n';

import type { TicketUnit } from './types';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** Relative time ("3 saat önce" / "3 hours ago") in the current i18n language. */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSeconds) >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return rtf.format(0, 'second');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });
}

export function unitLabel(unit: TicketUnit): string | null {
  if (!unit) return null;
  return unit.block ? `${unit.block}-${unit.number}` : unit.number;
}
