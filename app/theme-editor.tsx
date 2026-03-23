import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { buildCustomThemeGroup } from '../src/theme/themes';
import { isValidHex } from '../src/theme/colorUtils';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

// ---------------------------------------------------------------------------
// Preset colours
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c', '#DA532C', '#10a37f',
];

// ---------------------------------------------------------------------------
// Reusable colour picker sub-component
// ---------------------------------------------------------------------------

function ColorPickerSection({
  label,
  value,
  hexInput,
  onSelectPreset,
  onHexChange,
  editorColors,
  optional,
  onClear,
}: {
  label: string;
  value: string | undefined;
  hexInput: string;
  onSelectPreset: (color: string) => void;
  onHexChange: (text: string) => void;
  editorColors: ReturnType<typeof useTheme>['colors'];
  optional?: boolean;
  onClear?: () => void;
}) {
  return (
    <View>
      <View style={sectionStyles.labelRow}>
        <Text style={[sectionStyles.label, { color: editorColors.textSecondary }]}>{label}</Text>
        {optional && value && onClear && (
          <TouchableOpacity onPress={onClear} hitSlop={8}>
            <Text style={[sectionStyles.clearText, { color: editorColors.textMuted }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={sectionStyles.presetsGrid}>
        {COLOR_PRESETS.map((color) => {
          const isSelected = value?.toLowerCase() === color.toLowerCase();
          return (
            <TouchableOpacity
              key={color}
              activeOpacity={0.7}
              onPress={() => onSelectPreset(color)}
              style={[
                sectionStyles.presetCircle,
                {
                  backgroundColor: color,
                  borderWidth: isSelected ? 3 : 0,
                  borderColor: editorColors.textPrimary,
                },
              ]}
            >
              {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={sectionStyles.hexRow}>
        <TextInput
          style={[
            sectionStyles.hexInput,
            {
              color: editorColors.textPrimary,
              backgroundColor: editorColors.bgCard,
              borderColor: editorColors.border,
            },
          ]}
          value={hexInput}
          onChangeText={onHexChange}
          placeholder={optional ? 'None (neutral)' : '#3b82f6'}
          placeholderTextColor={editorColors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
        />
        <View
          style={[
            sectionStyles.hexPreview,
            {
              backgroundColor: value ?? editorColors.bgElevated,
              borderColor: editorColors.borderLight,
            },
          ]}
        />
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearText: {
    ...typography.bodySmall,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  hexInput: {
    ...typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: 'monospace',
  },
  hexPreview: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ThemeEditorScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colors, colorMode, saveCustomTheme, setThemeId, getCustomThemeData } = useTheme();

  // If editing, seed from existing data.
  const existing = editId ? getCustomThemeData(editId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');

  // Primary (accent)
  const [accent, setAccent] = useState(existing?.accent ?? '#3b82f6');
  const [accentHex, setAccentHex] = useState(existing?.accent ?? '#3b82f6');

  // Secondary (background tint) — optional
  const [secondary, setSecondary] = useState<string | undefined>(existing?.secondary);
  const [secondaryHex, setSecondaryHex] = useState(existing?.secondary ?? '');

  // Build a preview theme group from current choices.
  const previewGroup = useMemo(
    () =>
      buildCustomThemeGroup({
        id: '__preview',
        name: name || 'Preview',
        accent,
        secondary,
      }),
    [name, accent, secondary],
  );
  const previewColors = previewGroup[colorMode];

  // Primary handlers
  const handleSelectAccent = useCallback((color: string) => {
    setAccent(color);
    setAccentHex(color);
  }, []);

  const handleAccentHexChange = useCallback((text: string) => {
    setAccentHex(text);
    if (isValidHex(text)) setAccent(text);
  }, []);

  // Secondary handlers
  const handleSelectSecondary = useCallback((color: string) => {
    setSecondary(color);
    setSecondaryHex(color);
  }, []);

  const handleSecondaryHexChange = useCallback((text: string) => {
    setSecondaryHex(text);
    if (isValidHex(text)) {
      setSecondary(text);
    } else if (text === '') {
      setSecondary(undefined);
    }
  }, []);

  const handleClearSecondary = useCallback(() => {
    setSecondary(undefined);
    setSecondaryHex('');
  }, []);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a name for your theme.');
      return;
    }
    if (!isValidHex(accent)) {
      Alert.alert('Invalid color', 'Please select or enter a valid primary color.');
      return;
    }
    if (secondary && !isValidHex(secondary)) {
      Alert.alert('Invalid color', 'Please select a valid secondary color or clear it.');
      return;
    }

    const id = existing?.id ?? `custom_${Date.now()}`;
    saveCustomTheme({ id, name: trimmed, accent, secondary });
    setThemeId(id);
    router.back();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.bgPrimary },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        headerTitle: { ...typography.h2, color: colors.textPrimary },
        headerBtn: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
        headerBtnText: { ...typography.body, fontWeight: '600' as const },
        scroll: { flex: 1 },
        scrollContent: { padding: spacing.md, gap: 24, paddingBottom: 48 },
        input: {
          ...typography.body,
          color: colors.textPrimary,
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
        },
        nameLabel: {
          ...typography.label,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: spacing.xs,
        },
        // Preview
        previewLabel: {
          ...typography.label,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: spacing.sm,
        },
        previewCard: {
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        },
        previewNav: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: 10,
        },
        previewNavTitle: { ...typography.h3 },
        previewSection: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          gap: 10,
        },
        previewRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 6,
        },
        previewRowLabel: { ...typography.body },
        previewChip: {
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 6,
        },
        previewChipText: { ...typography.caption, fontWeight: '600' as const },
        previewDivider: {
          height: 1,
          marginVertical: 2,
        },
        previewFooter: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderTopWidth: 1,
        },
        previewCaption: { ...typography.caption },
      }),
    [colors],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Text style={[styles.headerBtnText, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Theme' : 'New Theme'}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleSave}>
          <Text style={[styles.headerBtnText, { color: colors.accent }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <View>
          <Text style={styles.nameLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="My Theme"
            placeholderTextColor={colors.textMuted}
            maxLength={24}
          />
        </View>

        {/* Primary colour */}
        <ColorPickerSection
          label="Primary Color"
          value={accent}
          hexInput={accentHex}
          onSelectPreset={handleSelectAccent}
          onHexChange={handleAccentHexChange}
          editorColors={colors}
        />

        {/* Secondary colour (optional) */}
        <ColorPickerSection
          label="Secondary Color (optional)"
          value={secondary}
          hexInput={secondaryHex}
          onSelectPreset={handleSelectSecondary}
          onHexChange={handleSecondaryHexChange}
          editorColors={colors}
          optional
          onClear={handleClearSecondary}
        />

        {/* Live preview */}
        <View>
          <Text style={styles.previewLabel}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: previewColors.bgPrimary }]}>
            {/* Fake nav bar */}
            <View style={[styles.previewNav, { backgroundColor: previewColors.bgElevated }]}>
              <Ionicons name="arrow-back" size={20} color={previewColors.accent} />
              <Text style={[styles.previewNavTitle, { color: previewColors.textPrimary }]}>
                {name || 'My Theme'}
              </Text>
              <Ionicons name="ellipsis-horizontal" size={20} color={previewColors.textMuted} />
            </View>

            {/* Fake content rows */}
            <View style={[styles.previewSection, { backgroundColor: previewColors.bgPrimary }]}>
              <View style={styles.previewRow}>
                <Text style={[styles.previewRowLabel, { color: previewColors.textPrimary }]}>
                  Accent button
                </Text>
                <View style={[styles.previewChip, { backgroundColor: previewColors.accent }]}>
                  <Text style={[styles.previewChipText, { color: '#FFFFFF' }]}>Action</Text>
                </View>
              </View>

              <View style={[styles.previewDivider, { backgroundColor: previewColors.border }]} />

              <View style={styles.previewRow}>
                <Text style={[styles.previewRowLabel, { color: previewColors.textPrimary }]}>
                  Card surface
                </Text>
                <View
                  style={[
                    styles.previewChip,
                    {
                      backgroundColor: previewColors.bgCard,
                      borderWidth: 1,
                      borderColor: previewColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.previewChipText, { color: previewColors.textPrimary }]}>
                    Card
                  </Text>
                </View>
              </View>

              <View style={[styles.previewDivider, { backgroundColor: previewColors.border }]} />

              <View style={styles.previewRow}>
                <Text style={[styles.previewRowLabel, { color: previewColors.textSecondary }]}>
                  Secondary text
                </Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View
                    style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: previewColors.success }}
                  />
                  <View
                    style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: previewColors.warning }}
                  />
                  <View
                    style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: previewColors.error }}
                  />
                </View>
              </View>

              <View style={[styles.previewDivider, { backgroundColor: previewColors.border }]} />

              <View style={styles.previewRow}>
                <Text style={[styles.previewRowLabel, { color: previewColors.textMuted }]}>
                  Muted text
                </Text>
                <View
                  style={[
                    styles.previewChip,
                    { backgroundColor: previewColors.bgElevated },
                  ]}
                >
                  <Text style={[styles.previewChipText, { color: previewColors.textSecondary }]}>
                    Elevated
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.previewFooter, { borderTopColor: previewColors.border }]}>
              <Text style={[styles.previewCaption, { color: previewColors.textMuted }]}>
                Backgrounds and borders auto-adjust to your colors
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
