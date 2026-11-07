export { formatRelative } from '@/lib/relativeTime';

export function formatDateTime(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeStyle: 'short' }).format(
    new Date(iso),
  );
}
