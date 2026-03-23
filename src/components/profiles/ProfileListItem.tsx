import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Switch } from 'react-native';
import type { ProcessingProfile } from '../../types/profile';

interface ProfileListItemProps {
  profile: ProcessingProfile;
  onPress: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

export function ProfileListItem({ profile, onPress, onToggle }: ProfileListItemProps) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    info: {
      flex: 1,
      marginRight: spacing.md,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    name: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '600',
      marginRight: spacing.xs,
    },
    teamBadge: {
      backgroundColor: colors.info,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      marginRight: spacing.xs,
    },
    teamBadgeText: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '700',
      fontSize: 10,
    },
    lockIcon: {
      marginLeft: 2,
    },
    description: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
  }), [colors]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(profile.id)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            {profile.isTeam && (
              <View style={styles.teamBadge}>
                <Text style={styles.teamBadgeText}>TEAM</Text>
              </View>
            )}
            {profile.isLocked && (
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textMuted}
                style={styles.lockIcon}
              />
            )}
          </View>
          {profile.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {profile.description}
            </Text>
          ) : null}
        </View>
        <Switch
          value={profile.isActive}
          onValueChange={(value) => onToggle(profile.id, value)}
          trackColor={{ false: colors.border, true: colors.orange }}
          thumbColor={colors.white}
        />
      </View>
    </TouchableOpacity>
  );
}
