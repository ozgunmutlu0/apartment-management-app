import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

import type { DueWithPayments, ManagerDue, PaymentMethod, ResidentSummary } from './types';
import { effectiveStatus, remainingOf, toDateString } from './utils';

/** Dues also feed the manager reports. */
function invalidateDues(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['reports'] });
  return queryClient.invalidateQueries({ queryKey: ['dues'] });
}

function useResidentDuesQuery<T>(select: (dues: DueWithPayments[]) => T) {
  const { profile } = useAuth();
  const unitId = profile?.unit_id ?? null;
  return useQuery({
    queryKey: ['dues', 'resident', unitId],
    enabled: !!unitId,
    queryFn: async (): Promise<DueWithPayments[]> => {
      const { data, error } = await supabase
        .from('dues')
        .select('*, payments(*)')
        .eq('unit_id', unitId as string)
        .order('period', { ascending: false });
      if (error) throw error;
      return data.map((d) => ({
        ...d,
        payments: [...d.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at)),
      }));
    },
    select,
  });
}

/** Resident: all dues of the own unit with their payments, newest period first. */
export function useResidentDues() {
  return useResidentDuesQuery((dues) => dues);
}

/** Resident: total outstanding, overdue count and next due date (derived from the same cache). */
export function useResidentSummary() {
  return useResidentDuesQuery((dues): ResidentSummary => {
    let outstanding = 0;
    let overdueCount = 0;
    let nextDueDate: string | null = null;
    const today = toDateString(new Date());
    for (const due of dues) {
      const remaining = remainingOf(due);
      if (due.status === 'paid' || remaining === 0) continue;
      outstanding += remaining;
      if (effectiveStatus(due) === 'overdue') {
        overdueCount += 1;
      } else if (due.due_date >= today && (!nextDueDate || due.due_date < nextDueDate)) {
        nextDueDate = due.due_date;
      }
    }
    return { outstanding, overdueCount, nextDueDate };
  });
}

/** Manager: every unit's due for a period (YYYY-MM-01) with payments and resident names. */
export function useManagerDues(period: string) {
  const { profile } = useAuth();
  const buildingId = profile?.building_id ?? null;
  return useQuery({
    queryKey: ['dues', 'manager', buildingId, period],
    enabled: !!buildingId,
    queryFn: async (): Promise<ManagerDue[]> => {
      const [duesRes, residentsRes] = await Promise.all([
        supabase
          .from('dues')
          .select('*, units!inner(block, number, building_id), payments(*)')
          .eq('period', period)
          .eq('units.building_id', buildingId as string),
        supabase
          .from('profiles')
          .select('full_name, unit_id')
          .eq('building_id', buildingId as string)
          .eq('role', 'resident'),
      ]);
      if (duesRes.error) throw duesRes.error;
      if (residentsRes.error) throw residentsRes.error;

      const names = new Map<string, string[]>();
      for (const r of residentsRes.data) {
        if (!r.unit_id || !r.full_name) continue;
        names.set(r.unit_id, [...(names.get(r.unit_id) ?? []), r.full_name]);
      }

      return duesRes.data
        .map(({ units, ...due }) => ({
          ...due,
          payments: [...due.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at)),
          unitLabel: units.block ? `${units.block}-${units.number}` : units.number,
          residentNames: names.get(due.unit_id) ?? [],
        }))
        .sort((a, b) => a.unitLabel.localeCompare(b.unitLabel, undefined, { numeric: true }));
    },
  });
}

export type GenerateDuesInput = { period: string; amount: number; dueDate: string };
export type GenerateDuesResult = { created: number; skipped: number };

/** Manager: one due per unit of the building for the period; existing dues are left untouched. */
export function useGenerateDues() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async ({
      period,
      amount,
      dueDate,
    }: GenerateDuesInput): Promise<GenerateDuesResult> => {
      const buildingId = profile?.building_id;
      if (!buildingId) throw new Error('no building');
      const units = await supabase.from('units').select('id').eq('building_id', buildingId);
      if (units.error) throw units.error;
      if (units.data.length === 0) return { created: 0, skipped: 0 };
      const { data, error } = await supabase
        .from('dues')
        .upsert(
          units.data.map((u) => ({
            unit_id: u.id,
            period,
            amount,
            due_date: dueDate,
            status: 'unpaid' as const,
          })),
          { onConflict: 'unit_id,period', ignoreDuplicates: true },
        )
        .select('id');
      if (error) throw error;
      return { created: data.length, skipped: units.data.length - data.length };
    },
    onSuccess: () => invalidateDues(queryClient),
  });
}

export type RecordPaymentInput = {
  dueId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
};

/** Manager: records a payment; a DB trigger refreshes the due status. */
export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ dueId, amount, method, paidAt }: RecordPaymentInput) => {
      const { error } = await supabase.from('payments').insert({
        due_id: dueId,
        amount,
        method,
        paid_at: paidAt.toISOString(),
        recorded_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateDues(queryClient),
  });
}

/** Manager: deletes a payment. */
export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => invalidateDues(queryClient),
  });
}
