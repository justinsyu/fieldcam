import * as SecureStore from 'expo-secure-store';
import type { CloudProvider } from '../types/auth';

const TOKEN_PREFIX = 'fieldcam_token_';
const USER_KEY = 'fieldcam_user';

export const secureStorage = {
  async saveToken(provider: CloudProvider, token: string): Promise<void> {
    await SecureStore.setItemAsync(`${TOKEN_PREFIX}${provider}`, token);
  },
  async getToken(provider: CloudProvider): Promise<string | null> {
    return SecureStore.getItemAsync(`${TOKEN_PREFIX}${provider}`);
  },
  async deleteToken(provider: CloudProvider): Promise<void> {
    await SecureStore.deleteItemAsync(`${TOKEN_PREFIX}${provider}`);
  },
  async saveUser(user: object): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async getUser(): Promise<object | null> {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
    for (const provider of ['google', 'microsoft', 'dropbox'] as CloudProvider[]) {
      await SecureStore.deleteItemAsync(`${TOKEN_PREFIX}${provider}`);
    }
  },
};
