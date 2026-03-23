import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import '../src/db/init';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { UploadProvider } from '../src/context/UploadContext';
import { ThemeProvider, useThemeColors } from '../src/context/ThemeContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/(tabs)` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <UploadProvider>
          <RootLayoutNav />
        </UploadProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated } = useAuth();
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgPrimary,
    },
  }), [colors]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="profile-editor"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="folder-picker"
          options={{
            title: 'Choose Folder',
            headerStyle: { backgroundColor: colors.bgPrimary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen
          name="qr-scanner"
          options={{
            title: 'Scan QR Code',
            headerStyle: { backgroundColor: colors.bgPrimary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen
          name="upload-history"
          options={{
            title: 'Upload History',
            headerStyle: { backgroundColor: colors.bgPrimary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen
          name="permissions"
          options={{
            title: 'App Permissions',
            headerStyle: { backgroundColor: colors.bgPrimary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen
          name="theme-editor"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
      {!isAuthenticated && <Redirect href="/(auth)/login" />}
      <StatusBar style="light" />
    </NavThemeProvider>
  );
}
