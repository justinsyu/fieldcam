import * as SecureStore from 'expo-secure-store';
import type { CloudProvider, LinkedCloudAccount, FieldCamUser } from '../types/auth';

const CLOUD_PREFIX = 'fieldcam_cloud_';
const USER_KEY = 'fieldcam_user';
const ALL_PROVIDERS: CloudProvider[] = ['google', 'microsoft', 'dropbox'];

export const secureStorage = {
  async saveCloudAccount(account: LinkedCloudAccount): Promise<void> {
    await SecureStore.setItemAsync(`${CLOUD_PREFIX}${account.provider}`, JSON.stringify(account));
  },

  async getCloudAccount(provider: CloudProvider): Promise<LinkedCloudAccount | null> {
    const data = await SecureStore.getItemAsync(`${CLOUD_PREFIX}${provider}`);
    return data ? JSON.parse(data) : null;
  },

  async deleteCloudAccount(provider: CloudProvider): Promise<void> {
    await SecureStore.deleteItemAsync(`${CLOUD_PREFIX}${provider}`);
  },

  async getLinkedAccounts(): Promise<LinkedCloudAccount[]> {
    const accounts: LinkedCloudAccount[] = [];
    for (const provider of ALL_PROVIDERS) {
      const account = await this.getCloudAccount(provider);
      if (account) accounts.push(account);
    }
    return accounts;
  },

  async saveUser(user: FieldCamUser): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<FieldCamUser | null> {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
    for (const provider of ALL_PROVIDERS) {
      await SecureStore.deleteItemAsync(`${CLOUD_PREFIX}${provider}`);
      // Clean up legacy keys from pre-Firebase version
      await SecureStore.deleteItemAsync(`fieldcam_token_${provider}`);
    }
  },
};
