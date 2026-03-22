jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
  };
});

global.fetch = jest.fn();

import { getValidAccessToken } from '../tokenRefresh';
import { secureStorage } from '../../secureStorage';
import type { LinkedCloudAccount } from '../../../types/auth';

describe('getValidAccessToken', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    await secureStorage.deleteCloudAccount('google');
    await secureStorage.deleteCloudAccount('microsoft');
    await secureStorage.deleteCloudAccount('dropbox');
  });

  it('returns cached token if not expired', async () => {
    const account: LinkedCloudAccount = {
      provider: 'microsoft',
      email: 'test@example.com',
      accessToken: 'valid-token',
      refreshToken: 'refresh-123',
      expiresAt: Date.now() + 600000,
      linkedAt: new Date().toISOString(),
    };
    await secureStorage.saveCloudAccount(account);

    const token = await getValidAccessToken('microsoft');
    expect(token).toBe('valid-token');
  });

  it('refreshes Microsoft token when expired', async () => {
    const account: LinkedCloudAccount = {
      provider: 'microsoft',
      email: 'test@example.com',
      accessToken: 'old-token',
      refreshToken: 'refresh-123',
      expiresAt: Date.now() - 1000,
      linkedAt: new Date().toISOString(),
    };
    await secureStorage.saveCloudAccount(account);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      }),
    });

    const token = await getValidAccessToken('microsoft');
    expect(token).toBe('new-token');
  });

  it('refreshes Dropbox token when expired', async () => {
    const account: LinkedCloudAccount = {
      provider: 'dropbox',
      email: 'test@example.com',
      accessToken: 'old-dbx-token',
      refreshToken: 'dbx-refresh-123',
      expiresAt: Date.now() - 1000,
      linkedAt: new Date().toISOString(),
    };
    await secureStorage.saveCloudAccount(account);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-dbx-token',
        expires_in: 14400,
      }),
    });

    const token = await getValidAccessToken('dropbox');
    expect(token).toBe('new-dbx-token');
  });

  it('throws for unlinked provider', async () => {
    await expect(getValidAccessToken('dropbox')).rejects.toThrow('not linked');
  });

  it('throws when Microsoft refresh fails', async () => {
    const account: LinkedCloudAccount = {
      provider: 'microsoft',
      email: 'test@example.com',
      accessToken: 'old-token',
      refreshToken: 'bad-refresh',
      expiresAt: Date.now() - 1000,
      linkedAt: new Date().toISOString(),
    };
    await secureStorage.saveCloudAccount(account);

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    await expect(getValidAccessToken('microsoft')).rejects.toThrow('refresh failed');
  });
});
