import { useState, useRef, useCallback } from 'react';
import { CameraView as ExpoCameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

export function useCamera() {
  const cameraRef = useRef<ExpoCameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [showGrid, setShowGrid] = useState(false);

  const toggleFacing = useCallback(() => {
    setFacing(f => (f === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash(f => (f === 'off' ? 'on' : 'off'));
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return null;
    const cacheDir = FileSystem.cacheDirectory + 'Camera/';
    const dirInfo = await FileSystem.getInfoAsync(cacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
    }
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, exif: true });
    return photo;
  }, []);

  return {
    cameraRef,
    permission,
    requestPermission,
    facing,
    flash,
    showGrid,
    setShowGrid,
    toggleFacing,
    toggleFlash,
    takePicture,
  };
}
