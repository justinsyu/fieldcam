import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeGroup } from '../../theme/themes';

// ---------------------------------------------------------------------------
// Swatch keys rendered for each theme preview
// ---------------------------------------------------------------------------

const SWATCH_KEYS: (keyof ThemeGroup['light'])[] = [
  'bgPrimary',
  'accent',
  'textPrimary',
  'bgCard',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ThemePicker() {
  const {
    colors, themeId, colorMode,
    setThemeId, setColorMode, deleteCustomTheme,
    allThemeGroups,
  } = useTheme();
  const router = useRouter();

  const handleDelete = (group: ThemeGroup) => {
    Alert.alert(
      'Delete Theme',
      `Delete "${group.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCustomTheme(group.id) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Theme selection */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Theme</Text>
      {allThemeGroups.map((group) => {
        const isActive = group.id === themeId;
        const previewColors = group[colorMode];

        return (
          <TouchableOpacity
            key={group.id}
            activeOpacity={0.7}
            onPress={() => setThemeId(group.id)}
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: isActive ? colors.accent : colors.border,
                borderWidth: isActive ? 2 : 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={[styles.themeName, { color: colors.textPrimary }]}>
                  {group.name}
                </Text>
                <View style={styles.titleActions}>
                  {group.isCustom && (
                    <>
                      <TouchableOpacity
                        hitSlop={8}
                        onPress={() => router.push(`/theme-editor?editId=${group.id}`)}
                      >
                        <Ionicons name="pencil" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity hitSlop={8} onPress={() => handleDelete(group)}>
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </>
                  )}
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
                  )}
                </View>
              </View>
              <Text style={[styles.themeDesc, { color: colors.textMuted }]}>
                {group.description}
              </Text>
            </View>

            <View style={styles.swatchRow}>
              {SWATCH_KEYS.map((key) => (
                <View
                  key={key}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: previewColors[key],
                      borderColor: colors.borderLight,
                    },
                  ]}
                />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Create custom theme */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/theme-editor')}
        style={[
          styles.createButton,
          { borderColor: colors.border, backgroundColor: colors.bgCard },
        ]}
      >
        <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
        <Text style={[styles.createLabel, { color: colors.accent }]}>Create Custom Theme</Text>
      </TouchableOpacity>

      {/* Light / Dark mode toggle */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 8 }]}>
        Appearance
      </Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setColorMode('light')}
          style={[
            styles.modeButton,
            {
              backgroundColor: colorMode === 'light' ? colors.accent : colors.bgCard,
              borderColor: colorMode === 'light' ? colors.accent : colors.border,
            },
          ]}
        >
          <Ionicons
            name="sunny"
            size={20}
            color={colorMode === 'light' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeLabel,
              { color: colorMode === 'light' ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            Light
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setColorMode('dark')}
          style={[
            styles.modeButton,
            {
              backgroundColor: colorMode === 'dark' ? colors.accent : colors.bgCard,
              borderColor: colorMode === 'dark' ? colors.accent : colors.border,
            },
          ]}
        >
          <Ionicons
            name="moon"
            size={20}
            color={colorMode === 'dark' ? '#FFFFFF' : colors.textSecondary}
          />
          <Text
            style={[
              styles.modeLabel,
              { color: colorMode === 'dark' ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            Dark
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeDesc: {
    fontSize: 13,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  createLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
