import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraTopBar } from '../../src/components/camera/CameraTopBar';
import { CameraControls } from '../../src/components/camera/CameraControls';
import { CameraSettingsSheet } from '../../src/components/camera/CameraSettingsSheet';
import { useCamera } from '../../src/hooks/useCamera';
import { useSettings } from '../../src/hooks/useSettings';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui';
import { router, useFocusEffect } from 'expo-router';
import { uploadQueue } from '../../src/services/uploadQueue';
import { useUploads } from '../../src/context/UploadContext';
import { folderService, type FolderInfo } from '../../src/services/folderService';
import { getAnnotationText } from '../../src/services/annotationService';

export default function CameraScreen() {
  const { cameraRef, permission, requestPermission, facing, flash, toggleFacing, toggleFlash, takePicture } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { refresh } = useUploads();
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const { settings, updateSetting } = useSettings();

  useFocusEffect(
    useCallback(() => {
      folderService.getCurrentFolder().then(setCurrentFolder);
    }, [])
  );

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const photo = await takePicture();
      if (photo) {
        console.log('Photo captured:', photo.uri);
        const annotations = await getAnnotationText();
        await uploadQueue.enqueue({
          localUri: photo.uri,
          fileName: `fieldcam_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          fileSize: 0,
          provider: (currentFolder?.provider ?? 'google') as import('../../src/types/auth').CloudProvider,
          folderId: currentFolder?.id ?? 'root',
          folderName: currentFolder?.name ?? 'Not set',
          annotations: annotations || undefined,
        });
        await refresh();
      }
    } finally {
      setIsCapturing(false);
    }
  }, [takePicture, refresh, currentFolder]);

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
          folderName={currentFolder?.name ?? 'Not set'}
          onSettingsPress={() => setSettingsVisible(true)}
          flash={flash}
          onFlashToggle={toggleFlash}
          onFolderPress={() => router.push('/folder-picker')}
        />
        <View style={styles.spacer} />
        {settings?.cameraGrid && (
          <View style={styles.gridOverlay} pointerEvents="none">
            <View style={[styles.gridLineV, { left: '33.33%' }]} />
            <View style={[styles.gridLineV, { left: '66.66%' }]} />
            <View style={[styles.gridLineH, { top: '33.33%' }]} />
            <View style={[styles.gridLineH, { top: '66.66%' }]} />
          </View>
        )}
        <CameraControls
          onCapture={handleCapture}
          onFlipCamera={toggleFacing}
          onQRScan={() => router.push('/qr-scanner')}
          isCapturing={isCapturing}
        />
      </CameraView>

      {settings && (
        <CameraSettingsSheet
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
          settings={settings}
          onUpdateSetting={updateSetting}
        />
      )}
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
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.4)',
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
