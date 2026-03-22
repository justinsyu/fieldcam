import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { secureStorage } from '../services/secureStorage';
import { performOAuth } from '../services/oauth';
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
    try {
      const account = await performOAuth(provider);
      if (!account) {
        // User cancelled the OAuth flow
        return;
      }
      const user: User = {
        id: account.email,
        email: account.email,
        displayName: account.email,
        cloudAccounts: [account],
        primaryProvider: provider,
      };
      await secureStorage.saveUser(user);
      await secureStorage.saveToken(provider, account.accessToken);
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('not yet implemented')) {
        Alert.alert('Coming soon', `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is coming soon.`);
      } else {
        Alert.alert('Sign-in failed', message);
      }
    }
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
