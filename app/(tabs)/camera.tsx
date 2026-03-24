import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { CameraTopBar } from '../../src/components/camera/CameraTopBar';
import { CameraControls } from '../../src/components/camera/CameraControls';
import { CameraSettingsSheet } from '../../src/components/camera/CameraSettingsSheet';
import { useCamera } from '../../src/hooks/useCamera';
import { useSettings } from '../../src/hooks/useSettings';
import { useThemeColors } from '../../src/context/ThemeContext';
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
  const { refresh, uploadPending } = useUploads();
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const { settings, updateSetting } = useSettings();
  const colors = useThemeColors();

  const [locationEnabled, setLocationEnabled] = useState<boolean>(
    () => settings?.annotationLocation ?? true
  );
  const [annotationsEnabled, setAnnotationsEnabled] = useState<boolean>(
    () => (settings?.annotationLocation ?? true) || (settings?.annotationTimestamp ?? true)
  );

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'space-between',
    },
    spacer: {
      flex: 1,
    },
    annotationBanner: {
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginTop: spacing.xs,
    },
    annotationBannerText: {
      ...typography.label,
      color: colors.success,
      fontSize: 12,
      letterSpacing: 0.5,
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
  }), [colors]);

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
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);
        const fileSize = (fileInfo.exists && 'size' in fileInfo) ? ((fileInfo as any).size ?? 0) : 0;
        await uploadQueue.enqueue({
          localUri: photo.uri,
          fileName: `fieldcam_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          fileSize,
          provider: (currentFolder?.provider ?? 'google') as import('../../src/types/auth').CloudProvider,
          folderId: currentFolder?.id ?? 'root',
          folderName: currentFolder?.name ?? 'Not set',
          annotations: annotations || undefined,
        });
        await refresh();
        // Trigger upload processing
        uploadPending();
      }
    } finally {
      setIsCapturing(false);
    }
  }, [takePicture, refresh, uploadPending, currentFolder]);

  const handleLocationToggle = useCallback(() => {
    setLocationEnabled(prev => !prev);
  }, []);

  const handleAnnotationToggle = useCallback(() => {
    setAnnotationsEnabled(prev => !prev);
  }, []);

  const annotationBannerParts: string[] = [];
  if (annotationsEnabled) {
    if (locationEnabled) annotationBannerParts.push('GPS');
    if (settings?.annotationTimestamp) annotationBannerParts.push('Timestamp');
    if (settings?.annotationCustomText) annotationBannerParts.push('Note');
  }

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
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} flash={flash} />

      <View style={styles.overlay}>
        <CameraTopBar
          folderName={currentFolder?.name ?? 'Not set'}
          onSettingsPress={() => setSettingsVisible(true)}
          flash={flash}
          onFlashToggle={toggleFlash}
          onFolderPress={() => router.push('/folder-picker')}
          locationEnabled={locationEnabled}
          onLocationToggle={handleLocationToggle}
        />

        {annotationsEnabled && annotationBannerParts.length > 0 && (
          <View style={styles.annotationBanner}>
            <Text style={styles.annotationBannerText}>
              {annotationBannerParts.join(' | ')}
            </Text>
          </View>
        )}

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
          annotationsEnabled={annotationsEnabled}
          onAnnotationToggle={handleAnnotationToggle}
        />
      </View>

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
