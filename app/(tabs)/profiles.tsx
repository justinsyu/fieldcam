import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { profileService } from '../../src/services/profileService';
import { ProfileListItem } from '../../src/components/profiles/ProfileListItem';
import type { ProcessingProfile } from '../../src/types/profile';

export default function ProfilesScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProcessingProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    try {
      await profileService.seedDefaults();
      const data = await profileService.getAll();
      setProfiles(data);
    } catch (e) {
      console.error('Failed to load profiles', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await profileService.update(id, { isActive: active });
      setProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: active } : p))
      );
    } catch (e) {
      console.error('Failed to update profile', e);
    }
  };

  const handlePress = (id: string) => {
    router.push(`/profile-editor?id=${id}`);
  };

  const handleAdd = () => {
    router.push('/profile-editor');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Processing Profiles</Text>
        <TouchableOpacity onPress={handleAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add-circle" size={28} color={colors.orange} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : profiles.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No profiles yet. Tap + to add one.</Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProfileListItem
              profile={item}
              onPress={handlePress}
              onToggle={handleToggle}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
});
