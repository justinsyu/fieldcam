import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { secureStorage } from '../services/secureStorage';
import type { User, CloudProvider, AuthState } from '../types/auth';

interface AuthContextValue extends AuthState {
  signIn: (provider: CloudProvider) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });

  useEffect(() => {
    (async () => {
      const user = await secureStorage.getUser() as User | null;
      setState({ user, isAuthenticated: !!user, isLoading: false });
    })();
  }, []);

  const signIn = useCallback(async (provider: CloudProvider) => {
    // OAuth flow will be implemented in Task 5. Placeholder for now.
    const mockUser: User = {
      id: 'placeholder',
      email: 'user@example.com',
      displayName: 'User',
      cloudAccounts: [],
      primaryProvider: provider,
    };
    await secureStorage.saveUser(mockUser);
    setState({ user: mockUser, isAuthenticated: true, isLoading: false });
  }, []);

  const signOut = useCallback(async () => {
    await secureStorage.clearAll();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
