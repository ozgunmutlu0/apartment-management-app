const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 hours ago" / "3 saat önce" using the current i18n language. */
export function formatRelative(iso: string, language: string): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  for (const [unit, seconds] of UNITS) {
    if (Math.abs(diffSeconds) >= seconds)
      return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return rtf.format(0, 'second');
}

export function formatDateTime(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(iso),
  );
}
