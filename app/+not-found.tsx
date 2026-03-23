import { Redirect, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useAuth } from '../src/context/AuthContext';

export default function NotFoundScreen() {
  const { isAuthenticated } = useAuth();

  // After OAuth redirects, the app may land on an unrecognized route.
  // Redirect authenticated users to the main app.
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/camera" />;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>

        <Redirect href="/(auth)/login" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
