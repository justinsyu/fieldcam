# FieldCam - Project Instructions

## Project Overview

FieldCam is a React Native (Expo SDK 53) field photography app that captures photos and uploads them to cloud storage (Google Drive, OneDrive, Dropbox). Built with Expo Router, Firebase Auth, and expo-sqlite for local persistence.

## Architecture

- **App framework**: React Native with Expo Router (file-based routing under `app/`)
- **Auth**: Firebase Auth (email/password, Google Sign-In, Apple Sign-In) via `src/context/AuthContext.tsx`
- **Cloud storage**: Provider pattern — `src/services/cloudStorage/registry.ts` maps `google|microsoft|dropbox` to provider implementations
- **Upload pipeline**: Camera capture → `uploadQueue.enqueue()` (SQLite) → `UploadContext` auto-triggers → `uploadWorker.processUploadQueue()` → provider `uploadFile()`
- **Theme system**: Custom theme context with light/dark mode variants and user-created themes via `src/context/ThemeContext.tsx`
- **State management**: React Context (AuthContext, UploadContext, ThemeContext)

## Key Technical Details

### Google Sign-In API (v13+)
- `GoogleSignin.signIn()` returns `SignInResponse = { type: 'success', data: User } | { type: 'cancelled', data: null }`
- `GoogleSignin.getCurrentUser()` returns `User | null` directly (NOT wrapped in `data`)
- `User` shape: `{ user: { id, name, email, photo, ... }, scopes: string[] }`
- Access email via: `signInResult.data?.user.email` (from signIn) vs `getCurrentUser()?.user.email` (from getCurrentUser)

### Google Drive Upload
- Uses resumable upload protocol (POST to init session → PUT binary content)
- `FileSystem.uploadAsync` returns `{ status, body, headers }` — NOT a `Response` object. Must check `uploadResult.status` manually (not `.ok`).
- Token scopes are configured in `AuthContext.tsx` via `GoogleSignin.configure({ scopes: [...] })`
- The Drive API must be enabled in the GCP project (project ID: 818851133596)

### Upload Queue (SQLite)
- Items flow through statuses: `pending` → `uploading` → `completed` or `failed`
- `getPending()` returns `pending`, `failed`, AND `uploading` items (to handle crash recovery)
- `retryCount >= 5` causes items to be skipped by the worker
- `resetForRetry()` resets both status and retryCount

### expo-file-system
- Import via `expo-file-system/legacy` for the classic API (uploadAsync, readAsStringAsync, etc.)

## Testing

```bash
npx jest --no-coverage   # Run all tests (52 tests, 12 suites)
npx tsc --noEmit         # TypeScript check
```

- Tests require `@react-native-async-storage/async-storage` mock in `jest.setup.js`
- UI component tests need `ThemeProvider` wrapper (see `renderWithTheme` helper in Button tests)
- Profile service tests use array-based `deliveryType` format (e.g., `['email']` not `'email'`)

## Android Development

```bash
adb devices                              # Check emulator
adb exec-out screencap -p > /tmp/s.png   # Screenshot
adb logcat -d | grep ReactNativeJS       # JS console logs
adb shell input keyevent 82              # Open RN dev menu
```

- App package name: `com.fieldcam.app`
- SQLite DB location: `files/SQLite/fieldcam.db` (inside app data dir)
- GCP project: `fieldcam-2a659` (numeric ID: `818851133596`)

## Common Pitfalls

- Google Cloud APIs must be explicitly enabled per-project. The Drive scope on the OAuth token is not sufficient — `drive.googleapis.com` must also be enabled in the GCP Console.
- `FileSystem.uploadAsync` does NOT throw on HTTP errors. Always check `uploadResult.status` before parsing the body.
- Items stuck in `'uploading'` status (from app crashes) need to be included in retry queries or they become permanently stuck.
- Microsoft and Dropbox client IDs in `tokenRefresh.ts` are placeholders (`'__MICROSOFT_CLIENT_ID__'` etc.) — only Google is functional.
