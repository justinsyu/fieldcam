import { secureStorage } from '../secureStorage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

describe('secureStorage', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('saves and retrieves a token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
    const token = await secureStorage.getToken('google');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('fieldcam_token_google');
    expect(token).toBe('test-token');
  });

  it('saves a token', async () => {
    await secureStorage.saveToken('google', 'my-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('fieldcam_token_google', 'my-token');
  });

  it('deletes a token', async () => {
    await secureStorage.deleteToken('google');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('fieldcam_token_google');
  });
});
