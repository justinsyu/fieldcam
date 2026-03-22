import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface FolderListItemProps {
  name: string;
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

export function FolderListItem({ name, onPress, onLongPress, isSelected }: FolderListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="folder"
        size={22}
        color={isSelected ? colors.orange : colors.textSecondary}
        style={styles.folderIcon}
      />
      <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
        {name}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  folderIcon: {
    marginRight: spacing.sm,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  nameSelected: {
    color: colors.orange,
  },
});
