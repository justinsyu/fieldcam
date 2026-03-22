jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
  };
});

import { getProvider } from '../registry';

describe('getProvider', () => {
  it('returns google drive provider', () => {
    const provider = getProvider('google');
    expect(provider).toBeDefined();
    expect(provider.listFolders).toBeDefined();
    expect(provider.createFolder).toBeDefined();
    expect(provider.uploadFile).toBeDefined();
  });

  it('returns onedrive provider', () => {
    const provider = getProvider('microsoft');
    expect(provider).toBeDefined();
    expect(provider.listFolders).toBeDefined();
  });

  it('returns dropbox provider', () => {
    const provider = getProvider('dropbox');
    expect(provider).toBeDefined();
    expect(provider.listFolders).toBeDefined();
  });

  it('throws for unknown provider', () => {
    expect(() => getProvider('unknown' as any)).toThrow();
  });
});
