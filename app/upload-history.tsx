import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { uploadQueue } from '../src/services/uploadQueue';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import type { UploadItem } from '../src/types/upload';
import type { CloudProvider } from '../src/types/auth';

const PROVIDER_ICONS: Record<CloudProvider, keyof typeof Ionicons.glyphMap> = {
  google: 'logo-google',
  microsoft: 'cloud-outline',
  dropbox: 'cloud-outline',
};

function HistoryListItem({ item }: { item: UploadItem }) {
  const providerIcon = PROVIDER_ICONS[item.provider] ?? 'cloud-outline';
  const uploadDate = item.uploadedAt
    ? new Date(item.uploadedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : item.createdAt
    ? new Date(item.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <View style={styles.item}>
      <Image source={{ uri: item.localUri }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.fileName}
        </Text>
        <Text style={styles.date}>{uploadDate}</Text>
      </View>
      <Ionicons name={providerIcon} size={20} color={colors.textSecondary} />
    </View>
  );
}

function EmptyHistory() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No items found</Text>
    </View>
  );
}

export default function UploadHistoryScreen() {
  const [items, setItems] = useState<UploadItem[]>([]);

  const loadHistory = useCallback(async () => {
    const all = await uploadQueue.getAll();
    setItems(all.filter((i) => i.status === 'completed'));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const keyExtractor = useCallback((item: UploadItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: UploadItem }) => <HistoryListItem item={item} />,
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyHistory />}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  item: {
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
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
