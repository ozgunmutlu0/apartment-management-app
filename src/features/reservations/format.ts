import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useBuildingTimezone } from './api';
import { formatMinutes } from './time';

/** Locale + building-timezone formatters for reservation times. */
export function useReservationFormat() {
  const { i18n } = useTranslation();
  const timeZone = useBuildingTimezone();
  return useMemo(() => {
    const lang = i18n.language;
    const day = new Intl.DateTimeFormat(lang, { timeZone, dateStyle: 'medium' });
    const time = new Intl.DateTimeFormat(lang, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const full = new Intl.DateTimeFormat(lang, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
      hourCycle: 'h23',
    });
    return {
      timeZone,
      /** "12 Kas 2026 18:00 - 19:30" */
      range: (startsAt: string, endsAt: string) =>
        `${day.format(new Date(startsAt))} ${time.format(new Date(startsAt))} - ${time.format(new Date(endsAt))}`,
      start: (startsAt: string) => full.format(new Date(startsAt)),
      timeRange: (startsAt: string, endsAt: string) =>
        `${time.format(new Date(startsAt))} - ${time.format(new Date(endsAt))}`,
      minutes: formatMinutes,
    };
  }, [i18n.language, timeZone]);
}
