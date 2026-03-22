import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { secureStorage } from '../services/secureStorage';
import type { FieldCamUser, AuthState, LinkedCloudAccount } from '../types/auth';

// Configure Google Sign-In with Drive scope
GoogleSignin.configure({
  webClientId: '__GOOGLE_WEB_CLIENT_ID__',
  scopes: ['https://www.googleapis.com/auth/drive'],
  offlineAccess: false,
});

interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string, password: string, isNewAccount: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  devBypass: () => Promise<void>;
  linkedAccounts: LinkedCloudAccount[];
  refreshLinkedAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseUserToFieldCam(
  fbUser: FirebaseAuthTypes.User,
  provider: 'email' | 'google' | 'apple'
): FieldCamUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? fbUser.email ?? '',
    initialAuthProvider: provider,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedCloudAccount[]>([]);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const providerData = fbUser.providerData;
        let provider: 'email' | 'google' | 'apple' = 'email';
        if (providerData.some((p) => p.providerId === 'google.com')) provider = 'google';
        if (providerData.some((p) => p.providerId === 'apple.com')) provider = 'apple';

        const user = firebaseUserToFieldCam(fbUser, provider);
        await secureStorage.saveUser(user);
        const accounts = await secureStorage.getLinkedAccounts();
        setLinkedAccounts(accounts);
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        setLinkedAccounts([]);
      }
    });
    return unsubscribe;
  }, []);

  const refreshLinkedAccounts = useCallback(async () => {
    const accounts = await secureStorage.getLinkedAccounts();
    setLinkedAccounts(accounts);
  }, []);

  const devBypass = useCallback(async () => {
    if (!__DEV__) return;
    const mockUser: FieldCamUser = {
      uid: 'dev-user-uid',
      email: 'dev@fieldcam.local',
      displayName: 'Dev User',
      initialAuthProvider: 'email',
      createdAt: new Date().toISOString(),
    };
    await secureStorage.saveUser(mockUser);
    setState({ user: mockUser, isAuthenticated: true, isLoading: false });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string, isNewAccount: boolean) => {
    try {
      if (isNewAccount) {
        await auth().createUserWithEmailAndPassword(email, password);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error: any) {
      const message = error.message ?? String(error);
      Alert.alert('Sign-in failed', message);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token from Google');

      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);

      const tokens = await GoogleSignin.getTokens();
      const googleUser = await GoogleSignin.getCurrentUser();
      const driveAccount: LinkedCloudAccount = {
        provider: 'google',
        email: googleUser?.user.email ?? '',
        accessToken: tokens.accessToken,
        refreshToken: null,
        expiresAt: Date.now() + 3600 * 1000,
        linkedAt: new Date().toISOString(),
      };
      await secureStorage.saveCloudAccount(driveAccount);
      await refreshLinkedAccounts();
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        const pendingCredential = error.credential;
        if (pendingCredential) {
          try {
            const currentUser = auth().currentUser;
            if (currentUser) {
              await currentUser.linkWithCredential(pendingCredential);
              return;
            }
          } catch {
            // Fall through to alert
          }
        }
        Alert.alert('Account exists', 'An account with this email already exists. Please sign in with your original method first, then link Google in Settings.');
      } else if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign-In failed', error.message ?? String(error));
      }
    }
  }, [refreshLinkedAccounts]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const { AppleAuthentication } = require('expo-apple-authentication');
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleCredential.identityToken) throw new Error('No identity token from Apple');

      const credential = auth.AppleAuthProvider.credential(
        appleCredential.identityToken,
        appleCredential.authorizationCode ?? undefined
      );
      await auth().signInWithCredential(credential);
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In failed', error.message ?? String(error));
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut().catch(() => {});
      await auth().signOut();
      await secureStorage.clearAll();
    } catch (error: any) {
      Alert.alert('Sign-out failed', error.message ?? String(error));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;
      await currentUser.delete();
      await secureStorage.clearAll();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Re-authentication required', 'Please sign out and sign back in before deleting your account.');
      } else {
        Alert.alert('Delete failed', error.message ?? String(error));
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      signInWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
      devBypass,
      linkedAccounts,
      refreshLinkedAccounts,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
