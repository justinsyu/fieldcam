import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toggle } from '../ui/Toggle';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import type { AppSettings } from '../../services/settingsService';

interface CameraSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

export function CameraSettingsSheet({
  visible,
  onClose,
  settings,
  onUpdateSetting,
}: CameraSettingsSheetProps) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingTop: spacing.sm,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.textMuted,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center',
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
    rowLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
    bottomPad: {
      height: spacing.xl,
    },
  }), [colors]);

  const handleAnnotationSettings = () => {
    console.log('Navigate to annotation settings');
  };

  const handleChangeResolution = () => {
    Alert.alert(
      'Change Resolution',
      'Select a resolution',
      [
        { text: 'High (4032x3024)', onPress: () => console.log('Resolution: High') },
        { text: 'Medium (3024x2268)', onPress: () => console.log('Resolution: Medium') },
        { text: 'Low (1920x1080)', onPress: () => console.log('Resolution: Low') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.sheet}>
        <View style={styles.dragHandle} />

        <Text style={styles.title}>Camera Settings</Text>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleAnnotationSettings} activeOpacity={0.7}>
          <Text style={styles.rowLabel}>Annotation Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleChangeResolution} activeOpacity={0.7}>
          <Text style={styles.rowLabel}>Change Resolution</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Toggle
          label="Prompt for File Details"
          value={settings.promptForDetails}
          onValueChange={(val) => onUpdateSetting('promptForDetails', val)}
        />

        <View style={styles.divider} />

        <Toggle
          label="Camera Grid"
          value={settings.cameraGrid}
          onValueChange={(val) => onUpdateSetting('cameraGrid', val)}
        />

        <View style={styles.divider} />

        <Toggle
          label="Camera Level"
          value={settings.cameraLevel}
          onValueChange={(val) => onUpdateSetting('cameraLevel', val)}
        />

        <View style={styles.bottomPad} />
      </View>
    </Modal>
  );
}
