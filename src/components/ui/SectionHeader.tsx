import React, { useMemo } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SectionHeaderProps { title: string; }
export function SectionHeader({ title }: SectionHeaderProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => StyleSheet.create({
    container: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
    title: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  }), [colors]);
  return <View style={styles.container}><Text style={styles.title}>{title}</Text></View>;
}
