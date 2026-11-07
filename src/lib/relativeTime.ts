import i18n from '@/i18n';

type Unit = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';

const UNITS: [Unit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

// Hermes on Android ships without Intl.RelativeTimeFormat (and possibly Intl.PluralRules), so
// feature-detect it and fall back to translated, plural-free strings.
const hasRelativeTimeFormat =
  typeof Intl !== 'undefined' && typeof Intl.RelativeTimeFormat === 'function';

/** Relative time ("3 saat önce" / "3 hours ago") in the given (or current) language. */
export function formatRelative(
  iso: string,
  language: string = i18n.language,
  now: number = Date.now(),
): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const match = UNITS.find(([, seconds]) => Math.abs(diffSeconds) >= seconds);

  if (hasRelativeTimeFormat) {
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    return match
      ? rtf.format(Math.round(diffSeconds / match[1]), match[0])
      : rtf.format(0, 'second');
  }

  const t = i18n.getFixedT(language, 'common');
  if (!match) return t('relativeTime.now');
  const count = Math.abs(Math.round(diffSeconds / match[1]));
  const unit = t(`relativeTime.units.${match[0]}`);
  return diffSeconds < 0
    ? t('relativeTime.past', { count, unit })
    : t('relativeTime.future', { count, unit });
}
