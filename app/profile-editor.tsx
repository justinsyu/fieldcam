import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeColors } from '../src/context/ThemeContext';
import { typography } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { profileService } from '../src/services/profileService';
import type { DeliveryType } from '../src/types/profile';

const DELIVERY_OPTIONS: { label: string; value: DeliveryType }[] = [
  { label: 'Same Folder', value: 'same_folder' },
  { label: 'Different Folder', value: 'different_folder' },
  { label: 'Email', value: 'email' },
];

export default function ProfileEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEditing = Boolean(id);
  const colors = useThemeColors();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>(['same_folder']);
  const [deliveryDestination, setDeliveryDestination] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    backButton: {
      padding: spacing.xs,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
    },
    keyboardAvoid: {
      flex: 1,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgPrimary,
    },
    field: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.textPrimary,
      ...typography.body,
    },
    multilineInput: {
      minHeight: 140,
      paddingTop: spacing.sm,
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
    deliveryButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    deliveryButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgCard,
    },
    deliveryButtonActive: {
      borderColor: colors.orange,
      backgroundColor: colors.orange,
    },
    deliveryButtonText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    deliveryButtonTextActive: {
      color: colors.white,
    },
    saveButton: {
      backgroundColor: colors.orange,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      marginTop: spacing.md,
    },
    saveButtonText: {
      ...typography.button,
      color: colors.white,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    deleteButton: {
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      ...typography.button,
      color: colors.error,
    },
    lockedBanner: {
      marginTop: spacing.md,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    lockedText: {
      ...typography.bodySmall,
      color: colors.textMuted,
      textAlign: 'center',
    },
  }), [colors]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const profiles = await profileService.getAll();
        const profile = profiles.find((p) => p.id === id);
        if (profile) {
          setName(profile.name);
          setDescription(profile.description ?? '');
          setPromptTemplate(profile.promptTemplate);
          setDeliveryTypes(profile.deliveryType);
          setDeliveryDestination(profile.deliveryDestination ?? '');
          setIsLocked(profile.isLocked);
        }
      } catch (e) {
        console.error('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Profile name is required.');
      return;
    }
    if (!promptTemplate.trim()) {
      Alert.alert('Validation Error', 'Prompt template is required.');
      return;
    }

    setSaving(true);
    try {
      if (deliveryTypes.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one delivery type.');
        setSaving(false);
        return;
      }
      const params = {
        name: name.trim(),
        description: description.trim() || null,
        promptTemplate: promptTemplate.trim(),
        deliveryType: deliveryTypes,
        deliveryDestination:
          deliveryTypes.includes('email')
            ? deliveryDestination.trim() || null
            : null,
      };

      if (isEditing && id) {
        await profileService.update(id, params);
      } else {
        await profileService.create(params);
      }
      router.back();
    } catch (e) {
      console.error('Failed to save profile', e);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.delete(id);
              router.back();
            } catch (e) {
              console.error('Failed to delete profile', e);
              Alert.alert('Error', 'Failed to delete profile.');
            }
          },
        },
      ]
    );
  };

  const showEmailInput = deliveryTypes.includes('email');

  const toggleDeliveryType = (value: DeliveryType) => {
    if (isLocked) return;
    setDeliveryTypes((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : [...prev, value]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Profile' : 'New Profile'}</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Profile name"
            placeholderTextColor={colors.textMuted}
            editable={!isLocked}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional description"
            placeholderTextColor={colors.textMuted}
            editable={!isLocked}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Prompt Template *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={promptTemplate}
            onChangeText={setPromptTemplate}
            placeholder="Enter your prompt template..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isLocked}
          />
          <Text style={styles.hint}>
            Use {`{{extracted_text}}`}, {`{{timestamp}}`}, {`{{location}}`}, {`{{folder_name}}`}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Delivery Type</Text>
          <View style={styles.deliveryButtons}>
            {DELIVERY_OPTIONS.map((option) => {
              const isSelected = deliveryTypes.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.deliveryButton,
                    isSelected && styles.deliveryButtonActive,
                  ]}
                  onPress={() => toggleDeliveryType(option.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.deliveryButtonText,
                      isSelected && styles.deliveryButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {showEmailInput && (
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={deliveryDestination}
              onChangeText={setDeliveryDestination}
              placeholder="recipient@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLocked}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving || isLocked}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Save Changes' : 'Create Profile'}
            </Text>
          )}
        </TouchableOpacity>

        {isEditing && !isLocked && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteButtonText}>Delete Profile</Text>
          </TouchableOpacity>
        )}

        {isLocked && (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>This profile is locked and cannot be edited.</Text>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
