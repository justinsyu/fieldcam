import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/ui';
import { colors } from '../../src/theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <LinearGradient
      colors={[colors.navy, colors.bgPrimary]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <Ionicons name="camera" size={64} color={colors.orange} />
          <Text style={styles.title}>FieldCam</Text>
          <Text style={styles.subtitle}>Capture. Process. Share.</Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            label="Sign in with Google"
            onPress={() => signIn('google')}
            variant="primary"
          />
          <View style={styles.buttonSpacer} />
          <Button
            label="Sign in with Microsoft"
            onPress={() => signIn('microsoft')}
            variant="secondary"
          />
          <View style={styles.buttonSpacer} />
          <Button
            label="Sign in with Dropbox"
            onPress={() => signIn('dropbox')}
            variant="secondary"
          />
        </View>

        <Text style={styles.footer}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  buttonSection: {
    width: '100%',
    marginBottom: 32,
  },
  buttonSpacer: {
    height: 12,
  },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
