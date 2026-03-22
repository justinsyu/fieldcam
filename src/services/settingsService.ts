import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'fieldcam_settings';

export interface AppSettings {
  uploadImmediately: boolean;
  uploadInBackground: boolean;
  uploadCellular: boolean;
  saveToDevice: boolean;
  saveOriginal: boolean;
  cameraGrid: boolean;
  cameraLevel: boolean;
  promptForDetails: boolean;
  annotationLocation: boolean;
  annotationTimestamp: boolean;
  annotationCustomText: string;
  defaultProfileId: string | null;
  autoProcess: boolean;
}

const DEFAULTS: AppSettings = {
  uploadImmediately: true,
  uploadInBackground: false,
  uploadCellular: true,
  saveToDevice: false,
  saveOriginal: false,
  cameraGrid: false,
  cameraLevel: false,
  promptForDetails: false,
  annotationLocation: true,
  annotationTimestamp: true,
  annotationCustomText: '',
  defaultProfileId: null,
  autoProcess: false,
};

export const settingsService = {
  async get(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  },
  async update(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await settingsService.get();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },
  async reset(): Promise<void> {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  },
};
