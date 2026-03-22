import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CameraControlsProps {
  onCapture: () => void;
  onFlipCamera: () => void;
  onQRScan: () => void;
  isCapturing: boolean;
}

export function CameraControls({ onCapture, onFlipCamera, onQRScan, isCapturing }: CameraControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onQRScan} style={styles.sideButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="qr-code-outline" size={32} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onCapture} style={[styles.shutter, isCapturing && styles.shutterCapturing]} activeOpacity={0.8}>
        <View style={styles.shutterInner} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onFlipCamera} style={styles.sideButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="camera-reverse-outline" size={32} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const SHUTTER_SIZE = 72;
const SHUTTER_INNER_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  sideButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: {
    borderColor: colors.orange,
  },
  shutterInner: {
    width: SHUTTER_INNER_SIZE,
    height: SHUTTER_INNER_SIZE,
    borderRadius: SHUTTER_INNER_SIZE / 2,
    backgroundColor: colors.white,
  },
});
