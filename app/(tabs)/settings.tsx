import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader, Toggle, Card } from '../../src/components/ui';
import { useSettings } from '../../src/hooks/useSettings';
import { useAuth } from '../../src/context/AuthContext';
import { uploadQueue } from '../../src/services/uploadQueue';
import { secureStorage } from '../../src/services/secureStorage';
import type { CloudProvider, LinkedCloudAccount } from '../../src/types/auth';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { user, signOut, deleteAccount, linkedAccounts, refreshLinkedAccounts } = useAuth();
  const router = useRouter();

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Upload History',
      'This will remove all completed uploads from the history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await uploadQueue.clearHistory();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your FieldCam account. Your cloud storage files will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount },
      ]
    );
  };

  const handleConnectGoogle = async () => {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const googleUser = await GoogleSignin.getCurrentUser();
      const account: LinkedCloudAccount = {
        provider: 'google',
        email: googleUser?.data?.user.email ?? '',
        accessToken: tokens.accessToken,
        refreshToken: null,
        expiresAt: Date.now() + 3600 * 1000,
        linkedAt: new Date().toISOString(),
      };
      await secureStorage.saveCloudAccount(account);
      await refreshLinkedAccounts();
    } catch (error: any) {
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Failed to connect', error.message ?? String(error));
      }
    }
  };

  const handleConnectMicrosoft = () => Alert.alert('Coming soon', 'Microsoft OneDrive linking requires app registration.');
  const handleConnectDropbox = () => Alert.alert('Coming soon', 'Dropbox linking requires app registration.');

  const handleDisconnect = async (provider: CloudProvider) => {
    Alert.alert(
      'Disconnect',
      `Disconnect ${provider === 'google' ? 'Google Drive' : provider === 'microsoft' ? 'OneDrive' : 'Dropbox'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await secureStorage.deleteCloudAccount(provider);
            await refreshLinkedAccounts();
          },
        },
      ]
    );
  };

  if (!settings) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Account" />
        <Card style={styles.card}>
          <Text style={styles.emailText}>{user?.email ?? 'Not signed in'}</Text>
          <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Card>

        <SectionHeader title="Cloud Storage" />
        <Card style={styles.card}>
          {(['google', 'microsoft', 'dropbox'] as CloudProvider[]).map((provider, index) => {
            const linked = linkedAccounts.find((a) => a.provider === provider);
            const icon = provider === 'google' ? 'logo-google' : provider === 'microsoft' ? 'logo-windows' : 'cloud-outline';
            const label = provider === 'google' ? 'Google Drive' : provider === 'microsoft' ? 'OneDrive' : 'Dropbox';
            return (
              <View key={provider} style={[styles.cloudRow, index < 2 && styles.cloudRowBorder]}>
                <View style={styles.cloudRowLeft}>
                  <Ionicons name={icon} size={20} color={colors.textPrimary} />
                  <View style={styles.cloudRowInfo}>
                    <Text style={styles.cloudLabel}>{label}</Text>
                    {linked && <Text style={styles.cloudEmail}>{linked.email}</Text>}
                  </View>
                </View>
                {linked ? (
                  <TouchableOpacity onPress={() => handleDisconnect(provider)}>
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={
                    provider === 'google' ? handleConnectGoogle
                    : provider === 'microsoft' ? handleConnectMicrosoft
                    : handleConnectDropbox
                  }>
                    <Text style={styles.connectText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </Card>

        <SectionHeader title="Upload" />
        <Card style={styles.card}>
          <Toggle
            label="Upload Immediately"
            value={settings.uploadImmediately}
            onValueChange={(v) => updateSetting('uploadImmediately', v)}
            description="Upload photos as soon as they are taken"
          />
          <Toggle
            label="Upload in Background"
            value={settings.uploadInBackground}
            onValueChange={(v) => updateSetting('uploadInBackground', v)}
            description="Continue uploading when app is in background"
          />
          <Toggle
            label="Upload on Cellular"
            value={settings.uploadCellular}
            onValueChange={(v) => updateSetting('uploadCellular', v)}
            description="Use mobile data for uploads"
          />
          <Toggle
            label="Save to Device"
            value={settings.saveToDevice}
            onValueChange={(v) => updateSetting('saveToDevice', v)}
            description="Save photos to your camera roll"
          />
          <Toggle
            label="Save Original"
            value={settings.saveOriginal}
            onValueChange={(v) => updateSetting('saveOriginal', v)}
            description="Keep original uncompressed photo"
          />
        </Card>

        <SectionHeader title="Camera" />
        <Card style={styles.card}>
          <Toggle
            label="Show Grid"
            value={settings.cameraGrid}
            onValueChange={(v) => updateSetting('cameraGrid', v)}
            description="Display composition grid overlay"
          />
          <Toggle
            label="Level Indicator"
            value={settings.cameraLevel}
            onValueChange={(v) => updateSetting('cameraLevel', v)}
            description="Show horizon level indicator"
          />
          <Toggle
            label="Prompt for Details"
            value={settings.promptForDetails}
            onValueChange={(v) => updateSetting('promptForDetails', v)}
            description="Ask for notes after each photo"
          />
        </Card>

        <SectionHeader title="Annotations" />
        <Card style={styles.card}>
          <Toggle
            label="Include Location"
            value={settings.annotationLocation}
            onValueChange={(v) => updateSetting('annotationLocation', v)}
            description="Attach GPS coordinates to photos"
          />
          <Toggle
            label="Include Timestamp"
            value={settings.annotationTimestamp}
            onValueChange={(v) => updateSetting('annotationTimestamp', v)}
            description="Attach date and time to photos"
          />
        </Card>

        <SectionHeader title="AI Processing" />
        <Card style={styles.card}>
          <Toggle
            label="Auto Process"
            value={settings.autoProcess}
            onValueChange={(v) => updateSetting('autoProcess', v)}
            description="Automatically process photos with default profile"
          />
        </Card>

        <SectionHeader title="Maintenance" />
        <Card style={styles.card}>
          <TouchableOpacity
            onPress={() => router.push('/permissions')}
            style={[styles.maintenanceRow, styles.maintenanceRowBorder]}
          >
            <Text style={styles.maintenanceText}>App Permissions</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearHistory} style={[styles.maintenanceRow, styles.maintenanceRowBorder]}>
            <Text style={styles.maintenanceText}>Clear Upload History</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.maintenanceRow}>
            <Text style={[styles.maintenanceText, styles.deleteText]}>Delete Account</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>FieldCam 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    marginHorizontal: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  emailText: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  signOutButton: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  signOutText: {
    ...typography.body,
    color: colors.error,
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cloudRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cloudRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cloudRowInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  cloudLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  cloudEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  connectText: {
    ...typography.body,
    color: colors.orange,
  },
  disconnectText: {
    ...typography.body,
    color: colors.error,
  },
  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  maintenanceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  maintenanceText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  deleteText: {
    color: colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
