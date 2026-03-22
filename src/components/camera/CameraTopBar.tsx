import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface CameraTopBarProps {
  folderName: string;
  onSettingsPress: () => void;
  flash: 'off' | 'on';
  onFlashToggle: () => void;
  onFolderPress?: () => void;
}

export function CameraTopBar({ folderName, onSettingsPress, flash, onFlashToggle, onFolderPress }: CameraTopBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.folderRow} onPress={onFolderPress} activeOpacity={onFolderPress ? 0.7 : 1}>
        <Ionicons name="folder" size={18} color={colors.white} style={styles.folderIcon} />
        <Text style={styles.folderText} numberOfLines={1}>{folderName}</Text>
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onFlashToggle} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={flash === 'on' ? 'flash' : 'flash-off'}
            size={24}
            color={flash === 'on' ? colors.orange : colors.white}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettingsPress} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.lg,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  folderIcon: {
    marginRight: spacing.xs,
  },
  folderText: {
    ...typography.label,
    color: colors.white,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: spacing.md,
  },
});
