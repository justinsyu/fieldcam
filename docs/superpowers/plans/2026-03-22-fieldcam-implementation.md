# FieldCam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the FieldCam React Native (Expo) app for pharma conference photo capture, cloud upload, and AI-powered processing.

**Architecture:** Expo-managed React Native app with bottom-tab navigation (Camera, Uploads, Profiles, Settings). Local SQLite database for upload queue and profiles. OAuth auth via Google/Microsoft/Dropbox. Serverless Node.js backend for AI processing (OCR + Claude API). Dark enterprise theme inspired by cohere.com.

**Tech Stack:** React Native, Expo SDK 52+, TypeScript, expo-router (file-based routing), expo-camera, expo-sqlite, expo-secure-store, @react-native-async-storage/async-storage, expo-file-system, expo-location, expo-crypto

**Spec:** `docs/superpowers/specs/2026-03-22-fieldcam-design.md`

---

## Phase 1: Project Foundation

### Task 1: Scaffold Expo Project

**Files:**
- Create: `app/_layout.tsx` (root layout with providers)
- Create: `app/(tabs)/_layout.tsx` (tab navigator)
- Create: `app/(tabs)/camera.tsx` (camera tab placeholder)
- Create: `app/(tabs)/uploads.tsx` (uploads tab placeholder)
- Create: `app/(tabs)/profiles.tsx` (profiles tab placeholder)
- Create: `app/(tabs)/settings.tsx` (settings tab placeholder)
- Create: `app/(auth)/login.tsx` (login screen placeholder)
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `app.json` (Expo config)

- [ ] **Step 1: Create Expo project with TypeScript template**

```bash
cd C:/Users/Justin/Desktop/fieldcam
npx create-expo-app@latest . --template tabs --yes
```

If the directory is not empty, move existing files (docs, screenshots, apk_extracted, uploadcam.apk) into a `_reference/` folder first, then scaffold.

- [ ] **Step 2: Install core dependencies**

```bash
npx expo install expo-router expo-camera expo-sqlite expo-secure-store expo-file-system expo-location expo-crypto @react-native-async-storage/async-storage expo-linking expo-web-browser expo-auth-session expo-notifications expo-constants
npm install @expo/vector-icons react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
```

- [ ] **Step 3: Configure app.json**

Set app name to "FieldCam", slug to "fieldcam", scheme to "fieldcam". Set iOS bundleIdentifier and Android package to "com.fieldcam.app". Enable `expo-router` plugin. Set `newArchEnabled: true`.

- [ ] **Step 4: Set up file-based routing with tab layout**

Create `app/_layout.tsx` as the root layout. Create `app/(tabs)/_layout.tsx` with 4 bottom tabs: Camera (center), Uploads, Profiles, Settings. Each tab renders a placeholder `<View>` with the tab name. Use `@expo/vector-icons/Ionicons` for tab icons: `camera` for Camera, `cloud-upload` for Uploads, `document-text` for Profiles, `settings` for Settings.

- [ ] **Step 5: Verify the app runs**

```bash
npx expo start
```

Press `a` for Android or `i` for iOS. Verify all 4 tabs render with their placeholder text.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with tab navigation"
```

---

### Task 2: Design System & Theme

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/typography.ts`
- Create: `src/theme/spacing.ts`
- Create: `src/theme/index.ts`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Toggle.tsx`
- Create: `src/components/ui/ScreenContainer.tsx`
- Create: `src/components/ui/SectionHeader.tsx`
- Create: `src/components/ui/index.ts`
- Test: `src/components/ui/__tests__/Button.test.tsx`
- Test: `src/components/ui/__tests__/Toggle.test.tsx`

- [ ] **Step 1: Install testing deps**

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @types/jest @types/react-test-renderer
```

Configure `jest` in `package.json`:
```json
{
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
    ]
  }
}
```

- [ ] **Step 2: Create color palette**

`src/theme/colors.ts`:
```typescript
export const colors = {
  // Primary
  navy: '#152455',
  black: '#000000',
  white: '#FFFFFF',

  // Accent
  orange: '#DA532C',
  orangeLight: '#E8764F',

  // Backgrounds
  bgPrimary: '#0A0E1A',
  bgSecondary: '#111827',
  bgCard: '#1A2137',
  bgElevated: '#1F2A45',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Borders
  border: '#1E293B',
  borderLight: '#334155',
} as const;
```

- [ ] **Step 3: Create typography and spacing**

`src/theme/typography.ts`:
```typescript
import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  h1: { fontFamily, fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontFamily, fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontFamily, fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontFamily, fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontFamily, fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontFamily, fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontFamily, fontSize: 14, fontWeight: '500' as const, lineHeight: 18 },
  button: { fontFamily, fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
} as const;
```

`src/theme/spacing.ts`:
```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
```

`src/theme/index.ts`:
```typescript
export { colors } from './colors';
export { typography } from './typography';
export { spacing, radius } from './spacing';
```

- [ ] **Step 4: Write failing tests for Button component**

`src/components/ui/__tests__/Button.test.tsx`:
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders label text', () => {
    const { getByText } = render(<Button label="Tap me" onPress={() => {}} />);
    expect(getByText('Tap me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap me" onPress={onPress} disabled />);
    fireEvent.press(getByText('Tap me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders secondary variant', () => {
    const { getByTestId } = render(
      <Button label="Secondary" onPress={() => {}} variant="secondary" testID="btn" />
    );
    expect(getByTestId('btn')).toBeTruthy();
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

```bash
npx jest src/components/ui/__tests__/Button.test.tsx --no-coverage
```

Expected: FAIL - module not found.

- [ ] **Step 6: Implement Button component**

`src/components/ui/Button.tsx`:
```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, testID }: ButtonProps) {
  const bgColor = variant === 'primary' ? colors.orange
    : variant === 'secondary' ? colors.bgElevated
    : 'transparent';

  const textColor = variant === 'ghost' ? colors.orange : colors.white;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        { backgroundColor: bgColor },
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx jest src/components/ui/__tests__/Button.test.tsx --no-coverage
```

Expected: PASS (4 tests).

- [ ] **Step 8: Write failing tests for Toggle**

`src/components/ui/__tests__/Toggle.test.tsx`:
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders label', () => {
    const { getByText } = render(<Toggle label="WiFi Only" value={false} onValueChange={() => {}} />);
    expect(getByText('WiFi Only')).toBeTruthy();
  });

  it('calls onValueChange when toggled', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <Toggle label="WiFi" value={false} onValueChange={onChange} testID="toggle" />
    );
    fireEvent(getByTestId('toggle'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
```

- [ ] **Step 9: Run tests, verify fail, implement Toggle**

`src/components/ui/Toggle.tsx`:
```typescript
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
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.orange }}
        thumbColor={colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 10: Run toggle tests, verify pass**

```bash
npx jest src/components/ui/__tests__/ --no-coverage
```

Expected: PASS (6 tests).

- [ ] **Step 11: Implement remaining UI primitives**

`src/components/ui/Card.tsx`:
```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
```

`src/components/ui/ScreenContainer.tsx`:
```typescript
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export function ScreenContainer({ children, scrollable = false }: ScreenContainerProps) {
  return (
    <SafeAreaView style={styles.safe}>
      {scrollable ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.container}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
```

`src/components/ui/SectionHeader.tsx`:
```typescript
import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
```

`src/components/ui/index.ts`:
```typescript
export { Button } from './Button';
export { Card } from './Card';
export { Toggle } from './Toggle';
export { ScreenContainer } from './ScreenContainer';
export { SectionHeader } from './SectionHeader';
```

- [ ] **Step 12: Run all tests, verify pass, commit**

```bash
npx jest --no-coverage
git add -A
git commit -m "feat: add design system theme and UI components"
```

---

## Phase 2: Authentication

### Task 3: Auth Context & Secure Storage Layer

**Files:**
- Create: `src/services/secureStorage.ts`
- Create: `src/context/AuthContext.tsx`
- Create: `src/types/auth.ts`
- Test: `src/services/__tests__/secureStorage.test.ts`

- [ ] **Step 1: Define auth types**

`src/types/auth.ts`:
```typescript
export type CloudProvider = 'google' | 'microsoft' | 'dropbox';

export interface CloudAccount {
  provider: CloudProvider;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  cloudAccounts: CloudAccount[];
  primaryProvider: CloudProvider;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

- [ ] **Step 2: Write failing test for secureStorage**

`src/services/__tests__/secureStorage.test.ts`:
```typescript
import { secureStorage } from '../secureStorage';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saves and retrieves a token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('test-token');
    const token = await secureStorage.getToken('google');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('fieldcam_token_google');
    expect(token).toBe('test-token');
  });

  it('saves a token', async () => {
    await secureStorage.saveToken('google', 'my-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('fieldcam_token_google', 'my-token');
  });

  it('deletes a token', async () => {
    await secureStorage.deleteToken('google');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('fieldcam_token_google');
  });
});
```

- [ ] **Step 3: Run test, verify fail**

```bash
npx jest src/services/__tests__/secureStorage.test.ts --no-coverage
```

- [ ] **Step 4: Implement secureStorage**

`src/services/secureStorage.ts`:
```typescript
import * as SecureStore from 'expo-secure-store';
import type { CloudProvider } from '../types/auth';

const TOKEN_PREFIX = 'fieldcam_token_';
const USER_KEY = 'fieldcam_user';

export const secureStorage = {
  async saveToken(provider: CloudProvider, token: string): Promise<void> {
    await SecureStore.setItemAsync(`${TOKEN_PREFIX}${provider}`, token);
  },

  async getToken(provider: CloudProvider): Promise<string | null> {
    return SecureStore.getItemAsync(`${TOKEN_PREFIX}${provider}`);
  },

  async deleteToken(provider: CloudProvider): Promise<void> {
    await SecureStore.deleteItemAsync(`${TOKEN_PREFIX}${provider}`);
  },

  async saveUser(user: object): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<object | null> {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
    for (const provider of ['google', 'microsoft', 'dropbox'] as CloudProvider[]) {
      await SecureStore.deleteItemAsync(`${TOKEN_PREFIX}${provider}`);
    }
  },
};
```

- [ ] **Step 5: Run test, verify pass, commit**

```bash
npx jest src/services/__tests__/secureStorage.test.ts --no-coverage
git add -A
git commit -m "feat: add secure storage service for auth tokens"
```

- [ ] **Step 6: Implement AuthContext**

`src/context/AuthContext.tsx`:
```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { secureStorage } from '../services/secureStorage';
import type { User, CloudProvider, AuthState } from '../types/auth';

interface AuthContextValue extends AuthState {
  signIn: (provider: CloudProvider) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    (async () => {
      const user = await secureStorage.getUser() as User | null;
      setState({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      });
    })();
  }, []);

  const signIn = useCallback(async (provider: CloudProvider) => {
    // OAuth flow will be implemented in Task 4
    // For now, this is a placeholder
    const mockUser: User = {
      id: 'placeholder',
      email: 'user@example.com',
      displayName: 'User',
      cloudAccounts: [],
      primaryProvider: provider,
    };
    await secureStorage.saveUser(mockUser);
    setState({ user: mockUser, isAuthenticated: true, isLoading: false });
  }, []);

  const signOut = useCallback(async () => {
    await secureStorage.clearAll();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 7: Wire AuthProvider into root layout, commit**

In `app/_layout.tsx`, wrap the slot/navigator with `<AuthProvider>`. Add conditional rendering: if `isLoading`, show a splash/loading screen. If `!isAuthenticated`, show the login screen. Otherwise, show the tab navigator.

```bash
git add -A
git commit -m "feat: add auth context with provider and useAuth hook"
```

---

### Task 4: Login Screen

**Files:**
- Modify: `app/(auth)/login.tsx`
- Create: `assets/images/fieldcam-logo.png` (placeholder, can be replaced)

- [ ] **Step 1: Build login screen UI**

`app/(auth)/login.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/ui';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signIn } = useAuth();

  return (
    <LinearGradient colors={[colors.navy, colors.bgPrimary]} style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="camera" size={64} color={colors.orange} />
        <Text style={styles.title}>FieldCam</Text>
        <Text style={styles.subtitle}>Capture. Process. Share.</Text>
      </View>

      <View style={styles.buttons}>
        <Button label="Sign in with Google" onPress={() => signIn('google')} />
        <View style={styles.spacer} />
        <Button label="Sign in with Microsoft" onPress={() => signIn('microsoft')} variant="secondary" />
        <View style={styles.spacer} />
        <Button label="Sign in with Dropbox" onPress={() => signIn('dropbox')} variant="secondary" />
      </View>

      <Text style={styles.footer}>
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.white,
    marginTop: spacing.md,
    fontSize: 36,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  buttons: {
    marginBottom: spacing.xxl,
  },
  spacer: {
    height: spacing.md,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Install expo-linear-gradient**

```bash
npx expo install expo-linear-gradient
```

- [ ] **Step 3: Verify login screen renders, commit**

```bash
npx expo start
```

Verify the login screen shows on launch (since no user is authenticated).

```bash
git add -A
git commit -m "feat: add login screen with OAuth provider buttons"
```

---

### Task 5: Google OAuth Flow

**Files:**
- Create: `src/services/oauth.ts`
- Modify: `src/context/AuthContext.tsx` (wire real OAuth)
- Modify: `app.json` (add OAuth scheme config)

- [ ] **Step 1: Configure OAuth in app.json**

Add `expo-auth-session` and `expo-web-browser` plugins. Set the `scheme` to `"fieldcam"` for OAuth redirect.

- [ ] **Step 2: Implement OAuth service**

`src/services/oauth.ts`:
```typescript
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { CloudProvider, CloudAccount } from '../types/auth';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth config - replace with real client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__';

export async function performOAuth(provider: CloudProvider): Promise<CloudAccount | null> {
  if (provider === 'google') {
    return performGoogleOAuth();
  }
  // Microsoft and Dropbox to be implemented similarly
  throw new Error(`OAuth for ${provider} not yet implemented`);
}

async function performGoogleOAuth(): Promise<CloudAccount | null> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'fieldcam' });

  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.file',
    ],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync({
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  });

  if (result.type !== 'success' || !result.params.code) {
    return null;
  }

  // Exchange code for tokens
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: GOOGLE_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier! },
    },
    { tokenEndpoint: 'https://oauth2.googleapis.com/token' }
  );

  // Fetch user info
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
  });
  const userInfo = await userInfoRes.json();

  return {
    provider: 'google',
    email: userInfo.email,
    accessToken: tokenResult.accessToken!,
    refreshToken: tokenResult.refreshToken ?? '',
    expiresAt: Date.now() + (tokenResult.expiresIn ?? 3600) * 1000,
  };
}
```

- [ ] **Step 3: Update AuthContext to use real OAuth**

Replace the mock `signIn` in `AuthContext.tsx` to call `performOAuth(provider)`, save the returned `CloudAccount` via `secureStorage`, and update state.

- [ ] **Step 4: Test OAuth flow on device/emulator, commit**

```bash
npx expo start
```

Test sign-in with Google. Verify the app navigates to tabs after successful auth.

Note: OAuth will only work with a valid `GOOGLE_CLIENT_ID`. For development, use Expo Go's proxy: set `useProxy: true` in `request.promptAsync()`.

```bash
git add -A
git commit -m "feat: implement Google OAuth sign-in flow"
```

---

## Phase 3: Camera & Capture

### Task 6: Camera Screen

**Files:**
- Modify: `app/(tabs)/camera.tsx`
- Create: `src/components/camera/CameraView.tsx`
- Create: `src/components/camera/CameraControls.tsx`
- Create: `src/components/camera/CameraTopBar.tsx`
- Create: `src/hooks/useCamera.ts`

- [ ] **Step 1: Create useCamera hook**

`src/hooks/useCamera.ts`:
```typescript
import { useState, useRef, useCallback } from 'react';
import { CameraView as ExpoCameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

export function useCamera() {
  const cameraRef = useRef<ExpoCameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [showGrid, setShowGrid] = useState(false);

  const toggleFacing = useCallback(() => {
    setFacing(f => f === 'back' ? 'front' : 'back');
  }, []);

  const toggleFlash = useCallback(() => {
    setFlash(f => f === 'off' ? 'on' : 'off');
  }, []);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.85,
      exif: true,
    });
    return photo;
  }, []);

  return {
    cameraRef,
    permission,
    requestPermission,
    facing,
    flash,
    showGrid,
    setShowGrid,
    toggleFacing,
    toggleFlash,
    takePicture,
  };
}
```

- [ ] **Step 2: Build CameraTopBar**

`src/components/camera/CameraTopBar.tsx`:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface CameraTopBarProps {
  folderName: string;
  providerIcon: string;
  onSettingsPress: () => void;
  flash: 'off' | 'on';
  onFlashToggle: () => void;
}

export function CameraTopBar({ folderName, providerIcon, onSettingsPress, flash, onFlashToggle }: CameraTopBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.folderInfo}>
        <Ionicons name="folder" size={18} color={colors.orange} />
        <Text style={styles.folderName} numberOfLines={1}>{folderName}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onFlashToggle} style={styles.iconBtn}>
          <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={22} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSettingsPress} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  folderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderName: {
    ...typography.bodySmall,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
});
```

- [ ] **Step 3: Build CameraControls**

`src/components/camera/CameraControls.tsx`:
```typescript
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface CameraControlsProps {
  onCapture: () => void;
  onFlipCamera: () => void;
  onQRScan: () => void;
  isCapturing: boolean;
}

export function CameraControls({ onCapture, onFlipCamera, onQRScan, isCapturing }: CameraControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onQRScan} style={styles.sideBtn}>
        <Ionicons name="qr-code-outline" size={28} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onCapture}
        disabled={isCapturing}
        style={[styles.shutterBtn, isCapturing && styles.shutterCapturing]}
        activeOpacity={0.7}
      >
        <View style={styles.shutterInner} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onFlipCamera} style={styles.sideBtn}>
        <Ionicons name="camera-reverse-outline" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sideBtn: {
    padding: spacing.md,
  },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
  shutterCapturing: {
    borderColor: colors.orange,
  },
});
```

- [ ] **Step 4: Assemble camera tab screen**

`app/(tabs)/camera.tsx`:
```typescript
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraTopBar } from '../../src/components/camera/CameraTopBar';
import { CameraControls } from '../../src/components/camera/CameraControls';
import { useCamera } from '../../src/hooks/useCamera';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/ui';
import { router } from 'expo-router';

export default function CameraScreen() {
  const {
    cameraRef, permission, requestPermission,
    facing, flash, toggleFacing, toggleFlash, takePicture,
  } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const photo = await takePicture();
      if (photo) {
        // Will be wired to upload queue in Phase 4
        console.log('Photo captured:', photo.uri);
      }
    } finally {
      setIsCapturing(false);
    }
  }, [takePicture]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is required to take photos.</Text>
        <Button label="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
      >
        <CameraTopBar
          folderName="Not set"
          providerIcon="logo-google"
          onSettingsPress={() => {}}
          flash={flash}
          onFlashToggle={toggleFlash}
        />
        <View style={styles.spacer} />
        <CameraControls
          onCapture={handleCapture}
          onFlipCamera={toggleFacing}
          onQRScan={() => router.push('/qr-scanner')}
          isCapturing={isCapturing}
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
});
```

- [ ] **Step 5: Test camera on device/emulator, commit**

```bash
npx expo start
```

Verify camera preview renders, shutter button captures a photo (logged to console), flash toggle and camera flip work.

```bash
git add -A
git commit -m "feat: add camera screen with capture, flash, and flip controls"
```

---

## Phase 4: Local Storage & Upload Queue

### Task 7: SQLite Database Layer

**Files:**
- Create: `src/db/database.ts`
- Create: `src/db/schema.ts`
- Create: `src/db/migrations.ts`
- Test: `src/db/__tests__/database.test.ts`

- [ ] **Step 1: Define database schema**

`src/db/schema.ts`:
```typescript
export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS upload_queue (
    id TEXT PRIMARY KEY,
    local_uri TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    file_size INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL,
    folder_id TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    uploaded_at TEXT,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    cloud_file_id TEXT,
    process_with_profile TEXT,
    annotations TEXT
  );

  CREATE TABLE IF NOT EXISTS processing_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    delivery_type TEXT NOT NULL DEFAULT 'same_folder',
    delivery_destination TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_team INTEGER NOT NULL DEFAULT 0,
    is_locked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_upload_status ON upload_queue(status);
  CREATE INDEX IF NOT EXISTS idx_upload_created ON upload_queue(created_at DESC);
`;
```

- [ ] **Step 2: Create database service**

`src/db/database.ts`:
```typescript
import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('fieldcam.db');
  await db.execAsync(CREATE_TABLES);
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
```

- [ ] **Step 3: Write failing test for database**

`src/db/__tests__/database.test.ts`:
```typescript
import { getDatabase } from '../database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  };
  return {
    openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
  };
});

describe('database', () => {
  it('opens and initializes the database', async () => {
    const db = await getDatabase();
    expect(db).toBeDefined();
    expect(db.execAsync).toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run test, verify pass, commit**

```bash
npx jest src/db/__tests__/database.test.ts --no-coverage
git add -A
git commit -m "feat: add SQLite database layer with schema"
```

---

### Task 8: Upload Queue Service

**Files:**
- Create: `src/services/uploadQueue.ts`
- Create: `src/types/upload.ts`
- Test: `src/services/__tests__/uploadQueue.test.ts`

- [ ] **Step 1: Define upload types**

`src/types/upload.ts`:
```typescript
import type { CloudProvider } from './auth';

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

export interface UploadItem {
  id: string;
  localUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: UploadStatus;
  provider: CloudProvider;
  folderId: string;
  folderName: string;
  createdAt: string;
  uploadedAt: string | null;
  error: string | null;
  retryCount: number;
  cloudFileId: string | null;
  processWithProfile: string | null;
}
```

- [ ] **Step 2: Write failing test for uploadQueue**

`src/services/__tests__/uploadQueue.test.ts`:
```typescript
import { uploadQueue } from '../uploadQueue';

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  closeAsync: jest.fn(),
};

jest.mock('../../db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-123',
}));

describe('uploadQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds an item to the queue', async () => {
    await uploadQueue.enqueue({
      localUri: 'file:///photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      provider: 'google',
      folderId: 'folder-1',
      folderName: 'My Folder',
    });
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  it('gets pending items', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: '1', status: 'pending', local_uri: 'file:///a.jpg' },
    ]);
    const items = await uploadQueue.getPending();
    expect(mockDb.getAllAsync).toHaveBeenCalled();
    expect(items).toHaveLength(1);
  });

  it('updates item status', async () => {
    await uploadQueue.updateStatus('1', 'uploading');
    expect(mockDb.runAsync).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test, verify fail**

```bash
npx jest src/services/__tests__/uploadQueue.test.ts --no-coverage
```

- [ ] **Step 4: Install uuid, implement uploadQueue**

`src/services/uploadQueue.ts`:
```typescript
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';
import type { UploadItem, UploadStatus } from '../types/upload';
import type { CloudProvider } from '../types/auth';

interface EnqueueParams {
  localUri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  provider: CloudProvider;
  folderId: string;
  folderName: string;
  processWithProfile?: string;
}

function rowToUploadItem(row: any): UploadItem {
  return {
    id: row.id,
    localUri: row.local_uri,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    status: row.status,
    provider: row.provider,
    folderId: row.folder_id,
    folderName: row.folder_name,
    createdAt: row.created_at,
    uploadedAt: row.uploaded_at,
    error: row.error,
    retryCount: row.retry_count,
    cloudFileId: row.cloud_file_id,
    processWithProfile: row.process_with_profile,
  };
}

export const uploadQueue = {
  async enqueue(params: EnqueueParams): Promise<string> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO upload_queue (id, local_uri, file_name, mime_type, file_size, provider, folder_id, folder_name, process_with_profile)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, params.localUri, params.fileName, params.mimeType, params.fileSize,
      params.provider, params.folderId, params.folderName, params.processWithProfile ?? null,
    );
    return id;
  },

  async getPending(): Promise<UploadItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM upload_queue WHERE status IN ('pending', 'failed') ORDER BY created_at ASC`
    );
    return rows.map(rowToUploadItem);
  },

  async getAll(): Promise<UploadItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT * FROM upload_queue ORDER BY created_at DESC LIMIT 100`
    );
    return rows.map(rowToUploadItem);
  },

  async updateStatus(id: string, status: UploadStatus, error?: string, cloudFileId?: string): Promise<void> {
    const db = await getDatabase();
    const uploadedAt = status === 'completed' ? new Date().toISOString() : null;
    await db.runAsync(
      `UPDATE upload_queue SET status = ?, error = ?, cloud_file_id = ?, uploaded_at = ?,
       retry_count = CASE WHEN ? = 'failed' THEN retry_count + 1 ELSE retry_count END
       WHERE id = ?`,
      status, error ?? null, cloudFileId ?? null, uploadedAt, status, id,
    );
  },

  async clearHistory(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM upload_queue WHERE status = 'completed'`);
  },

  async deleteItem(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM upload_queue WHERE id = ?`, id);
  },
};
```

- [ ] **Step 5: Run test, verify pass, commit**

```bash
npx jest src/services/__tests__/uploadQueue.test.ts --no-coverage
git add -A
git commit -m "feat: add upload queue service with SQLite persistence"
```

---

### Task 9: Wire Camera to Upload Queue

**Files:**
- Modify: `app/(tabs)/camera.tsx`
- Create: `src/context/UploadContext.tsx`
- Create: `src/hooks/useUploadQueue.ts`

- [ ] **Step 1: Create useUploadQueue hook**

`src/hooks/useUploadQueue.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { uploadQueue } from '../services/uploadQueue';
import type { UploadItem } from '../types/upload';

export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    const all = await uploadQueue.getAll();
    setItems(all);
    const pending = all.filter(i => i.status === 'pending' || i.status === 'uploading');
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, pendingCount, refresh };
}
```

- [ ] **Step 2: Create UploadContext for shared state**

`src/context/UploadContext.tsx`:
```typescript
import React, { createContext, useContext } from 'react';
import { useUploadQueue } from '../hooks/useUploadQueue';
import type { UploadItem } from '../types/upload';

interface UploadContextValue {
  items: UploadItem[];
  pendingCount: number;
  refresh: () => Promise<void>;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const queue = useUploadQueue();
  return (
    <UploadContext.Provider value={queue}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads must be used within UploadProvider');
  return ctx;
}
```

- [ ] **Step 3: Update camera screen to enqueue photos after capture**

In `app/(tabs)/camera.tsx`, after `takePicture()` succeeds, call `uploadQueue.enqueue(...)` with the photo URI and current folder info. Show a brief toast/notification that the photo was queued. Call `refresh()` from `useUploads()` to update the badge.

- [ ] **Step 4: Add UploadProvider to root layout, commit**

Wrap the navigator in `app/_layout.tsx` with `<UploadProvider>`.

```bash
git add -A
git commit -m "feat: wire camera capture to upload queue"
```

---

## Phase 5: Upload Queue UI & Cloud Upload

### Task 10: Uploads Tab Screen

**Files:**
- Modify: `app/(tabs)/uploads.tsx`
- Create: `src/components/uploads/UploadListItem.tsx`
- Create: `src/components/uploads/EmptyUploads.tsx`

- [ ] **Step 1: Build UploadListItem component**

`src/components/uploads/UploadListItem.tsx`:
```typescript
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import type { UploadItem } from '../../types/upload';

interface UploadListItemProps {
  item: UploadItem;
  onRetry?: (id: string) => void;
}

const statusConfig = {
  pending: { icon: 'time-outline' as const, color: colors.warning, label: 'Pending' },
  uploading: { icon: 'cloud-upload-outline' as const, color: colors.info, label: 'Uploading' },
  completed: { icon: 'checkmark-circle' as const, color: colors.success, label: 'Uploaded' },
  failed: { icon: 'alert-circle' as const, color: colors.error, label: 'Failed' },
};

export function UploadListItem({ item, onRetry }: UploadListItemProps) {
  const status = statusConfig[item.status];

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.localUri }} style={styles.thumbnail} />
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={1}>{item.fileName}</Text>
        <View style={styles.statusRow}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        {item.error && <Text style={styles.error} numberOfLines={1}>{item.error}</Text>}
      </View>
      {item.status === 'failed' && onRetry && (
        <TouchableOpacity onPress={() => onRetry(item.id)} style={styles.retryBtn}>
          <Ionicons name="refresh" size={20} color={colors.orange} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  retryBtn: {
    padding: spacing.sm,
  },
});
```

- [ ] **Step 2: Build EmptyUploads component**

`src/components/uploads/EmptyUploads.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export function EmptyUploads() {
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-upload-outline" size={64} color={colors.textMuted} />
      <Text style={styles.title}>No Uploads Pending</Text>
      <Text style={styles.subtitle}>Photos you capture will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
```

- [ ] **Step 3: Build uploads tab screen**

`app/(tabs)/uploads.tsx`:
```typescript
import React from 'react';
import { FlatList } from 'react-native';
import { ScreenContainer } from '../../src/components/ui';
import { UploadListItem } from '../../src/components/uploads/UploadListItem';
import { EmptyUploads } from '../../src/components/uploads/EmptyUploads';
import { useUploads } from '../../src/context/UploadContext';
import { uploadQueue } from '../../src/services/uploadQueue';

export default function UploadsScreen() {
  const { items, refresh } = useUploads();

  const handleRetry = async (id: string) => {
    await uploadQueue.updateStatus(id, 'pending');
    await refresh();
  };

  return (
    <ScreenContainer>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <UploadListItem item={item} onRetry={handleRetry} />
        )}
        ListEmptyComponent={EmptyUploads}
        onRefresh={refresh}
        refreshing={false}
      />
    </ScreenContainer>
  );
}
```

- [ ] **Step 4: Verify UI renders, commit**

```bash
npx expo start
```

Navigate to Uploads tab, verify empty state renders. Capture a photo from Camera tab, switch to Uploads, verify photo appears in the list.

```bash
git add -A
git commit -m "feat: add uploads tab with queue list and empty state"
```

---

### Task 11: Google Drive Upload Service

**Files:**
- Create: `src/services/cloudStorage/types.ts`
- Create: `src/services/cloudStorage/googleDrive.ts`
- Create: `src/services/cloudStorage/index.ts`
- Create: `src/services/uploadWorker.ts`
- Test: `src/services/cloudStorage/__tests__/googleDrive.test.ts`

- [ ] **Step 1: Define cloud storage interface**

`src/services/cloudStorage/types.ts`:
```typescript
export interface CloudFolder {
  id: string;
  name: string;
  path: string;
}

export interface CloudFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

export interface CloudStorageProvider {
  listFolders(parentId: string, accessToken: string): Promise<CloudFolder[]>;
  createFolder(name: string, parentId: string, accessToken: string): Promise<CloudFolder>;
  uploadFile(
    localUri: string,
    fileName: string,
    mimeType: string,
    folderId: string,
    accessToken: string,
  ): Promise<CloudFile>;
}
```

- [ ] **Step 2: Write failing test for Google Drive upload**

`src/services/cloudStorage/__tests__/googleDrive.test.ts`:
```typescript
import { googleDrive } from '../googleDrive';

// Mock fetch
global.fetch = jest.fn();
jest.mock('expo-file-system', () => ({
  uploadAsync: jest.fn().mockResolvedValue({ status: 200, body: '{"id":"file-1","name":"photo.jpg","mimeType":"image/jpeg"}' }),
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));

describe('googleDrive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists folders in a parent folder', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        files: [
          { id: 'f1', name: 'Folder A', mimeType: 'application/vnd.google-apps.folder' },
        ],
      }),
    });

    const folders = await googleDrive.listFolders('root', 'test-token');
    expect(folders).toHaveLength(1);
    expect(folders[0].name).toBe('Folder A');
  });

  it('uploads a file via resumable upload', async () => {
    // Mock the init request (returns upload URI in Location header)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: (key: string) => key === 'Location' ? 'https://upload.googleapis.com/resumable/123' : null },
    });

    const result = await googleDrive.uploadFile(
      'file:///photo.jpg', 'photo.jpg', 'image/jpeg', 'folder-1', 'test-token'
    );
    expect(result.id).toBe('file-1');
  });
});
```

- [ ] **Step 3: Run test, verify fail**

```bash
npx jest src/services/cloudStorage/__tests__/googleDrive.test.ts --no-coverage
```

- [ ] **Step 4: Implement Google Drive service**

`src/services/cloudStorage/googleDrive.ts`:
```typescript
import * as FileSystem from 'expo-file-system';
import type { CloudStorageProvider, CloudFolder, CloudFile } from './types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export const googleDrive: CloudStorageProvider = {
  async listFolders(parentId: string, accessToken: string): Promise<CloudFolder[]> {
    const query = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const res = await fetch(
      `${DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&orderBy=name`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
    const data = await res.json();
    return data.files.map((f: any) => ({ id: f.id, name: f.name, path: f.name }));
  },

  async createFolder(name: string, parentId: string, accessToken: string): Promise<CloudFolder> {
    const res = await fetch(`${DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });
    if (!res.ok) throw new Error(`Drive API error: ${res.status}`);
    const data = await res.json();
    return { id: data.id, name: data.name, path: data.name };
  },

  async uploadFile(localUri, fileName, mimeType, folderId, accessToken): Promise<CloudFile> {
    // Step 1: Create file metadata to get an upload URI (resumable upload)
    const initRes = await fetch(
      `${UPLOAD_API}/files?uploadType=resumable&fields=id,name,mimeType,webViewLink`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
        },
        body: JSON.stringify({ name: fileName, parents: [folderId] }),
      }
    );
    if (!initRes.ok) throw new Error(`Drive init error: ${initRes.status}`);
    const uploadUri = initRes.headers.get('Location');
    if (!uploadUri) throw new Error('No upload URI returned');

    // Step 2: Upload file content using expo-file-system (handles binary properly)
    const uploadResult = await FileSystem.uploadAsync(uploadUri, localUri, {
      httpMethod: 'PUT',
      headers: { 'Content-Type': mimeType },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(`Upload error: ${uploadResult.status}`);
    }
    return JSON.parse(uploadResult.body);
  },
};
```

`src/services/cloudStorage/index.ts`:
```typescript
export { googleDrive } from './googleDrive';
export type { CloudStorageProvider, CloudFolder, CloudFile } from './types';
```

- [ ] **Step 5: Run test, verify pass**

```bash
npx jest src/services/cloudStorage/__tests__/googleDrive.test.ts --no-coverage
```

- [ ] **Step 6: Implement upload worker**

`src/services/uploadWorker.ts`:
```typescript
import { uploadQueue } from './uploadQueue';
import { googleDrive } from './cloudStorage/googleDrive';
import { secureStorage } from './secureStorage';
import type { UploadItem } from '../types/upload';

let isProcessing = false;

export async function processUploadQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const pending = await uploadQueue.getPending();
    for (const item of pending) {
      if (item.retryCount >= 5) continue; // max retries
      await processItem(item);
    }
  } finally {
    isProcessing = false;
  }
}

async function processItem(item: UploadItem): Promise<void> {
  try {
    await uploadQueue.updateStatus(item.id, 'uploading');

    const accessToken = await secureStorage.getToken(item.provider);
    if (!accessToken) {
      await uploadQueue.updateStatus(item.id, 'failed', 'Not authenticated');
      return;
    }

    // Currently only Google Drive; OneDrive/Dropbox added later
    const result = await googleDrive.uploadFile(
      item.localUri,
      item.fileName,
      item.mimeType,
      item.folderId,
      accessToken,
    );

    await uploadQueue.updateStatus(item.id, 'completed', undefined, result.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await uploadQueue.updateStatus(item.id, 'failed', message);
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Google Drive upload service and upload worker"
```

---

## Phase 6: Processing Profiles

### Task 12: Processing Profiles Service

**Files:**
- Create: `src/services/profileService.ts`
- Create: `src/types/profile.ts`
- Test: `src/services/__tests__/profileService.test.ts`

- [ ] **Step 1: Define profile types**

`src/types/profile.ts`:
```typescript
export type DeliveryType = 'same_folder' | 'different_folder' | 'email' | 'both';

export interface ProcessingProfile {
  id: string;
  name: string;
  description: string | null;
  promptTemplate: string;
  deliveryType: DeliveryType;
  deliveryDestination: string | null;
  isActive: boolean;
  isTeam: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Write failing test**

`src/services/__tests__/profileService.test.ts`:
```typescript
import { profileService } from '../profileService';

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  closeAsync: jest.fn(),
};

jest.mock('../../db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue(mockDb),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'profile-uuid' }));

describe('profileService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a profile', async () => {
    const id = await profileService.create({
      name: 'Poster Summary',
      promptTemplate: 'Summarize: {{extracted_text}}',
      deliveryType: 'same_folder',
    });
    expect(id).toBe('profile-uuid');
    expect(mockDb.runAsync).toHaveBeenCalled();
  });

  it('lists all profiles', async () => {
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: '1', name: 'Test', is_active: 1, is_team: 0, is_locked: 0 },
    ]);
    const profiles = await profileService.getAll();
    expect(profiles).toHaveLength(1);
  });

  it('seeds default profiles', async () => {
    mockDb.getFirstAsync.mockResolvedValueOnce({ count: 0 });
    await profileService.seedDefaults();
    expect(mockDb.runAsync).toHaveBeenCalledTimes(3); // 3 default profiles
  });
});
```

- [ ] **Step 3: Run test, verify fail**

```bash
npx jest src/services/__tests__/profileService.test.ts --no-coverage
```

- [ ] **Step 4: Implement profileService**

`src/services/profileService.ts`:
```typescript
import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';
import type { ProcessingProfile, DeliveryType } from '../types/profile';

interface CreateProfileParams {
  name: string;
  description?: string;
  promptTemplate: string;
  deliveryType: DeliveryType;
  deliveryDestination?: string;
}

function rowToProfile(row: any): ProcessingProfile {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    promptTemplate: row.prompt_template,
    deliveryType: row.delivery_type,
    deliveryDestination: row.delivery_destination,
    isActive: !!row.is_active,
    isTeam: !!row.is_team,
    isLocked: !!row.is_locked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profileService = {
  async create(params: CreateProfileParams): Promise<string> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO processing_profiles (id, name, description, prompt_template, delivery_type, delivery_destination)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, params.name, params.description ?? null,
      params.promptTemplate, params.deliveryType, params.deliveryDestination ?? null,
    );
    return id;
  },

  async getAll(): Promise<ProcessingProfile[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(`SELECT * FROM processing_profiles ORDER BY name`);
    return rows.map(rowToProfile);
  },

  async getActive(): Promise<ProcessingProfile[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(`SELECT * FROM processing_profiles WHERE is_active = 1 ORDER BY name`);
    return rows.map(rowToProfile);
  },

  async update(id: string, params: Partial<CreateProfileParams> & { isActive?: boolean }): Promise<void> {
    const db = await getDatabase();
    const sets: string[] = [];
    const values: any[] = [];
    if (params.name !== undefined) { sets.push('name = ?'); values.push(params.name); }
    if (params.description !== undefined) { sets.push('description = ?'); values.push(params.description); }
    if (params.promptTemplate !== undefined) { sets.push('prompt_template = ?'); values.push(params.promptTemplate); }
    if (params.deliveryType !== undefined) { sets.push('delivery_type = ?'); values.push(params.deliveryType); }
    if (params.deliveryDestination !== undefined) { sets.push('delivery_destination = ?'); values.push(params.deliveryDestination); }
    if (params.isActive !== undefined) { sets.push('is_active = ?'); values.push(params.isActive ? 1 : 0); }
    sets.push("updated_at = datetime('now')");
    values.push(id);
    await db.runAsync(`UPDATE processing_profiles SET ${sets.join(', ')} WHERE id = ?`, ...values);
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM processing_profiles WHERE id = ? AND is_locked = 0`, id);
  },

  async seedDefaults(): Promise<void> {
    const db = await getDatabase();
    const row: any = await db.getFirstAsync(`SELECT COUNT(*) as count FROM processing_profiles`);
    if (row.count > 0) return;

    const defaults: CreateProfileParams[] = [
      {
        name: 'Poster Summary',
        description: 'Extracts key findings, methods, and conclusions from research posters',
        promptTemplate: `You are analyzing a research poster captured at a medical conference.\n\nExtracted text from the poster:\n{{extracted_text}}\n\nPlease provide:\n1. Title and authors\n2. Key objective/hypothesis\n3. Methods summary (2-3 sentences)\n4. Main findings\n5. Conclusions and clinical implications`,
        deliveryType: 'same_folder',
      },
      {
        name: 'Slide Notes',
        description: 'Converts slide content to structured notes',
        promptTemplate: `Convert the following slide content into structured notes.\n\nExtracted text:\n{{extracted_text}}\n\nProvide:\n- Main topic/title\n- Key bullet points\n- Any data or statistics mentioned\n- Speaker notes or context if apparent`,
        deliveryType: 'same_folder',
      },
      {
        name: 'Business Card',
        description: 'Extracts contact information from business cards',
        promptTemplate: `Extract contact information from this business card.\n\nExtracted text:\n{{extracted_text}}\n\nProvide in this format:\nName:\nTitle:\nCompany:\nEmail:\nPhone:\nAddress:\nWebsite:\nLinkedIn:`,
        deliveryType: 'same_folder',
      },
    ];

    for (const d of defaults) {
      await profileService.create(d);
    }
  },
};
```

- [ ] **Step 5: Run test, verify pass, commit**

```bash
npx jest src/services/__tests__/profileService.test.ts --no-coverage
git add -A
git commit -m "feat: add processing profile service with default templates"
```

---

### Task 13: Profiles Tab Screen

**Files:**
- Modify: `app/(tabs)/profiles.tsx`
- Create: `app/profile-editor.tsx` (modal screen)
- Create: `src/components/profiles/ProfileListItem.tsx`

- [ ] **Step 1: Build ProfileListItem**

`src/components/profiles/ProfileListItem.tsx`:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Toggle } from '../ui';
import type { ProcessingProfile } from '../../types/profile';

interface ProfileListItemProps {
  profile: ProcessingProfile;
  onPress: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

export function ProfileListItem({ profile, onPress, onToggle }: ProfileListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(profile.id)}>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.isTeam && (
            <View style={styles.teamBadge}>
              <Text style={styles.teamText}>Team</Text>
            </View>
          )}
          {profile.isLocked && <Ionicons name="lock-closed" size={14} color={colors.textMuted} />}
        </View>
        {profile.description && (
          <Text style={styles.description} numberOfLines={2}>{profile.description}</Text>
        )}
      </View>
      <Toggle
        label=""
        value={profile.isActive}
        onValueChange={(val) => onToggle(profile.id, val)}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.body, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  teamBadge: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  teamText: { ...typography.caption, color: colors.orange },
});
```

- [ ] **Step 2: Build profiles tab screen**

`app/(tabs)/profiles.tsx`:
```typescript
import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui';
import { ProfileListItem } from '../../src/components/profiles/ProfileListItem';
import { profileService } from '../../src/services/profileService';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import type { ProcessingProfile } from '../../src/types/profile';

export default function ProfilesScreen() {
  const [profiles, setProfiles] = useState<ProcessingProfile[]>([]);

  const loadProfiles = useCallback(async () => {
    await profileService.seedDefaults();
    const all = await profileService.getAll();
    setProfiles(all);
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const handleToggle = async (id: string, active: boolean) => {
    await profileService.update(id, { isActive: active });
    await loadProfiles();
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Processing Profiles</Text>
        <TouchableOpacity onPress={() => router.push('/profile-editor')}>
          <Ionicons name="add-circle" size={28} color={colors.orange} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={profiles}
        keyExtractor={p => p.id}
        renderItem={({ item }) => (
          <ProfileListItem
            profile={item}
            onPress={(id) => router.push(`/profile-editor?id=${id}`)}
            onToggle={handleToggle}
          />
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
});
```

- [ ] **Step 3: Build profile editor modal screen**

`app/profile-editor.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer, Button, SectionHeader } from '../src/components/ui';
import { profileService } from '../src/services/profileService';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import type { DeliveryType } from '../src/types/profile';

export default function ProfileEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('same_folder');
  const [deliveryDestination, setDeliveryDestination] = useState('');

  useEffect(() => {
    if (id) {
      (async () => {
        const all = await profileService.getAll();
        const profile = all.find(p => p.id === id);
        if (profile) {
          setName(profile.name);
          setDescription(profile.description ?? '');
          setPromptTemplate(profile.promptTemplate);
          setDeliveryType(profile.deliveryType);
          setDeliveryDestination(profile.deliveryDestination ?? '');
        }
      })();
    }
  }, [id]);

  const handleSave = async () => {
    if (!name.trim() || !promptTemplate.trim()) {
      Alert.alert('Error', 'Name and prompt template are required.');
      return;
    }
    if (isEditing) {
      await profileService.update(id!, { name, description, promptTemplate, deliveryType, deliveryDestination });
    } else {
      await profileService.create({ name, description, promptTemplate, deliveryType, deliveryDestination });
    }
    router.back();
  };

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert('Delete Profile', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await profileService.delete(id);
        router.back();
      }},
    ]);
  };

  return (
    <ScreenContainer scrollable>
      <ScrollView style={styles.form}>
        <SectionHeader title="Profile Details" />
        <TextInput style={styles.input} placeholder="Profile Name" placeholderTextColor={colors.textMuted}
          value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Description (optional)" placeholderTextColor={colors.textMuted}
          value={description} onChangeText={setDescription} />

        <SectionHeader title="Prompt Template" />
        <Text style={styles.hint}>
          Use {'{{extracted_text}}'}, {'{{timestamp}}'}, {'{{location}}'}, {'{{folder_name}}'} as variables.
        </Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Enter your prompt template..."
          placeholderTextColor={colors.textMuted} value={promptTemplate} onChangeText={setPromptTemplate}
          multiline numberOfLines={8} textAlignVertical="top" />

        <SectionHeader title="Delivery" />
        {(['same_folder', 'different_folder', 'email', 'both'] as DeliveryType[]).map(type => (
          <Button key={type} label={type.replace('_', ' ')} variant={deliveryType === type ? 'primary' : 'secondary'}
            onPress={() => setDeliveryType(type)} />
        ))}
        {(deliveryType === 'email' || deliveryType === 'both') && (
          <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={colors.textMuted}
            value={deliveryDestination} onChangeText={setDeliveryDestination} keyboardType="email-address" />
        )}

        <View style={styles.actions}>
          <Button label={isEditing ? 'Save Changes' : 'Create Profile'} onPress={handleSave} />
          {isEditing && (
            <>
              <View style={{ height: spacing.md }} />
              <Button label="Delete Profile" variant="ghost" onPress={handleDelete} />
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { padding: spacing.md },
  input: {
    backgroundColor: colors.bgCard,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
  },
  textArea: { minHeight: 160 },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  actions: { marginTop: spacing.lg, marginBottom: spacing.xxl },
});
```

- [ ] **Step 4: Add profile-editor to router config, commit**

Ensure `app/profile-editor.tsx` is picked up by expo-router as a modal. In `app/_layout.tsx`, add a `<Stack.Screen name="profile-editor" options={{ presentation: 'modal', title: 'Edit Profile' }} />` entry.

```bash
git add -A
git commit -m "feat: add processing profiles tab and editor screen"
```

---

## Phase 7: Settings Screen

### Task 14: Settings Screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Create: `src/services/settingsService.ts`
- Create: `src/hooks/useSettings.ts`

- [ ] **Step 1: Create settings service**

`src/services/settingsService.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'fieldcam_settings';

export interface AppSettings {
  uploadImmediately: boolean;
  uploadInBackground: boolean;
  uploadCellular: boolean;
  saveToDevice: boolean;
  saveOriginal: boolean;
  cameraGrid: boolean;
  cameraLevel: boolean;
  promptForDetails: boolean;
  annotationLocation: boolean;
  annotationTimestamp: boolean;
  annotationCustomText: string;
  defaultProfileId: string | null;
  autoProcess: boolean;
}

const DEFAULTS: AppSettings = {
  uploadImmediately: true,
  uploadInBackground: false,
  uploadCellular: true,
  saveToDevice: false,
  saveOriginal: false,
  cameraGrid: false,
  cameraLevel: false,
  promptForDetails: false,
  annotationLocation: true,
  annotationTimestamp: true,
  annotationCustomText: '',
  defaultProfileId: null,
  autoProcess: false,
};

export const settingsService = {
  async get(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  },

  async update(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await settingsService.get();
    const updated = { ...current, ...partial };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  },
};
```

- [ ] **Step 2: Create useSettings hook**

`src/hooks/useSettings.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { settingsService, type AppSettings } from '../services/settingsService';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    settingsService.get().then(setSettings);
  }, []);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = await settingsService.update({ [key]: value });
    setSettings(updated);
  }, []);

  return { settings, updateSetting };
}
```

- [ ] **Step 3: Build settings screen**

`app/(tabs)/settings.tsx`:
```typescript
import React from 'react';
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer, Toggle, SectionHeader } from '../../src/components/ui';
import { useSettings } from '../../src/hooks/useSettings';
import { useAuth } from '../../src/context/AuthContext';
import { uploadQueue } from '../../src/services/uploadQueue';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { settings, updateSetting } = useSettings();
  const { user, signOut } = useAuth();

  if (!settings) return null;

  const handleClearHistory = () => {
    Alert.alert('Clear Upload History', 'Remove all completed uploads from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => uploadQueue.clearHistory() },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView>
        <SectionHeader title="Account" />
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email ?? 'Not signed in'}</Text>
        </View>
        <TouchableOpacity style={styles.row} onPress={signOut}>
          <Text style={[styles.label, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <SectionHeader title="Upload" />
        <Toggle label="Upload immediately" value={settings.uploadImmediately}
          onValueChange={v => updateSetting('uploadImmediately', v)} />
        <Toggle label="Upload in background" value={settings.uploadInBackground}
          onValueChange={v => updateSetting('uploadInBackground', v)} />
        <Toggle label="Upload using cellular" value={settings.uploadCellular}
          onValueChange={v => updateSetting('uploadCellular', v)} />
        <Toggle label="Save to device" value={settings.saveToDevice}
          onValueChange={v => updateSetting('saveToDevice', v)} />
        <Toggle label="Save original image" value={settings.saveOriginal}
          description="Keep un-annotated copy"
          onValueChange={v => updateSetting('saveOriginal', v)} />

        <SectionHeader title="Camera" />
        <Toggle label="Camera grid" value={settings.cameraGrid}
          onValueChange={v => updateSetting('cameraGrid', v)} />
        <Toggle label="Camera level" value={settings.cameraLevel}
          onValueChange={v => updateSetting('cameraLevel', v)} />
        <Toggle label="Prompt for file details" value={settings.promptForDetails}
          onValueChange={v => updateSetting('promptForDetails', v)} />

        <SectionHeader title="Annotations" />
        <Toggle label="Location annotation" value={settings.annotationLocation}
          onValueChange={v => updateSetting('annotationLocation', v)} />
        <Toggle label="Timestamp annotation" value={settings.annotationTimestamp}
          onValueChange={v => updateSetting('annotationTimestamp', v)} />

        <SectionHeader title="AI Processing" />
        <Toggle label="Auto-process all photos" value={settings.autoProcess}
          description="Apply default profile to every capture"
          onValueChange={v => updateSetting('autoProcess', v)} />

        <SectionHeader title="Maintenance" />
        <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
          <Text style={styles.label}>Clear upload history</Text>
        </TouchableOpacity>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>
            FieldCam {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { ...typography.body, color: colors.textPrimary },
  value: { ...typography.bodySmall, color: colors.textSecondary },
  versionRow: { alignItems: 'center', padding: spacing.xl },
  versionText: { ...typography.caption, color: colors.textMuted },
});
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add settings screen with all toggles and preferences"
```

---

## Phase 8: Folder Picker & QR Scanner

### Task 15: Folder Picker Screen

**Files:**
- Create: `app/folder-picker.tsx`
- Create: `src/components/folders/FolderListItem.tsx`
- Create: `src/services/folderService.ts`

- [ ] **Step 1: Create folder service for managing folder state**

`src/services/folderService.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_FOLDER_KEY = 'fieldcam_current_folder';
const FAVORITES_KEY = 'fieldcam_favorite_folders';
const RECENTS_KEY = 'fieldcam_recent_folders';

export interface FolderInfo {
  id: string;
  name: string;
  provider: string;
}

export const folderService = {
  async getCurrentFolder(): Promise<FolderInfo | null> {
    const raw = await AsyncStorage.getItem(CURRENT_FOLDER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async setCurrentFolder(folder: FolderInfo): Promise<void> {
    await AsyncStorage.setItem(CURRENT_FOLDER_KEY, JSON.stringify(folder));
    await folderService.addToRecents(folder);
  },

  async getFavorites(): Promise<FolderInfo[]> {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async addFavorite(folder: FolderInfo): Promise<void> {
    const favs = await folderService.getFavorites();
    if (!favs.find(f => f.id === folder.id)) {
      favs.push(folder);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    }
  },

  async removeFavorite(folderId: string): Promise<void> {
    const favs = await folderService.getFavorites();
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favs.filter(f => f.id !== folderId)));
  },

  async getRecents(): Promise<FolderInfo[]> {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async addToRecents(folder: FolderInfo): Promise<void> {
    let recents = await folderService.getRecents();
    recents = recents.filter(f => f.id !== folder.id);
    recents.unshift(folder);
    recents = recents.slice(0, 10); // keep last 10
    await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  },
};
```

- [ ] **Step 2: Build FolderListItem**

`src/components/folders/FolderListItem.tsx`:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface FolderListItemProps {
  name: string;
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
}

export function FolderListItem({ name, onPress, onLongPress, isSelected }: FolderListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress}>
      <Ionicons name="folder" size={22} color={isSelected ? colors.orange : colors.textSecondary} />
      <Text style={[styles.name, isSelected && styles.selected]}>{name}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.md,
  },
  selected: { color: colors.orange },
});
```

- [ ] **Step 3: Build folder picker screen**

`app/folder-picker.tsx` - Full screen that shows:
- Current Upload Folder section
- Cloud storage browser (fetches folders from Google Drive via `googleDrive.listFolders`)
- Favorites section
- Recents section
- "Take Photos Here" FAB that calls `folderService.setCurrentFolder()` and navigates back

- [ ] **Step 4: Wire folder name display in camera top bar, commit**

Update `app/(tabs)/camera.tsx` to read the current folder from `folderService.getCurrentFolder()` and display it in `CameraTopBar`. Tapping the folder name navigates to `/folder-picker`.

```bash
git add -A
git commit -m "feat: add folder picker with favorites and recents"
```

---

### Task 16: QR Scanner Screen

**Files:**
- Create: `app/qr-scanner.tsx`
- Create: `src/services/qrCodeService.ts`

- [ ] **Step 1: Create QR code validation service**

`src/services/qrCodeService.ts`:
```typescript
import type { FolderInfo } from './folderService';

interface FieldCamQR {
  fieldcam: string;
  folder?: { provider: string; id: string; name: string };
  profile?: string;
}

export function parseFieldCamQR(data: string): FieldCamQR | null {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.fieldcam || typeof parsed.fieldcam !== 'string') return null;
    return parsed as FieldCamQR;
  } catch {
    return null;
  }
}

export function qrToFolderInfo(qr: FieldCamQR): FolderInfo | null {
  if (!qr.folder) return null;
  return { id: qr.folder.id, name: qr.folder.name, provider: qr.folder.provider };
}
```

- [ ] **Step 2: Build QR scanner screen**

`app/qr-scanner.tsx`:
```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { parseFieldCamQR, qrToFolderInfo } from '../src/services/qrCodeService';
import { folderService } from '../src/services/folderService';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const qr = parseFieldCamQR(data);
    if (!qr) {
      Alert.alert('Invalid QR Code', 'This QR code is not a FieldCam configuration code.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    const folder = qrToFolderInfo(qr);
    if (folder) {
      await folderService.setCurrentFolder(folder);
      Alert.alert('Folder Set', `Upload folder set to "${folder.name}".`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission needed for QR scanning.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanText}>Scanning for QR Codes...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
  },
  scanText: { ...typography.body, color: colors.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgPrimary, padding: spacing.xl },
  text: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add QR scanner with FieldCam code validation"
```

---

## Phase 9: Annotations

### Task 17: Photo Annotations

**Files:**
- Create: `src/services/annotationService.ts`
- Modify: `app/(tabs)/camera.tsx` (apply annotations before queuing)

- [ ] **Step 1: Implement annotation overlay service**

`src/services/annotationService.ts` - Uses `expo-image-manipulator` to overlay text (timestamp, GPS, custom text) onto captured photos. Reads settings from `settingsService` to determine which annotations are active.

```typescript
import * as Location from 'expo-location';
import { settingsService } from './settingsService';

export async function annotatePhoto(photoUri: string): Promise<string> {
  const settings = await settingsService.get();
  const parts: string[] = [];

  if (settings.annotationTimestamp) {
    parts.push(new Date().toLocaleString());
  }

  if (settings.annotationLocation) {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      parts.push(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
    } catch {
      // Location unavailable, skip
    }
  }

  if (settings.annotationCustomText) {
    parts.push(settings.annotationCustomText);
  }

  // For v1, annotations are stored as EXIF/metadata rather than burned into the image
  // Full text overlay rendering requires a canvas library (skia) which can be added later
  // For now, return the original photo URI and store annotations in the upload metadata

  return photoUri;
}

export async function getAnnotationText(): Promise<string> {
  const settings = await settingsService.get();
  const parts: string[] = [];

  if (settings.annotationTimestamp) {
    parts.push(new Date().toLocaleString());
  }

  if (settings.annotationLocation) {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      parts.push(`${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}`);
    } catch { /* skip */ }
  }

  if (settings.annotationCustomText) {
    parts.push(settings.annotationCustomText);
  }

  return parts.join(' | ');
}
```

- [ ] **Step 2: Wire annotation into camera capture flow, commit**

In `camera.tsx`, after `takePicture()`, call `annotatePhoto(photo.uri)` before enqueuing. Store the annotation text alongside the upload item.

```bash
git add -A
git commit -m "feat: add annotation service for photo metadata"
```

---

## Phase 10: Integration Testing & Polish

### Task 18: End-to-End Flow Test

**Files:**
- No new files; this is a manual integration test task

- [ ] **Step 1: Test full capture-to-upload flow**

1. Launch app on device/emulator
2. Sign in with Google
3. Select a folder from the folder picker
4. Take a photo
5. Verify photo appears in Upload Queue as "pending"
6. Verify photo uploads to Google Drive (check Drive)
7. Verify upload status changes to "completed"

- [ ] **Step 2: Test profile creation flow**

1. Go to Profiles tab
2. Verify 3 default profiles exist
3. Create a new profile with a custom prompt
4. Toggle a profile on/off
5. Edit an existing profile
6. Delete a profile

- [ ] **Step 3: Test settings persistence**

1. Change several settings (toggle grid, enable auto-process, etc.)
2. Kill and relaunch the app
3. Verify all settings are preserved

- [ ] **Step 4: Test QR scanner**

1. Generate a test QR code with FieldCam format JSON
2. Scan it from the QR scanner screen
3. Verify folder is set correctly

- [ ] **Step 5: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: address integration testing issues"
```

---

### Task 19: Tab Bar Styling & Final Polish

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Style the tab bar with FieldCam theme**

In `app/(tabs)/_layout.tsx`, customize the tab bar:
- Background: `colors.bgSecondary`
- Active tint: `colors.orange`
- Inactive tint: `colors.textMuted`
- Camera tab: larger icon, slightly raised
- Border top: `colors.border`

- [ ] **Step 2: Add status bar config**

In `app/_layout.tsx`, set `<StatusBar style="light" />` for the dark theme.

- [ ] **Step 3: Add upload badge to Uploads tab**

Show `pendingCount` as a badge number on the Uploads tab icon using the `tabBarBadge` option from expo-router tabs.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: polish tab bar styling and add upload badge"
```

---

## Phase 11: Backend API (Deferred)

> **Note:** The backend API for AI processing is a separate deployment. Tasks 20-22 cover the serverless backend. This can be built independently or in a follow-up plan.

### Task 20: Backend Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts` (Express or serverless handler entry)
- Create: `backend/src/routes/process.ts`
- Create: `backend/src/routes/profiles.ts`
- Create: `backend/src/services/ocr.ts`
- Create: `backend/src/services/llm.ts`
- Create: `backend/src/services/delivery.ts`

- [ ] **Step 1: Scaffold Node.js backend**

```bash
mkdir -p C:/Users/Justin/Desktop/fieldcam/backend
cd C:/Users/Justin/Desktop/fieldcam/backend
npm init -y
npm install express cors helmet
npm install --save-dev typescript @types/node @types/express ts-node nodemon
npx tsc --init --target es2020 --module commonjs --outDir dist --rootDir src --strict
```

- [ ] **Step 2: Create entry point with Express server**

`backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { processRouter } from './routes/process';
import { profilesRouter } from './routes/profiles';

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '25mb' }));

app.use('/v1/process', processRouter);
app.use('/v1/profiles', profilesRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`FieldCam API running on port ${PORT}`));
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Justin/Desktop/fieldcam
git add backend/
git commit -m "feat: scaffold backend API project"
```

---

### Task 21: OCR + LLM Processing Pipeline

**Files:**
- Create: `backend/src/services/ocr.ts`
- Create: `backend/src/services/llm.ts`
- Create: `backend/src/services/templateEngine.ts`
- Test: `backend/src/services/__tests__/templateEngine.test.ts`

- [ ] **Step 1: Write failing test for template engine**

`backend/src/services/__tests__/templateEngine.test.ts`:
```typescript
import { renderTemplate } from '../templateEngine';

describe('renderTemplate', () => {
  it('substitutes variables', () => {
    const result = renderTemplate('Hello {{name}}, text: {{extracted_text}}', {
      name: 'World',
      extracted_text: 'sample',
    });
    expect(result).toBe('Hello World, text: sample');
  });

  it('leaves unknown variables as-is', () => {
    const result = renderTemplate('{{known}} and {{unknown}}', { known: 'yes' });
    expect(result).toBe('yes and {{unknown}}');
  });
});
```

- [ ] **Step 2: Run test, verify fail, implement**

`backend/src/services/templateEngine.ts`:
```typescript
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}
```

- [ ] **Step 3: Implement OCR service**

`backend/src/services/ocr.ts`:
```typescript
export async function extractText(imageBase64: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY not set');

  const res = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION' }],
      }],
    }),
  });

  const data = await res.json();
  const textAnnotation = data.responses?.[0]?.textAnnotations?.[0];
  return textAnnotation?.description ?? '';
}
```

- [ ] **Step 4: Implement LLM service**

`backend/src/services/llm.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function processWithLLM(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find(b => b.type === 'text');
  return textBlock?.text ?? '';
}
```

- [ ] **Step 5: Run template test, commit**

```bash
cd C:/Users/Justin/Desktop/fieldcam/backend
npx jest src/services/__tests__/templateEngine.test.ts --no-coverage
cd C:/Users/Justin/Desktop/fieldcam
git add backend/
git commit -m "feat: add OCR, LLM, and template engine services"
```

---

### Task 22: Process Endpoint & Delivery

**Files:**
- Modify: `backend/src/routes/process.ts`
- Create: `backend/src/services/delivery.ts`

- [ ] **Step 1: Implement delivery service**

`backend/src/services/delivery.ts` - Handles uploading processed results to cloud storage (using the forwarded OAuth token) and/or sending via email (SendGrid).

- [ ] **Step 2: Implement POST /process endpoint**

`backend/src/routes/process.ts`:
```typescript
import { Router } from 'express';
import { extractText } from '../services/ocr';
import { processWithLLM } from '../services/llm';
import { renderTemplate } from '../services/templateEngine';
import { deliverResult } from '../services/delivery';

export const processRouter = Router();

processRouter.post('/', async (req, res) => {
  try {
    const { image, profile, destination, cloudToken } = req.body;

    // 1. OCR
    const extractedText = await extractText(image);

    // 2. Apply template
    const prompt = renderTemplate(profile.prompt, {
      extracted_text: extractedText,
      timestamp: new Date().toISOString(),
      location: req.body.location ?? '',
      folder_name: req.body.folderName ?? '',
    });

    // 3. LLM
    const result = await processWithLLM(prompt);

    // 4. Deliver
    await deliverResult({
      text: result,
      destination,
      cloudToken,
      fileName: `processed_${Date.now()}.txt`,
    });

    res.json({ status: 'completed', result: { text: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    res.status(500).json({ status: 'failed', error: message });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/
git commit -m "feat: add processing endpoint with OCR, LLM, and delivery"
```

---

## Summary

| Phase | Tasks | What it produces |
|-------|-------|-----------------|
| 1. Foundation | 1-2 | Running Expo app with tabs, theme, UI components |
| 2. Auth | 3-5 | Google OAuth login, secure token storage |
| 3. Camera | 6 | Camera screen with capture, flash, flip |
| 4. Local Storage | 7-9 | SQLite upload queue, camera-to-queue wiring |
| 5. Upload UI & Cloud | 10-11 | Uploads tab, Google Drive upload worker |
| 6. Profiles | 12-13 | Processing profiles CRUD with default templates |
| 7. Settings | 14 | Full settings screen with all toggles |
| 8. Folder & QR | 15-16 | Folder picker, QR scanner |
| 9. Annotations | 17 | GPS/timestamp/custom text annotations |
| 10. Polish | 18-19 | Integration testing, tab bar styling |
| 11. Backend | 20-22 | Serverless API with OCR + LLM pipeline |
