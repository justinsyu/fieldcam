import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FolderInfo {
  id: string;
  name: string;
  provider: string;
}

const CURRENT_FOLDER_KEY = 'fieldcam_current_folder';
const FAVORITES_KEY = 'fieldcam_folder_favorites';
const RECENTS_KEY = 'fieldcam_folder_recents';
const MAX_RECENTS = 10;

export const folderService = {
  async getCurrentFolder(): Promise<FolderInfo | null> {
    const raw = await AsyncStorage.getItem(CURRENT_FOLDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FolderInfo;
  },

  async setCurrentFolder(folder: FolderInfo): Promise<void> {
    await AsyncStorage.setItem(CURRENT_FOLDER_KEY, JSON.stringify(folder));
    await folderService.addToRecents(folder);
  },

  async getFavorites(): Promise<FolderInfo[]> {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FolderInfo[];
  },

  async addFavorite(folder: FolderInfo): Promise<void> {
    const favorites = await folderService.getFavorites();
    const exists = favorites.some((f) => f.id === folder.id && f.provider === folder.provider);
    if (!exists) {
      favorites.push(folder);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
  },

  async removeFavorite(folder: FolderInfo): Promise<void> {
    const favorites = await folderService.getFavorites();
    const updated = favorites.filter(
      (f) => !(f.id === folder.id && f.provider === folder.provider)
    );
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  async getRecents(): Promise<FolderInfo[]> {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FolderInfo[];
  },

  async addToRecents(folder: FolderInfo): Promise<void> {
    const recents = await folderService.getRecents();
    const filtered = recents.filter(
      (f) => !(f.id === folder.id && f.provider === folder.provider)
    );
    const updated = [folder, ...filtered].slice(0, MAX_RECENTS);
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  },
};
