import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraTopBar } from '../../src/components/camera/CameraTopBar';
import { CameraControls } from '../../src/components/camera/CameraControls';
import { useCamera } from '../../src/hooks/useCamera';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui';
import { router } from 'expo-router';
import { uploadQueue } from '../../src/services/uploadQueue';
import { useUploads } from '../../src/context/UploadContext';

export default function CameraScreen() {
  const { cameraRef, permission, requestPermission, facing, flash, toggleFacing, toggleFlash, takePicture } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);
  const { refresh } = useUploads();

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const photo = await takePicture();
      if (photo) {
        console.log('Photo captured:', photo.uri);
        await uploadQueue.enqueue({
          localUri: photo.uri,
          fileName: `fieldcam_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          fileSize: 0,
          provider: 'google',
          folderId: 'root',
          folderName: 'Not set',
        });
        await refresh();
      }
    } finally {
      setIsCapturing(false);
    }
  }, [takePicture, refresh]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to take photos.</Text>
        <Button label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} flash={flash}>
        <CameraTopBar
          folderName="Not set"
          onSettingsPress={() => {}}
          flash={flash}
          onFlashToggle={toggleFlash}
        />
        <View style={styles.spacer} />
        <CameraControls
          onCapture={handleCapture}
          onFlipCamera={toggleFacing}
          onQRScan={() => router.push('/qr-scanner')}
          isCapturing={isCapturing}
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
