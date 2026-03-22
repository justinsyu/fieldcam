export type CloudProvider = 'google' | 'microsoft' | 'dropbox';

export interface LinkedCloudAccount {
  provider: CloudProvider;
  email: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
  linkedAt: string;
}

export interface FieldCamUser {
  uid: string;
  email: string;
  displayName: string;
  initialAuthProvider: 'email' | 'google' | 'apple';
  createdAt: string;
}

export interface AuthState {
  user: FieldCamUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
