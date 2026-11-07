import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { DueStatus, DueWithPayments, Payment } from './types';

/** Local calendar date as YYYY-MM-DD. */
export function toDateString(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string (as stored in `date` columns) as a local date. */
export function parseDateString(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** First day of the month containing `date`, as YYYY-MM-01. */
export function periodOf(date: Date): string {
  return toDateString(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function shiftPeriod(period: string, months: number): string {
  const d = parseDateString(period);
  return periodOf(new Date(d.getFullYear(), d.getMonth() + months, 1));
}

export function paidTotal(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + Number(p.amount), 0);
}

/** Outstanding amount of a due (never negative). */
export function remainingOf(due: Pick<DueWithPayments, 'amount' | 'payments'>): number {
  return Math.max(0, Math.round((Number(due.amount) - paidTotal(due.payments)) * 100) / 100);
}

/** Status shown to users: an unpaid due past its due date is shown as overdue. */
export function effectiveStatus(due: Pick<DueWithPayments, 'status' | 'due_date'>): DueStatus {
  if (due.status !== 'unpaid') return due.status;
  return due.due_date < toDateString(new Date()) ? 'overdue' : 'unpaid';
}

/** Parses a user-typed amount ("1.250,50" or "1250.5"); returns NaN when invalid. */
export function parseAmount(input: string): number {
  const s = input.trim().replace(/\s/g, '');
  if (!s) return NaN;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : NaN;
}

/** Locale-aware formatters (TRY currency, month names, dates) following the i18n language. */
export function useDuesFormat() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return useMemo(() => {
    const money = new Intl.NumberFormat(lang, { style: 'currency', currency: 'TRY' });
    const month = new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' });
    const date = new Intl.DateTimeFormat(lang, { dateStyle: 'medium' });
    return {
      money: (value: number) => money.format(value),
      month: (period: string) => month.format(parseDateString(period)),
      /** Accepts a YYYY-MM-DD date, an ISO timestamp or a Date. */
      date: (value: string | Date) =>
        date.format(
          typeof value === 'string'
            ? value.length > 10
              ? new Date(value)
              : parseDateString(value)
            : value,
        ),
    };
  }, [lang]);
}
