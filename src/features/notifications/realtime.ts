import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

import { notificationKeys } from './api';

/**
 * Subscribes to INSERTs on `notifications` for the signed-in user and refreshes the notification
 * queries plus the feature queries the notification refers to.
 */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient();
  const userId = useAuth().user?.id;

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
          const type = String((payload.new as { type?: string }).type ?? '');
          if (type.startsWith('ticket_'))
            void queryClient.invalidateQueries({ queryKey: ['tickets'] });
          if (type === 'announcement')
            void queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
