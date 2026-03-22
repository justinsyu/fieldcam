import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import type { UploadItem } from '../../types/upload';

interface StatusConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: { icon: 'time-outline', color: colors.warning, label: 'Pending' },
  uploading: { icon: 'cloud-upload-outline', color: colors.info, label: 'Uploading' },
  completed: { icon: 'checkmark-circle', color: colors.success, label: 'Completed' },
  failed: { icon: 'alert-circle', color: colors.error, label: 'Failed' },
};

interface UploadListItemProps {
  item: UploadItem;
  onRetry?: (id: string) => void;
}

export function UploadListItem({ item, onRetry }: UploadListItemProps) {
  const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.localUri }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
        <View style={styles.statusRow}>
          <Ionicons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
        {item.status === 'failed' && item.error ? (
          <Text style={styles.errorText} numberOfLines={2}>{item.error}</Text>
        ) : null}
      </View>
      {item.status === 'failed' && onRetry ? (
        <TouchableOpacity style={styles.retryButton} onPress={() => onRetry(item.id)} activeOpacity={0.7}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileName: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    ...typography.caption,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginLeft: spacing.sm,
  },
  retryText: {
    ...typography.caption,
    color: colors.orange,
    fontWeight: '600',
  },
});
