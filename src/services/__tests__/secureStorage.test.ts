jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
  };
});

import { secureStorage } from '../secureStorage';
import type { LinkedCloudAccount } from '../../types/auth';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccount: LinkedCloudAccount = {
    provider: 'google',
    email: 'test@example.com',
    accessToken: 'access-123',
    refreshToken: null,
    expiresAt: Date.now() + 3600000,
    linkedAt: new Date().toISOString(),
  };

  it('saves and retrieves a cloud account', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    const result = await secureStorage.getCloudAccount('google');
    expect(result).toEqual(mockAccount);
  });

  it('returns null for unlinked provider', async () => {
    const result = await secureStorage.getCloudAccount('microsoft');
    expect(result).toBeNull();
  });

  it('deletes a cloud account', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    await secureStorage.deleteCloudAccount('google');
    const result = await secureStorage.getCloudAccount('google');
    expect(result).toBeNull();
  });

  it('lists all linked accounts', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    const msAccount: LinkedCloudAccount = { ...mockAccount, provider: 'microsoft', refreshToken: 'refresh-456' };
    await secureStorage.saveCloudAccount(msAccount);
    const accounts = await secureStorage.getLinkedAccounts();
    expect(accounts).toHaveLength(2);
  });

  it('saves and retrieves user', async () => {
    const user = { uid: 'uid-1', email: 'a@b.com', displayName: 'Test', initialAuthProvider: 'email' as const, createdAt: new Date().toISOString() };
    await secureStorage.saveUser(user);
    const result = await secureStorage.getUser();
    expect(result).toEqual(user);
  });

  it('clears all data', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    await secureStorage.clearAll();
    const accounts = await secureStorage.getLinkedAccounts();
    expect(accounts).toHaveLength(0);
  });
});
