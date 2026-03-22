import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  description?: string;
  testID?: string;
}

export function Toggle({ label, value, onValueChange, description, testID }: ToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch testID={testID} value={value} onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.orange }} thumbColor={colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  textContainer: { flex: 1, marginRight: spacing.md },
  label: { ...typography.body, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
