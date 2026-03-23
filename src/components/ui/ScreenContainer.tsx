import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../../context/ThemeContext';

interface ScreenContainerProps { children: React.ReactNode; scrollable?: boolean; }
export function ScreenContainer({ children, scrollable = false }: ScreenContainerProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgPrimary },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
  }), [colors]);
  return (
    <SafeAreaView style={styles.safe}>
      {scrollable ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
      ) : (
        <View style={styles.container}>{children}</View>
      )}
    </SafeAreaView>
  );
}
