import type { LinkedCloudAccount } from '../../types/auth';

const MS_CLIENT_ID = '__MICROSOFT_CLIENT_ID__';

export async function linkMicrosoftAccount(): Promise<LinkedCloudAccount> {
  const { PublicClientApplication } = require('react-native-msal');

  const config = {
    auth: {
      clientId: MS_CLIENT_ID,
      authority: 'https://login.microsoftonline.com/common',
    },
  };

  const pca = new PublicClientApplication(config);
  await pca.init();

  const result = await pca.acquireToken({
    scopes: ['Files.ReadWrite', 'User.Read', 'offline_access'],
  });

  if (!result) throw new Error('Microsoft sign-in cancelled');

  const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${result.accessToken}` },
  });
  const profile = await profileRes.json();

  return {
    provider: 'microsoft',
    email: profile.mail ?? profile.userPrincipalName ?? '',
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? null,
    expiresAt: result.expiresOn
      ? new Date(result.expiresOn).getTime()
      : Date.now() + 3600 * 1000,
    linkedAt: new Date().toISOString(),
  };
}
