import React, { useState, useCallback } from 'react';
import { FlatList } from 'react-native';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { UploadListItem } from '../../src/components/uploads/UploadListItem';
import { EmptyUploads } from '../../src/components/uploads/EmptyUploads';
import { useUploads } from '../../src/context/UploadContext';
import { uploadQueue } from '../../src/services/uploadQueue';
import type { UploadItem } from '../../src/types/upload';

export default function UploadsScreen() {
  const { items, refresh } = useUploads();
  const [refreshing, setRefreshing] = useState(false);

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
    <ScreenContainer>
      <SectionHeader title="Upload Queue" />
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyUploads />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={items.length === 0 ? { flex: 1 } : undefined}
      />
    </ScreenContainer>
  );
}
