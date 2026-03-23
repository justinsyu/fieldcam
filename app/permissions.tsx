import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { SectionHeader } from '../src/components/ui/SectionHeader';
import { useThemeColors } from '../src/context/ThemeContext';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

interface PermissionState {
  camera: boolean | null;
  fineLocation: boolean | null;
  coarseLocation: boolean | null;
  notifications: boolean | null;
}

export default function PermissionsScreen() {
  const [cameraPermission] = useCameraPermissions();
  const [permState, setPermState] = useState<PermissionState>({
    camera: null,
    fineLocation: null,
    coarseLocation: null,
    notifications: null,
  });
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
    buttonContainer: {
      marginHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
  }), [colors]);

  const checkPermissions = useCallback(async () => {
    const fgLocation = await Location.getForegroundPermissionsAsync();

    setPermState({
      camera: cameraPermission?.granted ?? false,
      fineLocation: fgLocation.granted,
      coarseLocation: fgLocation.granted,
      notifications: false,
    });
  }, [cameraPermission]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleReviewPermissions = useCallback(() => {
    Linking.openSettings();
  }, []);

  const rows: { label: string; granted: boolean | null }[] = [
    { label: 'Camera', granted: permState.camera },
    { label: 'Fine Location', granted: permState.fineLocation },
    { label: 'Coarse Location', granted: permState.coarseLocation },
    { label: 'Notifications', granted: permState.notifications },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <SectionHeader title="Permissions" />
        <Card style={styles.card}>
          {rows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.row,
                index < rows.length - 1 && styles.rowBorder,
              ]}
            >
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.granted === null ? (
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textMuted} />
              ) : row.granted ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              ) : (
                <Ionicons name="close-circle" size={20} color={colors.error} />
              )}
            </View>
          ))}
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            label="REVIEW PERMISSIONS"
            onPress={handleReviewPermissions}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
}
