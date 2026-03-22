import React, { useState, useCallback } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { UploadListItem } from '../../src/components/uploads/UploadListItem';
import { EmptyUploads } from '../../src/components/uploads/EmptyUploads';
import { useUploads } from '../../src/context/UploadContext';
import { uploadQueue } from '../../src/services/uploadQueue';
import type { UploadItem } from '../../src/types/upload';

export default function UploadsScreen() {
  const { items, refresh } = useUploads();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const handleRetry = useCallback(async (id: string) => {
    await uploadQueue.updateStatus(id, 'pending');
    await refresh();
  }, [refresh]);

  const renderItem = useCallback(({ item }: { item: UploadItem }) => (
    <UploadListItem item={item} onRetry={handleRetry} />
  ), [handleRetry]);

  const keyExtractor = useCallback((item: UploadItem) => item.id, []);

  return (
    <View style={styles.container}>
      <SectionHeader title="Upload Queue" />
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyUploads />}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.historyButtonContainer}>
              <Button
                label="View Previous Uploads"
                onPress={() => router.push('/upload-history')}
                variant="secondary"
              />
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : undefined}
      />
      {items.length === 0 && (
        <View style={styles.historyButtonContainer}>
          <Button
            label="View Previous Uploads"
            onPress={() => router.push('/upload-history')}
            variant="secondary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  historyButtonContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
});
