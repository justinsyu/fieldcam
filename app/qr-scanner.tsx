import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { parseFieldCamQR, qrToFolderInfo } from '../src/services/qrCodeService';
import { folderService } from '../src/services/folderService';
import { Button } from '../src/components/ui';
import { useThemeColors } from '../src/context/ThemeContext';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

export default function QRScannerScreen() {
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.black,
    },
    camera: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanFrame: {
      width: 240,
      height: 240,
      borderWidth: 2,
      borderColor: colors.orange,
      borderRadius: 16,
      backgroundColor: 'transparent',
      marginBottom: spacing.xl,
    },
    overlayText: {
      ...typography.body,
      color: colors.white,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      overflow: 'hidden',
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

  const handleBarcodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);

      const qr = parseFieldCamQR(data);
      if (!qr) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not a valid FieldCam code.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
        return;
      }

      const folderInfo = qrToFolderInfo(qr);
      if (folderInfo) {
        await folderService.setCurrentFolder(folderInfo);
      }

      router.back();
    },
    [scanned]
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to scan QR codes.</Text>
        <Button label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.overlayText}>Scanning for QR Codes...</Text>
        </View>
      </CameraView>
    </View>
  );
}
