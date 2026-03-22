export type CloudProvider = 'google' | 'microsoft' | 'dropbox';

export interface CloudAccount {
  provider: CloudProvider;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  cloudAccounts: CloudAccount[];
  primaryProvider: CloudProvider;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
