import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

import type {
  TicketCategory,
  TicketListFilters,
  TicketPriority,
  TicketStatus,
  TicketUnit,
} from './types';

const BUCKET = 'ticket-photos';
const SIGNED_URL_TTL = 60 * 60;

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (filters: TicketListFilters) =>
    ['tickets', 'list', filters.status, filters.category] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
  technicians: (buildingId: string | null | undefined) =>
    ['tickets', 'technicians', buildingId] as const,
};

/** Ticket data also feeds the home dashboard (same keys) and the manager reports. */
function invalidateTickets(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['reports'] });
  return queryClient.invalidateQueries({ queryKey: ticketKeys.all });
}

export type TicketListItem = {
  id: string;
  title: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  created_at: string;
  created_by: string;
  assigned_to: string | null;
  unit: TicketUnit;
  creatorName: string | null;
};

/**
 * Tickets visible to the signed-in user (RLS scopes: resident = own/unit, technician = assigned,
 * manager = whole building), newest first, optionally filtered by status / category.
 */
export function useTickets(filters: TicketListFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ticketKeys.list(filters),
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<TicketListItem[]> => {
      let query = supabase
        .from('tickets')
        .select(
          'id, title, status, category, priority, created_at, created_by, assigned_to, unit:units(block, number), creator:profiles!created_by(full_name)',
        )
        .order('created_at', { ascending: false });
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.category) query = query.eq('category', filters.category);
      const { data, error } = await query;
      if (error) throw error;
      return data.map(({ creator, ...row }) => ({
        ...row,
        creatorName: creator?.full_name ?? null,
      }));
    },
  });
}

export type TicketPhoto = { id: string; storage_path: string; url: string | null };

export type TicketEvent = {
  id: string;
  event_type: string;
  from_status: TicketStatus | null;
  to_status: TicketStatus;
  note: string | null;
  created_at: string;
  actorName: string | null;
  assigneeName: string | null;
};

export type TicketDetail = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  created_by: string;
  assigned_to: string | null;
  unit: TicketUnit;
  creatorName: string | null;
  assigneeName: string | null;
  photos: TicketPhoto[];
  events: TicketEvent[];
};

/** Ticket + photos (signed URLs) + timeline events with actor / assignee names. */
export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ticketKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<TicketDetail | null> => {
      const ticketId = id as string;
      const [ticketRes, photosRes, eventsRes] = await Promise.all([
        supabase
          .from('tickets')
          .select(
            '*, unit:units(block, number), creator:profiles!created_by(full_name), assignee:profiles!assigned_to(full_name)',
          )
          .eq('id', ticketId)
          .maybeSingle(),
        supabase
          .from('ticket_photos')
          .select('id, storage_path')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true }),
        supabase
          .from('ticket_events')
          .select(
            'id, event_type, from_status, to_status, note, created_at, actor:profiles!actor_id(full_name), assignee:profiles!assignee_id(full_name)',
          )
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true }),
      ]);
      if (ticketRes.error) throw ticketRes.error;
      if (photosRes.error) throw photosRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (!ticketRes.data) return null;

      const paths = photosRes.data.map((p) => p.storage_path);
      const urlByPath = new Map<string, string>();
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(paths, SIGNED_URL_TTL);
        for (const item of signed ?? []) {
          if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
        }
      }

      const { creator, assignee, ...ticket } = ticketRes.data;
      return {
        ...ticket,
        creatorName: creator?.full_name ?? null,
        assigneeName: assignee?.full_name ?? null,
        photos: photosRes.data.map((p) => ({ ...p, url: urlByPath.get(p.storage_path) ?? null })),
        events: eventsRes.data.map(({ actor, assignee: eventAssignee, ...event }) => ({
          ...event,
          actorName: actor?.full_name ?? null,
          assigneeName: eventAssignee?.full_name ?? null,
        })),
      };
    },
  });
}

export type Technician = { id: string; full_name: string };

/** Technicians of the current building (for the assign menu; managers only). */
export function useTechnicians(enabled: boolean) {
  const { profile } = useAuth();
  const buildingId = profile?.building_id;
  return useQuery({
    queryKey: ticketKeys.technicians(buildingId),
    enabled: enabled && !!buildingId,
    queryFn: async (): Promise<Technician[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('building_id', buildingId as string)
        .eq('role', 'technician')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });
}

export type NewTicketInput = {
  category: TicketCategory;
  priority: TicketPriority;
  title: string;
  description: string;
  /** Local image URIs (already compressed by the image picker). */
  photoUris: string[];
};

export type CreateTicketResult = { id: string; failedPhotos: number };

const MIN_PHOTO_BYTES = 100;

/** Detects the real image type from magic bytes (the picker may return PNG/WebP/HEIC, not only JPEG). */
function sniffImageType(b: Uint8Array): { contentType: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { contentType: 'image/jpeg', ext: 'jpg' };
  }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { contentType: 'image/png', ext: 'png' };
  }
  const tag = (from: number) => String.fromCharCode(...b.slice(from, from + 4));
  if (tag(0) === 'RIFF' && tag(8) === 'WEBP') return { contentType: 'image/webp', ext: 'webp' };
  if (tag(4) === 'ftyp') {
    const brand = tag(8);
    if (brand.startsWith('hei') || brand.startsWith('mif')) {
      const heic = brand === 'heic' || brand === 'heix';
      return { contentType: heic ? 'image/heic' : 'image/heif', ext: 'heic' };
    }
  }
  return null;
}

async function uploadPhoto(ticketId: string, uri: string, index: number): Promise<void> {
  // RN's fetch() cannot reliably read local file URIs; read the bytes natively instead.
  const bytes = new Uint8Array(await new File(uri).arrayBuffer());
  const type = bytes.length >= MIN_PHOTO_BYTES ? sniffImageType(bytes) : null;
  if (!type) throw new Error('unreadable or unsupported image file');
  const path = `${ticketId}/${Date.now()}-${index}.${type.ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: type.contentType, upsert: false });
  if (uploadError) throw uploadError;
  const { error: rowError } = await supabase
    .from('ticket_photos')
    .insert({ ticket_id: ticketId, storage_path: path });
  if (rowError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw rowError;
  }
}

/** Inserts the ticket, then uploads photos. A failed photo never rolls back the ticket. */
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewTicketInput): Promise<CreateTicketResult> => {
      if (!user || !profile?.building_id) throw new Error('not signed in to a building');
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          building_id: profile.building_id,
          unit_id: profile.unit_id,
          created_by: user.id,
          category: input.category,
          priority: input.priority,
          title: input.title.trim(),
          description: input.description.trim(),
        })
        .select('id')
        .single();
      if (error) throw error;

      const results = await Promise.allSettled(
        input.photoUris.map((uri, index) => uploadPhoto(data.id, uri, index)),
      );
      return {
        id: data.id,
        failedPhotos: results.filter((r) => r.status === 'rejected').length,
      };
    },
    onSettled: () => invalidateTickets(queryClient),
  });
}

function useInvalidatingMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => invalidateTickets(queryClient),
  });
}

export function useUpdateTicketStatus() {
  return useInvalidatingMutation(
    async (v: { ticketId: string; status: TicketStatus; note?: string | null }) => {
      const { error } = await supabase.rpc('update_ticket_status', {
        p_ticket_id: v.ticketId,
        p_status: v.status,
        p_note: v.note?.trim() || undefined,
      });
      if (error) throw error;
    },
  );
}

export function useAssignTicket() {
  return useInvalidatingMutation(
    async (v: { ticketId: string; technicianId: string | null; note?: string | null }) => {
      const { error } = await supabase.rpc('assign_ticket', {
        p_ticket_id: v.ticketId,
        // The generated types cannot express nullable RPC args; null means "unassign" at runtime.
        p_technician_id: v.technicianId as string,
        p_note: v.note?.trim() || undefined,
      });
      if (error) throw error;
    },
  );
}

export function useAddTicketNote() {
  return useInvalidatingMutation(async (v: { ticketId: string; note: string }) => {
    const { error } = await supabase.rpc('add_ticket_note', {
      p_ticket_id: v.ticketId,
      p_note: v.note.trim(),
    });
    if (error) throw error;
  });
}

/**
 * Subscribes to `tickets` changes (INSERT/UPDATE/DELETE visible under RLS) and invalidates all
 * ticket queries. The channel is removed on unmount.
 */
export function useTicketsRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`tickets-${userId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        void invalidateTickets(queryClient);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}

export function errorMessage(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return undefined;
}
