import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { DEFAULT_TIMEZONE, nextDay, zonedInstant, type CalendarDay } from './time';

export type CommonArea = Database['public']['Tables']['common_areas']['Row'];
export type ReservationStatus = Database['public']['Enums']['reservation_status'];

export type MyReservation = {
  id: string;
  area_id: string;
  starts_at: string;
  ends_at: string;
  status: ReservationStatus;
  areaName: string;
};

export const reservationKeys = {
  all: ['reservations'] as const,
  areas: (buildingId: string | null | undefined) => ['reservations', 'areas', buildingId] as const,
  mine: (userId: string | undefined) => ['reservations', 'mine', userId] as const,
  day: (areaId: string | undefined, startIso: string) =>
    ['reservations', 'day', areaId, startIso] as const,
  timezone: (buildingId: string | null | undefined) =>
    ['buildings', 'timezone', buildingId] as const,
};

/** Building IANA timezone (`buildings.timezone`), defaulting to Europe/Istanbul. */
export function useBuildingTimezone(): string {
  const { profile } = useAuth();
  const buildingId = profile?.building_id;
  const { data } = useQuery({
    queryKey: reservationKeys.timezone(buildingId),
    enabled: !!buildingId,
    staleTime: Infinity,
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from('buildings')
        .select('timezone')
        .eq('id', buildingId as string)
        .maybeSingle();
      if (error) throw error;
      return row?.timezone ?? DEFAULT_TIMEZONE;
    },
  });
  return data ?? DEFAULT_TIMEZONE;
}

export function useCommonAreas() {
  const { profile } = useAuth();
  const buildingId = profile?.building_id;
  return useQuery({
    queryKey: reservationKeys.areas(buildingId),
    enabled: !!buildingId,
    queryFn: async (): Promise<CommonArea[]> => {
      const { data, error } = await supabase
        .from('common_areas')
        .select('*')
        .eq('building_id', buildingId as string)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

function useMyReservationsQuery<T>(select: (rows: MyReservation[]) => T) {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    queryKey: reservationKeys.mine(userId),
    enabled: !!userId,
    queryFn: async (): Promise<MyReservation[]> => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, area_id, starts_at, ends_at, status, area:common_areas(name)')
        .eq('user_id', userId as string)
        .order('starts_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data.map(({ area, ...row }) => ({ ...row, areaName: area?.name ?? '' }));
    },
    select,
  });
}

export type SplitReservations = { upcoming: MyReservation[]; past: MyReservation[] };

/** Own reservations: upcoming = confirmed and not yet ended (soonest first); the rest is past. */
export function useMyReservations() {
  return useMyReservationsQuery((rows): SplitReservations => {
    const now = Date.now();
    const upcoming = rows
      .filter((r) => r.status === 'confirmed' && new Date(r.ends_at).getTime() > now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const upcomingIds = new Set(upcoming.map((r) => r.id));
    return { upcoming, past: rows.filter((r) => !upcomingIds.has(r.id)) };
  });
}

/** The next upcoming own reservation (for the home dashboard). */
export function useNextReservation() {
  return useMyReservationsQuery((rows): MyReservation | null => {
    const now = Date.now();
    return (
      rows
        .filter((r) => r.status === 'confirmed' && new Date(r.ends_at).getTime() > now)
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ?? null
    );
  });
}

export type BookedSlot = { id: string; starts_at: string; ends_at: string };

/** Confirmed reservations of an area on a calendar day of the building timezone. */
export function useAreaDayReservations(
  areaId: string | undefined,
  day: CalendarDay,
  timeZone: string,
) {
  const start = zonedInstant(day, 0, timeZone).toISOString();
  const end = zonedInstant(nextDay(day), 0, timeZone).toISOString();
  return useQuery({
    queryKey: reservationKeys.day(areaId, start),
    enabled: !!areaId,
    queryFn: async (): Promise<BookedSlot[]> => {
      const { data, error } = await supabase
        .from('reservations')
        .select('id, starts_at, ends_at')
        .eq('area_id', areaId as string)
        .eq('status', 'confirmed')
        .lt('starts_at', end)
        .gt('ends_at', start)
        .order('starts_at');
      if (error) throw error;
      return data;
    },
  });
}

export type NewReservationInput = { areaId: string; startsAt: Date; endsAt: Date };

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ areaId, startsAt, endsAt }: NewReservationInput) => {
      if (!user) throw new Error('not signed in');
      const { error } = await supabase.from('reservations').insert({
        area_id: areaId,
        user_id: user.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}

export type ReservationErrorKey = 'conflict' | 'past' | 'hours' | 'sameDay' | 'generic';

/** Maps a Postgres/PostgREST error to a localized message key (23P01 = exclusion violation). */
export function reservationErrorKey(error: unknown): ReservationErrorKey {
  const e = error as { code?: string; message?: string } | null;
  if (e?.code === '23P01') return 'conflict';
  if (e?.code === '23514') {
    const m = (e.message ?? '').toLowerCase();
    if (m.includes('past')) return 'past';
    if (m.includes('opening hours')) return 'hours';
    if (m.includes('same day')) return 'sameDay';
  }
  return 'generic';
}
