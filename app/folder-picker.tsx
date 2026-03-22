import React, { useState, useEffect, useCallback } from 'react';
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
import { googleDrive } from '../src/services/cloudStorage/googleDrive';
import { secureStorage } from '../src/services/secureStorage';
import { colors } from '../src/theme/colors';
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
  const [currentFolder, setCurrentFolder] = useState<FolderInfo | null>(null);
  const [favorites, setFavorites] = useState<FolderInfo[]>([]);
  const [recents, setRecents] = useState<FolderInfo[]>([]);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browser, setBrowser] = useState<BrowserState>({
    folderId: 'root',
    folderName: 'My Drive',
    folders: [],
    loading: false,
    stack: [],
  });

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
      const token = await secureStorage.getToken('google');
      if (!token) {
        Alert.alert('Not signed in', 'Please sign in with Google to browse folders.');
        setBrowserVisible(false);
        return;
      }
      const cloudFolders = await googleDrive.listFolders(parentId, token);
      const folderInfos: FolderInfo[] = cloudFolders.map((f) => ({
        id: f.id,
        name: f.name,
        provider: 'google',
      }));
      setBrowser((prev) => ({ ...prev, folders: folderInfos, loading: false }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
      setBrowser((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const openBrowser = useCallback(() => {
    setBrowserVisible(true);
    setBrowser({ folderId: 'root', folderName: 'My Drive', folders: [], loading: false, stack: [] });
    loadFolders('root');
  }, [loadFolders]);

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
      provider: 'google',
    };
    await folderService.setCurrentFolder(selected);
    router.back();
  }, [browser.folderId, browser.folderName]);

  const selectAndGoBack = useCallback(
    async (folder: FolderInfo) => {
      await folderService.setCurrentFolder(folder);
      router.back();
    },
    []
  );

  const renderBrowser = () => (
    <View style={styles.browserSection}>
      <View style={styles.browserHeader}>
        <TouchableOpacity onPress={goBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
        <Button label="Take Photos Here" onPress={takePhotosHere} />
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

      {browserVisible && renderBrowser()}

      {favorites.length > 0 && (
        <>
          <SectionHeader title="Favorites" />
          <Card style={styles.listCard}>
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
          </Card>
        </>
      )}

      {recents.length > 0 && (
        <>
          <SectionHeader title="Recent" />
          <Card style={styles.listCard}>
            <FlatList
              data={recents}
              keyExtractor={(item) => `rec-${item.id}`}
              renderItem={({ item }) => (
                <FolderListItem
                  name={item.name}
                  isSelected={currentFolder?.id === item.id}
                  onPress={() => selectAndGoBack(item)}
                />
              )}
              scrollEnabled={false}
            />
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    textAlign: 'right',
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
  takePhotosContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
