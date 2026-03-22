import { useState, useEffect, useCallback } from 'react';
import { settingsService, type AppSettings } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    settingsService.get().then(setSettings);
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const updated = await settingsService.update({ [key]: value });
    setSettings(updated);
  }, []);

  return { settings, updateSetting };
}
