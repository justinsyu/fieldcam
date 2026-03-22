# OAuth Integration & App Icon Design Spec

## Goal

Add Firebase Auth (email/password, Google Sign-In, Apple Sign-In) as the identity layer, implement cloud storage linking for Google Drive, OneDrive, and Dropbox with full folder browsing and upload support, and create a branded app icon.

## Architecture Overview

The system separates **identity** (who you are) from **cloud storage** (where your photos go):

- **Identity layer:** Firebase Auth manages user accounts. Supports email/password, Google Sign-In, and Sign in with Apple. Firebase `uid` is the canonical user key.
- **Cloud storage layer:** After signing in, users link one or more cloud storage accounts (Google Drive, OneDrive, Dropbox). Each linked account stores OAuth tokens on-device. Users can browse all folders, create new folders, and upload to any folder across all linked providers.

This separation enables monetization (subscriptions tied to Firebase uid) and lets users upload to multiple cloud providers from a single FieldCam account.

---

## 1. Firebase Auth (Identity Layer)

### 1.1 Firebase Project Setup

- Create a Firebase project in the Firebase Console
- Enable Authentication with these sign-in methods: Email/Password, Google, Apple
- Register Android app (`com.fieldcam.app`) and iOS app (`com.fieldcam.app`)
- Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- Install `@react-native-firebase/app` and `@react-native-firebase/auth`

### 1.2 Sign-In Options

The login screen presents three options:

1. **Email/Password** - Standard Firebase email/password auth with create account flow
2. **Google Sign-In** - Uses `@react-native-google-signin/google-signin` for native flow, then `signInWithCredential` to Firebase. Google Drive scopes (`drive.file`, `drive.metadata.readonly`) are requested in the same `GoogleSignin.configure({ scopes: [...] })` call so the user sees one consent screen and the returned `accessToken` includes Drive access.
3. **Sign in with Apple** - Uses `expo-apple-authentication` on iOS, then `signInWithCredential` to Firebase. Required by Apple guideline 4.8 when Google Sign-In is present. **iOS only** - the Apple Sign-In button is hidden on Android.

### 1.3 Firebase Account Linking

If a user signs up with email/password and later signs in with Google using the same email, Firebase must link both credentials to the same account (not create a duplicate). `fetchSignInMethodsForEmail` is deprecated and disabled by default on new Firebase projects (email enumeration protection). Instead, handle the `auth/account-exists-with-different-credential` error in the sign-in callback: catch the error, extract the pending credential, sign in with the existing method, then call `linkWithCredential` to attach the new provider.

### 1.4 User Model

```typescript
interface FieldCamUser {
  uid: string;              // Firebase uid - canonical identifier
  email: string;            // Display only, not used as key
  displayName: string;
  initialAuthProvider: 'email' | 'google' | 'apple'; // Method used at first sign-up
  createdAt: string;
}
```

Note: `FieldCamUser` is an in-memory model populated from Firebase Auth state. It does NOT contain linked cloud accounts or tokens. Linked accounts are stored separately in `expo-secure-store` and loaded at runtime via `getLinkedAccounts()`. This prevents token data from leaking into any persisted user record.

### 1.5 Account Deletion

Apple App Review requires account deletion capability when account creation is offered. The Settings screen must include a "Delete Account" option that:
1. Calls `firebase.auth().currentUser.delete()` to remove the Firebase account
2. Clears all linked cloud accounts from secure storage (tokens only, does NOT delete cloud files)
3. Clears all local data (upload queue, settings, favorites)
4. Shows a confirmation dialog before proceeding ("This will permanently delete your FieldCam account. Your cloud storage files will not be affected.")
5. Redirects to the login screen

### 1.6 Backend Identity

The existing Express backend (`backend/`) currently has NO authentication. As part of this work:

- Install `firebase-admin` SDK in the backend
- Add auth middleware that verifies Firebase ID tokens from the `Authorization: Bearer <token>` header
- Extract `uid` from verified token and use it as the canonical user key
- Apply middleware to all API routes (`/v1/process`, `/v1/profiles`)
- Email is never used as an identifier in backend logic

### 1.7 Development Build Requirement

`@react-native-google-signin/google-signin` and native Apple Sign-In cannot run in Expo Go. A custom development build is required:

```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

The project transitions from Expo Go to development builds as part of this work.

---

## 2. Cloud Storage Linking (Storage Layer)

### 2.1 Linked Account Model

```typescript
interface LinkedCloudAccount {
  provider: CloudProvider;        // 'google' | 'microsoft' | 'dropbox'
  email: string;                  // Cloud account email (may differ from Firebase email)
  accessToken: string;
  refreshToken: string;
  expiresAt: number;              // Unix timestamp
  linkedAt: string;               // ISO date
}
```

### 2.2 Token Storage & Refresh

- All provider tokens stored on-device in `expo-secure-store`
- Storage key pattern: `fieldcam_cloud_{provider}` stores the full `LinkedCloudAccount` as JSON
- A `getValidAccessToken(provider)` function checks `expiresAt` before each API call:
  - If token is valid (>5 min remaining), return it
  - If expired, refresh using provider-specific strategy:
    - **Google:** Call `GoogleSignin.getTokens()` or `GoogleSignin.signInSilently()` (library-managed refresh, no manual HTTP call)
    - **Microsoft:** Call `https://login.microsoftonline.com/common/oauth2/v2.0/token` with stored `refreshToken`
    - **Dropbox:** Call `https://api.dropboxapi.com/oauth2/token` with stored `refreshToken`
  - Update secure storage with new token
  - If refresh fails, mark account as disconnected, prompt user to re-link
- V1 is on-device only. If server-side uploads are added later, tokens move to an encrypted backend store with revoke/unlink UX.
- **One account per provider.** V1 supports linking at most one Google Drive, one OneDrive, and one Dropbox account. The storage key `fieldcam_cloud_{provider}` enforces this constraint.

### 2.3 Google Drive

**OAuth flow:** When user signs in with Google via Firebase, Drive scopes are requested in the same `GoogleSignin.configure({ scopes: [...] })` call (one consent screen, same account guaranteed). When user signs in with email/Apple, Google Drive is linked separately by calling `GoogleSignin.signIn()` with Drive scopes but WITHOUT exchanging the credential with Firebase (Drive-only linking). In both cases, `@react-native-google-signin/google-signin` is used - no separate OAuth client strategy is needed.

**Scopes:**
- `drive` - Full read/write access to all Drive files and folders (covers browsing, folder creation, and uploads anywhere)

**Restricted scope compliance:** `drive` is classified as a restricted scope by Google. This requires:
1. Google OAuth verification for public app distribution
2. A third-party security assessment (CASA Tier 2 or equivalent)
3. A privacy policy and limited use disclosure

This is the correct scope for UploadCam parity (full folder browsing + folder creation + upload anywhere). Narrower scopes like `drive.file` + `drive.metadata.readonly` were considered but `drive.metadata.readonly` is also restricted, and `drive.file` does not reliably support folder creation in arbitrary user folders. Since restricted-scope compliance is unavoidable for full browsing, we use `drive` directly and accept the compliance path.

**Google token model (different from Microsoft/Dropbox):** The `@react-native-google-signin/google-signin` library manages token refresh internally. Do NOT store a Google refresh token on-device or call `oauth2.googleapis.com/token` directly. Instead:
- Call `GoogleSignin.getTokens()` to get the current `accessToken`
- If the token is expired, call `GoogleSignin.signInSilently()` which refreshes it automatically
- The `LinkedCloudAccount` for Google stores the `accessToken` and `expiresAt` as a cache, but refresh is always handled via the library, not via a manual HTTP refresh call
- This differs from Microsoft/Dropbox which store refresh tokens and call token endpoints directly

**Capabilities:** Browse all folders, create new folders anywhere, upload photos to any folder. Full UploadCam parity.

**Client setup:**
- Register an Android OAuth client in Google Cloud Console with package name `com.fieldcam.app` and SHA-1 signing certificate fingerprint
- Register an iOS OAuth client with bundle ID `com.fieldcam.app`
- Register a Web OAuth client (used by Firebase Auth for the Google Sign-In credential exchange)

### 2.4 Microsoft OneDrive

**OAuth flow:** Always a separate linking flow (not part of Firebase identity). Uses Microsoft Identity Platform v2.0 with PKCE.

**Scopes:**
- `Files.ReadWrite` - Read/write access to the signed-in user's personal OneDrive files and folders
- `User.Read` - Read user profile (email, display name)
- `offline_access` - Obtain refresh tokens

`Files.ReadWrite` (without `.All`) covers personal OneDrive only, not SharePoint or shared organizational content. This is sufficient for v1 and matches UploadCam parity.

**Capabilities:** Browse all personal OneDrive folders, create new folders, upload photos to any folder.

**Redirect URIs (MSAL format):**
- Android: `msauth://com.fieldcam.app/<signature_hash>`
- iOS: `msauth.com.fieldcam.app://auth`

**Client setup:**
- Register app in Microsoft Entra ID (Azure AD) portal
- Set platform to "Mobile and desktop applications"
- Configure the MSAL-format redirect URIs above
- Use `react-native-msal` (community-maintained, stable, wraps native MSAL). Validate compatibility with Expo SDK 55 / React Native 0.83 during implementation.

### 2.5 Dropbox

**OAuth flow:** Always a separate linking flow. Uses Dropbox OAuth 2.0 with PKCE.

**Scopes (configured in Dropbox App Console for v1; Dropbox also supports per-authorization scope requests via the `scope` parameter in the auth URL, which can be used for incremental permissions in future versions):**
- `files.content.write` - Upload files, create folders
- `files.content.read` - Read file content (for previews if needed)
- `files.metadata.read` - List folders and file metadata
- `account_info.read` - Read account email and display name

**Access type:** "Full Dropbox" (not "App folder") to allow browsing and uploading to any folder.

**Auth parameters:** Must include `token_access_type=offline` to receive refresh tokens.

**Capabilities:** Browse all Dropbox folders, create new folders, upload photos to any folder.

**Redirect URI:** `fieldcam://oauth/dropbox` (Dropbox still supports custom URI schemes)

**Library:** Use `expo-auth-session` (already a project dependency) for the Dropbox OAuth flow. Dropbox uses standard OAuth 2.0, no native SDK required.

**Client setup:**
- Register app in the Dropbox App Console
- Choose "Full Dropbox" access type
- Enable the scopes listed above in the Permissions tab
- Set redirect URI to `fieldcam://oauth/dropbox`

### 2.6 Token Refresh Strategy

`tokenRefresh.ts` handles provider-specific refresh:
- **Google:** Delegates to `GoogleSignin.getTokens()` / `GoogleSignin.signInSilently()`. No HTTP call. No stored refresh token.
- **Microsoft:** `POST https://login.microsoftonline.com/common/oauth2/v2.0/token` with stored `refreshToken` and `grant_type=refresh_token`
- **Dropbox:** `POST https://api.dropboxapi.com/oauth2/token` with stored `refreshToken` and `grant_type=refresh_token`

### 2.7 Disconnected Account UX

When a token refresh fails (revoked access, expired refresh token):
- Mark the account as `disconnected` in secure storage
- Show an inline warning banner in the Settings cloud accounts section: "[Provider] disconnected - tap to reconnect"
- Show a badge on the Settings tab icon
- If the user tries to upload to a disconnected provider, show an alert prompting them to reconnect in Settings
- Reconnecting triggers a fresh OAuth flow for that provider

---

## 3. Cloud Storage Provider Interface

### 3.1 Existing Interface (no changes)

The existing `CloudStorageProvider` interface in `src/services/cloudStorage/types.ts` already supports the needed operations:

```typescript
interface CloudStorageProvider {
  listFolders(parentId: string, accessToken: string): Promise<CloudFolder[]>;
  createFolder(name: string, parentId: string, accessToken: string): Promise<CloudFolder>;
  uploadFile(localUri: string, fileName: string, mimeType: string, folderId: string, accessToken: string): Promise<CloudFile>;
}
```

### 3.2 New Provider Implementations

- `src/services/cloudStorage/oneDrive.ts` - Implements `CloudStorageProvider` using Microsoft Graph API (`https://graph.microsoft.com/v1.0/me/drive`). The `CloudFolder.path` field should be populated from the `parentReference.path` property in the Graph API response.
- `src/services/cloudStorage/dropbox.ts` - Implements `CloudStorageProvider` using Dropbox API v2 (`https://api.dropboxapi.com/2`). The `CloudFolder.path` field should be populated from the `.path_display` property. Root folder ID is `""` (empty string), not `"root"`.

### 3.3 Provider Registry

A new `src/services/cloudStorage/registry.ts` provides:

```typescript
function getProvider(provider: CloudProvider): CloudStorageProvider;
function getValidAccessToken(provider: CloudProvider): Promise<string>;
```

The upload worker and folder picker call `getProvider()` instead of hardcoding `googleDrive`.

---

## 4. Refactoring Existing Code

### 4.1 AuthContext.tsx

- Replace custom auth state with Firebase Auth listener (`onAuthStateChanged`)
- User model changes from email-based ID to Firebase `uid`
- Remove `signIn(provider)` method; replace with `signInWithEmail`, `signInWithGoogle`, `signInWithApple`
- Add `linkCloudAccount(provider)` and `unlinkCloudAccount(provider)` methods
- Expose `linkedAccounts` from context

### 4.2 secureStorage.ts

- Keep for cloud storage tokens (not Firebase tokens - Firebase manages its own)
- Store full `LinkedCloudAccount` JSON objects, not raw access tokens
- New key pattern: `fieldcam_cloud_{provider}` for linked account data
- Add `saveCloudAccount`, `getCloudAccount`, `deleteCloudAccount` methods

### 4.3 uploadWorker.ts

- Replace hardcoded `googleDrive.uploadFile()` (line 30) with `getProvider(item.provider).uploadFile()`
- Replace hardcoded `secureStorage.getToken(item.provider)` (line 25) with `getValidAccessToken(item.provider)` from the provider registry
- Both the token lookup and upload call are currently Google-specific and need updating

### 4.4 folder-picker.tsx

- Add provider selector (Google Drive / OneDrive / Dropbox) at top of picker
- Only show providers the user has linked
- Pass selected provider to `listFolders`, `createFolder` calls via registry
- Remove hardcoded `'google'` provider references
- Root folder ID varies by provider: `'root'` for Google Drive, `'root'` for OneDrive, `''` (empty string) for Dropbox

### 4.5 login.tsx

- Replace three cloud provider buttons with: Email/Password form, Google Sign-In button, Sign in with Apple button
- Add "Connect Cloud Storage" section in Settings (not login) for linking Drive/OneDrive/Dropbox
- Dev mode bypass remains for development but must be updated to create a mock `FieldCamUser` with `uid` and `initialAuthProvider`. No `linkedAccounts` field (cloud accounts are stored separately in secure storage, not on the user model)

### 4.6 types/auth.ts

- Replace `CloudAccount` with `LinkedCloudAccount`
- Replace `User` with `FieldCamUser`
- Keep `CloudProvider` type as-is

---

## 5. UI Changes

### 5.1 Login Screen

- Email/password fields with "Create Account" / "Sign In" toggle
- "Sign in with Google" button (Ionicons `logo-google`)
- "Sign in with Apple" button (Ionicons `logo-apple`); shown on iOS only
- FieldCam branding (camera icon + name) above the form
- Dark theme matching existing design language

### 5.2 Settings Screen - Cloud Accounts Section

New section in Settings for managing linked cloud storage:

- List of linked accounts showing provider icon, email, and "Disconnect" button
- "Connect Google Drive" / "Connect OneDrive" / "Connect Dropbox" buttons for unlinked providers
- When Google Sign-In was used for identity and Drive was linked automatically, show it but note it was auto-linked

### 5.3 Folder Picker - Provider Selector

- Horizontal pill/tab selector at top: Google Drive | OneDrive | Dropbox
- Only shows providers the user has linked
- Switching provider resets the folder browser to that provider's root
- Each provider maintains its own favorites and recents (provider field already exists in `FolderInfo`)

---

## 6. App Icon

### 6.1 Design

- **Style:** Bold orange gradient background (`#DA532C` to `#E8764F`, 135-degree angle)
- **Mark:** Large white camera icon filling most of the icon space, with a navy (`#152455`) lens center and orange accent dot
- **Shape:** Follows platform conventions (rounded square on iOS, adaptive icon on Android)

### 6.2 Asset Generation

Generate the following files:

| File | Size | Purpose |
|------|------|---------|
| `assets/images/icon.png` | 1024x1024 | Main app icon (iOS + store listing) |
| `assets/images/android-icon-foreground.png` | 1024x1024 | Android adaptive icon foreground (camera on transparent) |
| `assets/images/android-icon-background.png` | 1024x1024 | Android adaptive icon background (orange gradient) |
| `assets/images/android-icon-monochrome.png` | 1024x1024 | Android monochrome icon (camera silhouette) |
| `assets/images/splash-icon.png` | 512x512 | Splash screen icon |
| `assets/images/favicon.png` | 48x48 | Web favicon |

### 6.3 app.json Updates

Update the adaptive icon background color and add required plugins for the development build:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#DA532C"
      },
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "plugins": [
      "expo-router",
      "expo-sqlite",
      "expo-secure-store",
      "expo-web-browser",
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication"
    ]
  }
}
```

---

## 7. File Structure

### New Files
- `src/services/oauth/google.ts` - Google Sign-In for Firebase + Drive linking
- `src/services/oauth/microsoft.ts` - Microsoft OAuth for OneDrive linking
- `src/services/oauth/dropbox.ts` - Dropbox OAuth for storage linking
- `src/services/oauth/tokenRefresh.ts` - Shared token refresh logic with provider-specific endpoints
- `src/services/oauth/index.ts` - Provider router
- `src/services/cloudStorage/oneDrive.ts` - OneDrive `CloudStorageProvider` implementation
- `src/services/cloudStorage/dropbox.ts` - Dropbox `CloudStorageProvider` implementation
- `src/services/cloudStorage/registry.ts` - Provider registry with `getProvider()` and `getValidAccessToken()`
- `backend/src/middleware/auth.ts` - Firebase ID token verification middleware

### Modified Files
- `src/context/AuthContext.tsx` - Firebase Auth integration
- `src/services/secureStorage.ts` - Store full `LinkedCloudAccount` objects
- `src/services/uploadWorker.ts` - Provider-aware upload routing
- `src/types/auth.ts` - Updated types
- `app/(auth)/login.tsx` - Email/Google/Apple sign-in
- `app/folder-picker.tsx` - Provider selector, remove Google hardcoding
- `app/(tabs)/settings.tsx` - Cloud accounts management section
- `backend/package.json` - Add `firebase-admin` dependency
- `backend/src/index.ts` - Apply auth middleware to routes
- `backend/src/routes/process.ts` - Access `req.uid` from verified token
- `app.json` - Firebase plugin config, updated icon references
- `assets/images/*` - New icon assets

### Deleted Files
- `src/services/oauth.ts` - Replaced by `src/services/oauth/` directory

---

## 8. Security Considerations

- Firebase ID tokens verified server-side via `firebase-admin` SDK
- Provider refresh tokens stored only on-device in `expo-secure-store` (v1)
- PKCE used for all OAuth flows (Google handled natively, Microsoft/Dropbox explicit)
- No provider tokens transmitted to backend in v1
- Google `drive.file` + `drive.metadata.readonly` avoids restricted scope compliance
- Dropbox uses `token_access_type=offline` for refresh token support

---

## 9. Testing Strategy

- Unit tests for token refresh logic (mock secure storage, mock provider endpoints)
- Unit tests for OneDrive and Dropbox `CloudStorageProvider` implementations
- Unit tests for provider registry routing
- Integration test: Firebase Auth sign-in flow (requires dev build + emulator)
- Integration test: Link cloud account, browse folders, upload photo
- Manual test: Account linking (email sign-up, then Google sign-in with same email)

---

## 10. Out of Scope (v1)

- Server-side token storage and background uploads
- SharePoint / M365 organizational content (Microsoft `Files.ReadWrite.All`)
- Team/admin features and locked profiles
- AI processing pipeline integration
- Subscription/payment gating
