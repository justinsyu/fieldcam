import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, testID }: ButtonProps) {
  const bgColor = variant === 'primary' ? colors.orange : variant === 'secondary' ? colors.bgElevated : 'transparent';
  const textColor = variant === 'ghost' ? colors.orange : colors.white;
  return (
    <TouchableOpacity testID={testID} onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}
      style={[styles.base, { backgroundColor: bgColor }, disabled && styles.disabled]}>
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  label: { ...typography.button },
  disabled: { opacity: 0.5 },
});
