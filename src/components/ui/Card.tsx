import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing, radius } from '../../theme/spacing';

interface CardProps { children: React.ReactNode; style?: ViewStyle; }
export function Card({ children, style }: CardProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => StyleSheet.create({
    card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  }), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}
