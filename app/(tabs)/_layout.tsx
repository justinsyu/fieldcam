import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '../../src/theme';
import { useUploads } from '../../src/context/UploadContext';

export default function TabLayout() {
  const { pendingCount } = useUploads();

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
        headerTintColor: colors.white,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => (
            <Ionicons name="camera" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="uploads"
        options={{
          title: 'Uploads',
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
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
