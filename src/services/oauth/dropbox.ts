import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { LinkedCloudAccount } from '../../types/auth';

WebBrowser.maybeCompleteAuthSession();

const DROPBOX_CLIENT_ID = '__DROPBOX_CLIENT_ID__';
const DROPBOX_CLIENT_SECRET = '__DROPBOX_CLIENT_SECRET__';

export async function linkDropboxAccount(): Promise<LinkedCloudAccount> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'fieldcam', path: 'oauth/dropbox' });

  const request = new AuthSession.AuthRequest({
    clientId: DROPBOX_CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      token_access_type: 'offline',
    },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
  });

  if (result.type !== 'success' || !result.params.code) {
    throw new Error('Dropbox sign-in cancelled');
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: DROPBOX_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier!,
        client_secret: DROPBOX_CLIENT_SECRET,
      },
    },
    { tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token' }
  );

  const accountRes = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenResult.accessToken}`,
    },
  });
  const account = await accountRes.json();

  return {
    provider: 'dropbox',
    email: account.email ?? '',
    accessToken: tokenResult.accessToken!,
    refreshToken: tokenResult.refreshToken ?? null,
    expiresAt: Date.now() + (tokenResult.expiresIn ?? 14400) * 1000,
    linkedAt: new Date().toISOString(),
  };
}
