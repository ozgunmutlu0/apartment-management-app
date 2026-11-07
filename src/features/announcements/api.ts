import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

import {
  isAnnouncementCategory,
  type Announcement,
  type AnnouncementInput,
  type AnnouncementRow,
} from './types';

const SELECT = '*, author:profiles!author_id(full_name)';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: () => ['announcements', 'list'] as const,
  latest: (limit: number) => ['announcements', 'latest', limit] as const,
  detail: (id: string) => ['announcements', 'detail', id] as const,
};

type RawAnnouncement = AnnouncementRow & { author: { full_name: string } | null };

function normalize(row: RawAnnouncement): Announcement {
  return { ...row, category: isAnnouncementCategory(row.category) ? row.category : 'general' };
}

/** Pinned first, then newest. Visibility is limited to the user's building by RLS. */
async function fetchAnnouncements(limit?: number): Promise<Announcement[]> {
  let query = supabase
    .from('announcements')
    .select(SELECT)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as RawAnnouncement[]).map(normalize);
}

export function useAnnouncements() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: announcementKeys.list(),
    enabled: !!profile?.building_id,
    queryFn: () => fetchAnnouncements(),
  });
}

/** Latest announcements (pinned first) for the home dashboard. */
export function useLatestAnnouncements(limit = 3) {
  const { profile } = useAuth();
  return useQuery({
    queryKey: announcementKeys.latest(limit),
    enabled: !!profile?.building_id,
    queryFn: () => fetchAnnouncements(limit),
  });
}

export function useAnnouncement(id: string | undefined) {
  return useQuery({
    queryKey: announcementKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Announcement | null> => {
      const { data, error } = await supabase
        .from('announcements')
        .select(SELECT)
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data ? normalize(data as unknown as RawAnnouncement) : null;
    },
  });
}

function invalidate(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: announcementKeys.all });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (input: AnnouncementInput) => {
      if (!user || !profile?.building_id) throw new Error('no building');
      const { error } = await supabase.from('announcements').insert({
        ...input,
        title: input.title.trim(),
        building_id: profile.building_id,
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: AnnouncementInput & { id: string }) => {
      const { error } = await supabase
        .from('announcements')
        .update({ ...input, title: input.title.trim() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: announcementKeys.detail(id) });
      return invalidate(queryClient);
    },
  });
}

export function useTogglePin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from('announcements').update({ pinned }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(queryClient),
  });
}
