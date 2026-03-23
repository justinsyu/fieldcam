import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, SectionHeader, Card, Button } from '../src/components/ui';
import { FolderListItem } from '../src/components/folders/FolderListItem';
import { folderService, type FolderInfo } from '../src/services/folderService';
import { getProvider } from '../src/services/cloudStorage/registry';
import { getValidAccessToken } from '../src/services/oauth/tokenRefresh';
import { useAuth } from '../src/context/AuthContext';
import type { CloudProvider } from '../src/types/auth';
import { useThemeColors } from '../src/context/ThemeContext';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

interface BrowserState {
  folderId: string;
  folderName: string;
  folders: FolderInfo[];
  loading: boolean;
  stack: Array<{ id: string; name: string }>;
}

export default function FolderPickerScreen() {
  const { linkedAccounts } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(
    (linkedAccounts[0]?.provider as CloudProvider) ?? 'google'
  );
  const colors = useThemeColors();

  const rootId = selectedProvider === 'dropbox' ? '' : 'root';
  const rootName = selectedProvider === 'google' ? 'My Drive'
    : selectedProvider === 'microsoft' ? 'OneDrive' : 'Dropbox';

  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [favorites, setFavorites] = useState<FolderInfo[]>([]);
  const [recents, setRecents] = useState<FolderInfo[]>([]);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browser, setBrowser] = useState<BrowserState>({
    folderId: rootId,
    folderName: rootName,
    folders: [],
    loading: false,
    stack: [],
  });

  const styles = useMemo(() => StyleSheet.create({
    card: {
      marginHorizontal: spacing.md,
      padding: spacing.md,
    },
    listCard: {
      marginHorizontal: spacing.md,
      padding: 0,
      overflow: 'hidden',
    },
    currentFolderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    folderIcon: {
      marginRight: spacing.sm,
    },
    currentFolderInfo: {
      flex: 1,
    },
    currentFolderName: {
      ...typography.body,
      color: colors.textPrimary,
    },
    currentFolderProvider: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'capitalize',
    },
    useText: {
      ...typography.label,
      color: colors.orange,
    },
    notSetText: {
      ...typography.body,
      color: colors.textMuted,
    },
    chooseFolderContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    providerSelector: {
      flexDirection: 'row',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    providerPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    providerPillSelected: {
      backgroundColor: colors.orange,
      borderColor: colors.orange,
    },
    providerPillText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    providerPillTextSelected: {
      color: colors.white,
    },
    browserSection: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    browserHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    backText: {
      ...typography.label,
      color: colors.orange,
    },
    browserTitle: {
      ...typography.label,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    browserHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerIconButton: {
      marginLeft: spacing.sm,
    },
    newFolderIconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    newFolderPlus: {
      ...typography.label,
      color: colors.textSecondary,
      marginLeft: 2,
      fontSize: 14,
    },
    sortRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      alignItems: 'flex-end',
    },
    sortLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontSize: 11,
    },
    loader: {
      padding: spacing.xl,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      padding: spacing.lg,
    },
    emptyStateText: {
      ...typography.body,
      color: colors.textMuted,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: spacing.lg,
    },
    takePhotosContainer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    takePhotosFab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.orange,
      borderRadius: 28,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    fabIcon: {
      marginRight: spacing.sm,
    },
    fabLabel: {
      ...typography.label,
      color: colors.white,
      fontSize: 15,
    },
  }), [colors]);

  const loadData = useCallback(async () => {
    const [curr, favs, recs] = await Promise.all([
      folderService.getCurrentFolder(),
      folderService.getFavorites(),
      folderService.getRecents(),
    ]);
    setCurrentFolder(curr);
    setFavorites(favs);
    setRecents(recs);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadFolders = useCallback(async (parentId: string) => {
    setBrowser((prev) => ({ ...prev, loading: true, folders: [] }));
    try {
      const token = await getValidAccessToken(selectedProvider);
      if (!token) {
        Alert.alert('Not signed in', 'Please connect a cloud storage account to browse folders.');
        setBrowserVisible(false);
        return;
      }
      const provider = getProvider(selectedProvider);
      const cloudFolders = await provider.listFolders(parentId, token);
      const folderInfos: FolderInfo[] = cloudFolders.map((f) => ({
        id: f.id,
        name: f.name,
        provider: selectedProvider,
      }));
      folderInfos.sort((a, b) => a.name.localeCompare(b.name));
      setBrowser((prev) => ({ ...prev, folders: folderInfos, loading: false }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
      setBrowser((prev) => ({ ...prev, loading: false }));
    }
  }, [selectedProvider]);

  const openBrowser = useCallback(() => {
    setBrowserVisible(true);
    setBrowser({ folderId: rootId, folderName: rootName, folders: [], loading: false, stack: [] });
    loadFolders(rootId);
  }, [loadFolders, rootId, rootName]);

  const drillInto = useCallback(
    (folder: FolderInfo) => {
      setBrowser((prev) => ({
        ...prev,
        stack: [...prev.stack, { id: prev.folderId, name: prev.folderName }],
        folderId: folder.id,
        folderName: folder.name,
      }));
      loadFolders(folder.id);
    },
    [loadFolders]
  );

  const goBack = useCallback(() => {
    setBrowser((prev) => {
      if (prev.stack.length === 0) {
        setBrowserVisible(false);
        return prev;
      }
      const newStack = [...prev.stack];
      const parent = newStack.pop()!;
      loadFolders(parent.id);
      return { ...prev, stack: newStack, folderId: parent.id, folderName: parent.name };
    });
  }, [loadFolders]);

  const selectFolder = useCallback(
    async (folder: FolderInfo) => {
      await folderService.setCurrentFolder(folder);
      setCurrentFolder(folder);
      await loadData();
    },
    [loadData]
  );

  const takePhotosHere = useCallback(async () => {
    const selected: FolderInfo = {
      id: browser.folderId,
      name: browser.folderName,
      provider: selectedProvider,
    };
    await folderService.setCurrentFolder(selected);
    router.back();
  }, [browser.folderId, browser.folderName, selectedProvider]);

  const selectAndGoBack = useCallback(async (folder: FolderInfo) => {
    await folderService.setCurrentFolder(folder);
    router.back();
  }, []);

  const toggleFavoriteForBrowser = useCallback(async () => {
    const folder: FolderInfo = {
      id: browser.folderId,
      name: browser.folderName,
      provider: selectedProvider,
    };
    const isFav = favorites.some((f) => f.id === folder.id && f.provider === folder.provider);
    if (isFav) {
      await folderService.removeFavorite(folder);
    } else {
      await folderService.addFavorite(folder);
    }
    await loadData();
  }, [browser.folderId, browser.folderName, selectedProvider, favorites, loadData]);

  const isBrowserFolderFavorited = favorites.some(
    (f) => f.id === browser.folderId && f.provider === selectedProvider
  );

  const createSubfolder = useCallback(async () => {
    let token: string;
    try {
      token = await getValidAccessToken(selectedProvider);
    } catch {
      Alert.alert('Not signed in', 'Please connect a cloud storage account first.');
      return;
    }
    Alert.prompt(
      'New Folder',
      'Enter a name for the new folder:',
      async (name) => {
        if (!name || !name.trim()) return;
        try {
          const provider = getProvider(selectedProvider);
          await provider.createFolder(name.trim(), browser.folderId, token);
          loadFolders(browser.folderId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          Alert.alert('Error creating folder', msg);
        }
      },
      'plain-text'
    );
  }, [browser.folderId, loadFolders, selectedProvider]);

  const removeFromRecents = useCallback(
    async (folder: FolderInfo) => {
      await folderService.removeFromRecents(folder);
      await loadData();
    },
    [loadData]
  );

  const renderBrowser = () => (
    <View style={styles.browserSection}>
      <View style={styles.browserHeader}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.orange} />
          <Text style={styles.backText}>
            {browser.stack.length > 0
              ? browser.stack[browser.stack.length - 1].name
              : 'Close'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.browserTitle} numberOfLines={1}>
          {browser.folderName}
        </Text>

        <View style={styles.browserHeaderActions}>
          {browser.folderId !== rootId && (
            <TouchableOpacity
              onPress={toggleFavoriteForBrowser}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.headerIconButton}
            >
              <Ionicons
                name={isBrowserFolderFavorited ? 'star' : 'star-outline'}
                size={20}
                color={isBrowserFolderFavorited ? '#F59E0B' : colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={createSubfolder}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.headerIconButton}
          >
            <View style={styles.newFolderIconWrapper}>
              <Ionicons name="folder-open-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.newFolderPlus}>+</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>A-Z</Text>
      </View>

      {browser.loading ? (
        <ActivityIndicator color={colors.orange} style={styles.loader} />
      ) : (
        <FlatList
          data={browser.folders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FolderListItem
              name={item.name}
              isSelected={currentFolder?.id === item.id}
              onPress={() => selectFolder(item)}
              onLongPress={() => drillInto(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No folders found</Text>
          }
          scrollEnabled={false}
        />
      )}

      <View style={styles.takePhotosContainer}>
        <TouchableOpacity style={styles.takePhotosFab} onPress={takePhotosHere} activeOpacity={0.8}>
          <Ionicons name="camera" size={20} color={colors.white} style={styles.fabIcon} />
          <Text style={styles.fabLabel}>Take Photos Here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Current Upload Folder" />
      <Card style={styles.card}>
        {currentFolder ? (
          <View style={styles.currentFolderRow}>
            <Ionicons name="folder" size={22} color={colors.orange} style={styles.folderIcon} />
            <View style={styles.currentFolderInfo}>
              <Text style={styles.currentFolderName}>{currentFolder.name}</Text>
              <Text style={styles.currentFolderProvider}>{currentFolder.provider}</Text>
            </View>
            <TouchableOpacity onPress={() => selectAndGoBack(currentFolder)}>
              <Text style={styles.useText}>Use</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.notSetText}>Not set</Text>
        )}
      </Card>

      {!browserVisible && (
        <View style={styles.chooseFolderContainer}>
          <Button label="Choose a Folder" onPress={openBrowser} />
        </View>
      )}

      {linkedAccounts.length > 0 && (
        <View style={styles.providerSelector}>
          {linkedAccounts.map((account) => {
            const label = account.provider === 'google' ? 'Google Drive'
              : account.provider === 'microsoft' ? 'OneDrive' : 'Dropbox';
            const isSelected = account.provider === selectedProvider;
            return (
              <TouchableOpacity
                key={account.provider}
                style={[styles.providerPill, isSelected && styles.providerPillSelected]}
                onPress={() => {
                  setSelectedProvider(account.provider);
                  setBrowserVisible(false);
                }}
              >
                <Text style={[styles.providerPillText, isSelected && styles.providerPillTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {browserVisible && renderBrowser()}

      <SectionHeader title="Favorites" />
      <Card style={styles.listCard}>
        {favorites.length > 0 ? (
          <FlatList
            data={favorites}
            keyExtractor={(item) => `fav-${item.id}`}
            renderItem={({ item }) => (
              <FolderListItem
                name={item.name}
                isSelected={currentFolder?.id === item.id}
                onPress={() => selectAndGoBack(item)}
              />
            )}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyStateText}>Folders marked as favorites will appear here</Text>
        )}
      </Card>

      <SectionHeader title="Recent" />
      <Card style={styles.listCard}>
        {recents.length > 0 ? (
          <FlatList
            data={recents}
            keyExtractor={(item) => `rec-${item.id}`}
            renderItem={({ item }) => (
              <FolderListItem
                name={item.name}
                isSelected={currentFolder?.id === item.id}
                onPress={() => selectAndGoBack(item)}
                onLongPress={() => {
                  Alert.alert(item.name, undefined, [
                    {
                      text: 'Remove from recents',
                      style: 'destructive',
                      onPress: () => removeFromRecents(item),
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              />
            )}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyStateText}>Recently used folders will appear here</Text>
        )}
      </Card>
    </ScreenContainer>
  );
}
