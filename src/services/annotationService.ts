import * as Location from 'expo-location';
import { settingsService } from './settingsService';

export async function getAnnotationText(): Promise<string> {
  const settings = await settingsService.get();
  const parts: string[] = [];

  if (settings.annotationTimestamp) {
    parts.push(new Date().toLocaleString());
  }

  if (settings.annotationLocation) {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      parts.push(
        `${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`
      );
    } catch {
      // skip if location unavailable
    }
  }

  if (settings.annotationCustomText) {
    parts.push(settings.annotationCustomText);
  }

  return parts.join(' | ');
}
