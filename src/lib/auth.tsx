import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import i18n from '@/i18n';
import { isSupportedLanguage, restoreStoredLanguage, setAppLanguage } from '@/i18n/locale';

import type { Database } from './database.types';
import { supabase } from './supabase';

export type Role = Database['public']['Enums']['user_role'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Role of the signed-in user; falls back to `resident` while no profile is loaded. */
  role: Role;
  /** True until the stored session (and, if signed in, the profile) has been resolved. */
  isLoading: boolean;
  /** True when a session exists but the profile could not be loaded. */
  profileError: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves `needsEmailConfirmation: true` when the project requires e-mail confirmation. */
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      await restoreStoredLanguage();
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setSessionReady(true);
    })();

    // Keep this callback synchronous (no supabase calls inside) to avoid auth deadlocks.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setSessionReady(true);
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId as string)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const profile = userId ? (profileQuery.data ?? null) : null;

  // Apply the profile language after login.
  const profileLocale = profile?.locale;
  useEffect(() => {
    if (isSupportedLanguage(profileLocale)) void setAppLanguage(profileLocale);
  }, [profileLocale]);

  const signIn = useCallback<AuthState['signIn']>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback<AuthState['signUp']>(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), locale: i18n.language } },
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const refetchProfile = profileQuery.refetch;
  const refreshProfile = useCallback(async () => {
    await refetchProfile();
  }, [refetchProfile]);

  const isLoading = !sessionReady || (!!userId && profileQuery.isPending);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? 'resident',
      isLoading,
      profileError: !!userId && !profile && profileQuery.isError,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, isLoading, userId, profileQuery.isError, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Cache key helper so screens can update the cached profile after a mutation. */
export { profileKey };
