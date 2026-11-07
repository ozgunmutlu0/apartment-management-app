import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileKey, useAuth, type Profile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export type ProfilePatch = { full_name?: string; phone?: string | null; locale?: 'tr' | 'en' };

/** Updates the signed-in user's own profile (name, phone, locale) and refreshes the cached row. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: ProfilePatch): Promise<Profile> => {
      if (!user) throw new Error('not signed in');
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKey(data.id), data);
    },
  });
}

export type Residence = { buildingName: string | null; block: string | null; number: string | null };

/** Building name and unit (block / number) for the current profile. */
export function useResidence(buildingId: string | null, unitId: string | null) {
  return useQuery({
    queryKey: ['residence', buildingId, unitId],
    enabled: !!buildingId,
    queryFn: async (): Promise<Residence> => {
      const [building, unit] = await Promise.all([
        supabase.from('buildings').select('name').eq('id', buildingId as string).maybeSingle(),
        unitId
          ? supabase.from('units').select('block, number').eq('id', unitId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (building.error) throw building.error;
      if (unit.error) throw unit.error;
      return {
        buildingName: building.data?.name ?? null,
        block: unit.data?.block ?? null,
        number: unit.data?.number ?? null,
      };
    },
  });
}
