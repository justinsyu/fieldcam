import { secureStorage } from '../secureStorage';
import type { CloudProvider, LinkedCloudAccount } from '../../types/auth';

const TOKEN_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

const MS_CLIENT_ID = '__MICROSOFT_CLIENT_ID__';
const DROPBOX_CLIENT_ID = '__DROPBOX_CLIENT_ID__';
const DROPBOX_CLIENT_SECRET = '__DROPBOX_CLIENT_SECRET__';

export async function getValidAccessToken(provider: CloudProvider): Promise<string> {
  const account = await secureStorage.getCloudAccount(provider);
  if (!account) throw new Error(`Provider "${provider}" is not linked`);

  if (account.expiresAt > Date.now() + TOKEN_BUFFER_MS) {
    return account.accessToken;
  }

  if (provider === 'google') {
    return refreshGoogleToken(account);
  } else if (provider === 'microsoft') {
    return refreshMicrosoftToken(account);
  } else if (provider === 'dropbox') {
    return refreshDropboxToken(account);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function refreshGoogleToken(account: LinkedCloudAccount): Promise<string> {
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  try {
    await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();
    const updated: LinkedCloudAccount = {
      ...account,
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + 3600 * 1000,
    };
    await secureStorage.saveCloudAccount(updated);
    return tokens.accessToken;
  } catch {
    throw new Error('Google token refresh failed. Please re-link Google Drive.');
  }
}

async function refreshMicrosoftToken(account: LinkedCloudAccount): Promise<string> {
  if (!account.refreshToken) throw new Error('No refresh token for Microsoft');

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
      scope: 'Files.ReadWrite User.Read offline_access',
    }).toString(),
  });

  if (!response.ok) throw new Error('Microsoft token refresh failed. Please re-link OneDrive.');

  const data = await response.json();
  const updated: LinkedCloudAccount = {
    ...account,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? account.refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await secureStorage.saveCloudAccount(updated);
  return data.access_token;
}

async function refreshDropboxToken(account: LinkedCloudAccount): Promise<string> {
  if (!account.refreshToken) throw new Error('No refresh token for Dropbox');

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DROPBOX_CLIENT_ID,
      client_secret: DROPBOX_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
    }).toString(),
  });

  if (!response.ok) throw new Error('Dropbox token refresh failed. Please re-link Dropbox.');

  const data = await response.json();
  const updated: LinkedCloudAccount = {
    ...account,
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 14400) * 1000,
  };
  await secureStorage.saveCloudAccount(updated);
  return data.access_token;
}
