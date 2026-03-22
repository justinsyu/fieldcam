import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { CloudProvider, CloudAccount } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

// Replace with real client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__';

export async function performOAuth(provider: CloudProvider): Promise<CloudAccount | null> {
  if (provider === 'google') {
    return performGoogleOAuth();
  }
  // Microsoft and Dropbox: show alert for now
  throw new Error(`OAuth for ${provider} not yet implemented`);
}

async function performGoogleOAuth(): Promise<CloudAccount | null> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'fieldcam' });

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync({
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  });

  if (result.type !== 'success' || !result.params.code) {
    return null;
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier! },
    },
    { tokenEndpoint: 'https://oauth2.googleapis.com/token' }
  );

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
  });
  const userInfo = await userInfoRes.json();

  return {
    provider: 'google',
    email: userInfo.email,
    accessToken: tokenResult.accessToken!,
    refreshToken: tokenResult.refreshToken ?? '',
    expiresAt: Date.now() + (tokenResult.expiresIn ?? 3600) * 1000,
  };
}
