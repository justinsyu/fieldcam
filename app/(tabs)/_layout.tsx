import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useThemeColors } from '../../src/context/ThemeContext';
import { useUploads } from '../../src/context/UploadContext';

export default function TabLayout() {
  const { pendingCount } = useUploads();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="uploads"
        options={{
          title: 'Uploads',
          headerShown: false,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.orange },
          tabBarIcon: ({ color }) => (
            <Ionicons name="cloud-upload" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profiles"
        options={{
          title: 'Profiles',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
