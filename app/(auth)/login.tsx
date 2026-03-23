import { useState, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/ui';
import { useThemeColors } from '../../src/context/ThemeContext';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

const __DEV_MODE__ = __DEV__;

export default function LoginScreen() {
  const { signInWithEmail, signInWithGoogle, signInWithApple, devBypass } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    gradient: { flex: 1 },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    logoSection: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 36, fontWeight: 'bold', color: colors.textPrimary, marginTop: 16 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 8 },
    formSection: { width: '100%', marginBottom: 16 },
    input: {
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginVertical: 16,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { ...typography.caption, color: colors.textMuted, marginHorizontal: 12 },
    socialSection: { width: '100%', marginBottom: 24 },
    buttonSpacer: { height: 12 },
    footer: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  }), [colors]);

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password, isNewAccount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[colors.navy, colors.bgPrimary]} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.logoSection}>
          <Ionicons name="camera" size={64} color={colors.orange} />
          <Text style={styles.title}>FieldCam</Text>
          <Text style={styles.subtitle}>Capture. Process. Share.</Text>
        </View>

        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType={isNewAccount ? 'newPassword' : 'password'}
          />
          <Button
            label={loading ? 'Please wait...' : isNewAccount ? 'Create Account' : 'Sign In'}
            onPress={handleEmailSubmit}
            variant="primary"
          />
          <View style={styles.buttonSpacer} />
          <Button
            label={isNewAccount ? 'Already have an account? Sign In' : 'Need an account? Create one'}
            onPress={() => setIsNewAccount((prev) => !prev)}
            variant="ghost"
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialSection}>
          <Button
            label="Sign in with Google"
            onPress={signInWithGoogle}
            variant="secondary"
          />
          {Platform.OS === 'ios' && (
            <>
              <View style={styles.buttonSpacer} />
              <Button
                label="Sign in with Apple"
                onPress={signInWithApple}
                variant="secondary"
              />
            </>
          )}
        </View>

        {__DEV_MODE__ && (
          <>
            <View style={styles.buttonSpacer} />
            <Button
              label="Skip Login (Dev Mode)"
              onPress={devBypass}
              variant="ghost"
            />
          </>
        )}

        <Text style={styles.footer}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
