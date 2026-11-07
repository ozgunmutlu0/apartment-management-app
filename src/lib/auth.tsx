import { createContext, useContext, type ReactNode } from 'react';

// TODO(WP3): replace this mock with the real Supabase auth (session, profile.role, sign in/out).

export type Role = 'resident' | 'manager' | 'technician';

export type AuthState = {
  session: null | { userId: string };
  role: Role;
  isLoading: boolean;
};

// TODO(WP3): remove. Change this constant to preview the different tab sets.
const MOCK_ROLE: Role = 'resident';

const mock: AuthState = { session: { userId: 'mock-user' }, role: MOCK_ROLE, isLoading: false };

const AuthContext = createContext<AuthState>(mock);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={mock}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
