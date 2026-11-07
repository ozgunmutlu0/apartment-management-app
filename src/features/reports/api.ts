import { useQuery } from '@tanstack/react-query';

import { paidTotal, periodOf, remainingOf, effectiveStatus } from '@/features/dues/utils';
import { TICKET_CATEGORIES, TICKET_STATUSES } from '@/features/tickets/types';
import type { TicketCategory, TicketStatus } from '@/features/tickets/types';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type ReportPeriod = 'month' | 'quarter' | 'year';
export const REPORT_PERIODS: readonly ReportPeriod[] = ['month', 'quarter', 'year'];

/** Device-local start of the period (month = this month, quarter = this + previous 2 months). */
export function periodStart(period: ReportPeriod, now: Date = new Date()): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  if (period === 'month') return new Date(y, m, 1);
  if (period === 'quarter') return new Date(y, m - 2, 1);
  return new Date(y, 0, 1);
}

export type ReportData = {
  from: Date;
  to: Date;
  tickets: {
    total: number;
    byStatus: Record<TicketStatus, number>;
    byCategory: Record<TicketCategory, number>;
    /** Mean of resolved_at - created_at over resolved tickets, in hours; null if none. */
    avgResolutionHours: number | null;
  };
  dues: {
    count: number;
    expected: number;
    collected: number;
    /** Collected / expected (0..1); null when nothing is expected. */
    rate: number | null;
    overdueTotal: number;
  };
};

function emptyRecord<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

/**
 * Manager report. Aggregation is done client-side over the rows RLS exposes to the manager
 * (whole building). Fine at this scale; PostgREST caps responses at 1000 rows by default.
 */
export function useReport(period: ReportPeriod) {
  const { profile } = useAuth();
  const buildingId = profile?.building_id ?? null;
  const from = periodStart(period);
  const fromIso = from.toISOString();
  const fromPeriod = periodOf(from);
  return useQuery({
    queryKey: ['reports', buildingId, period, fromPeriod],
    enabled: !!buildingId,
    queryFn: async (): Promise<ReportData> => {
      const now = new Date();
      const [ticketsRes, duesRes] = await Promise.all([
        supabase
          .from('tickets')
          .select('status, category, created_at, resolved_at')
          .eq('building_id', buildingId as string)
          .gte('created_at', fromIso),
        supabase
          .from('dues')
          .select('*, payments(*), units!inner(building_id)')
          .eq('units.building_id', buildingId as string)
          .gte('period', fromPeriod)
          .lte('period', periodOf(now)),
      ]);
      if (ticketsRes.error) throw ticketsRes.error;
      if (duesRes.error) throw duesRes.error;

      const byStatus = emptyRecord(TICKET_STATUSES);
      const byCategory = emptyRecord(TICKET_CATEGORIES);
      let resolvedMs = 0;
      let resolvedCount = 0;
      for (const row of ticketsRes.data) {
        byStatus[row.status] += 1;
        byCategory[row.category] += 1;
        if (row.resolved_at) {
          const ms = new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime();
          if (ms >= 0) {
            resolvedMs += ms;
            resolvedCount += 1;
          }
        }
      }

      let expected = 0;
      let collected = 0;
      let overdueTotal = 0;
      for (const due of duesRes.data) {
        expected += Number(due.amount);
        collected += paidTotal(due.payments);
        if (effectiveStatus(due) === 'overdue') overdueTotal += remainingOf(due);
      }

      return {
        from,
        to: now,
        tickets: {
          total: ticketsRes.data.length,
          byStatus,
          byCategory,
          avgResolutionHours: resolvedCount > 0 ? resolvedMs / resolvedCount / 3_600_000 : null,
        },
        dues: {
          count: duesRes.data.length,
          expected,
          collected,
          rate: expected > 0 ? collected / expected : null,
          overdueTotal,
        },
      };
    },
  });
}
