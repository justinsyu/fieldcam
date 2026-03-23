import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { Button } from '../../src/components/ui/Button';
import { useThemeColors } from '../../src/context/ThemeContext';
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
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    historyButtonContainer: {
      marginHorizontal: spacing.md,
      marginVertical: spacing.md,
    },
  }), [colors]);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.screenTitle}>Uploads</Text>
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
    </SafeAreaView>
  );
}
