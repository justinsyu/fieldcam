# FieldCam Remaining Tasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the FieldCam app by wiring up the upload pipeline, fixing broken tests, polishing UI for theme awareness, and preparing the backend for deployment.

**Architecture:** The upload worker exists but is never called — it needs to be triggered from the UploadContext. The backend API is functional but has no deployment config. Test failures are due to missing mocks. UI polish items (StatusBar, notification permissions) are small fixes.

**Tech Stack:** React Native (Expo SDK 55), TypeScript, expo-sqlite, Firebase Auth, Google Drive API, Express.js backend

---

## Phase 1: Critical — Upload Pipeline (uploads actually work)

### Task 1: Wire Upload Worker into UploadContext

The upload worker (`src/services/uploadWorker.ts`) has a `processUploadQueue()` function that iterates pending uploads and calls provider-specific upload methods. It is never called anywhere. We need the UploadContext to trigger it.

**Files:**
- Modify: `src/context/UploadContext.tsx`
- Modify: `src/services/uploadWorker.ts` (if needed for API compatibility)

- [ ] **Step 1: Read UploadContext and uploadWorker to understand their interfaces**

Read both files. The UploadContext manages `items` state and a `refresh()` function. The upload worker has `processUploadQueue()`. Understand what arguments each needs.

- [ ] **Step 2: Add upload trigger to UploadContext**

In `UploadContext.tsx`:
- Import `processUploadQueue` from the upload worker
- Add an `uploadPending` function that calls `processUploadQueue()` then calls `refresh()` to update the UI
- Call `uploadPending()` automatically when new items are enqueued (listen for items with status 'pending')
- Add a `useEffect` that runs `uploadPending()` on mount if there are pending items
- Expose `uploadPending` in the context value so the Uploads screen can trigger manual retry

- [ ] **Step 3: Add manual "Upload Now" trigger to Uploads screen**

In `app/(tabs)/uploads.tsx`, add a "Retry All" button (visible when there are pending items) that calls the `uploadPending()` function from UploadContext.

- [ ] **Step 4: Test on device**

Take a photo, switch to Uploads tab, verify the item moves from "Pending" to "Uploading" to "Completed" (or "Failed" with error). Check Google Drive for the uploaded file.

- [ ] **Step 5: Commit**

```bash
git add src/context/UploadContext.tsx app/(tabs)/uploads.tsx
git commit -m "feat: wire upload worker into UploadContext for automatic uploads"
```

---

### Task 2: Handle Upload Errors Gracefully

**Files:**
- Modify: `src/services/uploadWorker.ts`
- Modify: `src/components/uploads/UploadListItem.tsx`

- [ ] **Step 1: Ensure uploadWorker catches per-item errors**

Read `uploadWorker.ts`. Verify that if one upload fails, it doesn't stop the entire queue. Each item should be individually try/caught and its status set to 'failed' with an error message stored.

- [ ] **Step 2: Show error details in UploadListItem**

If an upload item has status 'failed', show the error message in the list item UI as a caption below the status. Add a "Retry" button inline.

- [ ] **Step 3: Test with invalid token / no network**

Turn off network in the emulator, take a photo, verify it shows as "Failed" with a meaningful error. Turn network back on, tap Retry, verify it uploads.

- [ ] **Step 4: Commit**

```bash
git add src/services/uploadWorker.ts src/components/uploads/UploadListItem.tsx
git commit -m "fix: handle upload errors gracefully with retry support"
```

---

## Phase 2: Test Fixes

### Task 3: Fix AsyncStorage Jest Mock

The Button and Toggle component tests fail because `useThemeColors()` requires `ThemeProvider`, which uses AsyncStorage. The tests render components without the provider.

**Files:**
- Create or modify: `jest.setup.js` (or `src/test/setup.ts`)
- Modify: `src/components/ui/__tests__/Button.test.tsx`
- Modify: `src/components/ui/__tests__/Toggle.test.tsx`

- [ ] **Step 1: Check existing jest config**

Read `package.json` jest config. Check if there's a `setupFiles` or `setupFilesAfterFramework` entry. Check if there's already a jest.setup.js.

- [ ] **Step 2: Add AsyncStorage mock**

Create or update the jest setup file to mock `@react-native-async-storage/async-storage`:

```javascript
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

- [ ] **Step 3: Wrap test renders with ThemeProvider**

In Button.test.tsx and Toggle.test.tsx, wrap the rendered component with `<ThemeProvider>` so `useThemeColors()` works:

```tsx
import { ThemeProvider } from '../../context/ThemeContext';

render(
  <ThemeProvider>
    <Button label="Test" onPress={() => {}} />
  </ThemeProvider>
);
```

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All 46 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add jest.setup.js src/components/ui/__tests__/
git commit -m "fix: add AsyncStorage mock and ThemeProvider wrapper to UI tests"
```

---

## Phase 3: UI Polish

### Task 4: Dynamic StatusBar Based on Theme

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Make StatusBar theme-aware**

In `RootLayoutNav`, import `useTheme` (not just `useThemeColors`). Use `theme.isLight` to set the StatusBar:

```tsx
const { colors, theme } = useTheme();
// ...
<StatusBar style={theme.isLight ? 'dark' : 'light'} />
```

This ensures dark text on light backgrounds and light text on dark backgrounds.

- [ ] **Step 2: Test by switching themes**

Go to Settings > Theme, switch between Minimal (light) and Coral/Midnight (dark). Verify the status bar icons (time, battery, signal) change from dark to light appropriately.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "fix: dynamic StatusBar style based on active theme"
```

---

### Task 5: Fix Notification Permission in Permissions Screen

**Files:**
- Modify: `app/permissions.tsx`

- [ ] **Step 1: Read current permissions screen**

The notification permission status is hardcoded to `false`. Since `expo-notifications` was removed (incompatible with Expo Go SDK 53+), we should either:
- Remove the notifications row entirely, OR
- Show it as "Not available" if the module isn't installed

- [ ] **Step 2: Remove or update the notifications row**

Remove the notifications permission row since the module isn't installed. Keep camera and location only.

- [ ] **Step 3: Commit**

```bash
git add app/permissions.tsx
git commit -m "fix: remove unavailable notification permission from permissions screen"
```

---

### Task 6: Fix Stack Screen Header Colors for Light Theme

Several stack screens (folder-picker, qr-scanner, upload-history, permissions) still use `headerTintColor: colors.white` which is invisible on light themes.

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update all remaining Stack.Screen header colors**

In `_layout.tsx`, find all Stack.Screen options that have `headerTintColor: colors.white` and change to `headerTintColor: colors.textPrimary`. This includes: folder-picker, qr-scanner, upload-history, permissions.

- [ ] **Step 2: Test by navigating to each screen on light theme**

Navigate to folder picker, QR scanner, upload history, and permissions. Verify the header title and back button are visible on the light theme.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "fix: use textPrimary for stack header tint color across all screens"
```

---

## Phase 4: Backend Deployment Prep

### Task 7: Add Dockerfile and Firebase Config for Backend

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `backend/.env.example`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Create .dockerignore**

```
node_modules
src
*.ts
tsconfig.json
jest.config.*
```

- [ ] **Step 3: Create .env.example**

Document required environment variables:
```
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
PORT=3001
```

- [ ] **Step 4: Verify build**

```bash
cd backend && npm run build && docker build -t fieldcam-backend .
```

- [ ] **Step 5: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore backend/.env.example
git commit -m "feat: add Dockerfile and env template for backend deployment"
```

---

## Phase 5: Settings & Profile Fixes

### Task 8: Fix Profile DeliveryType Migration

Existing profiles in the database store `deliveryType` as a single string (e.g. `'same_folder'`). The new code expects comma-separated strings for multi-select. Old data is compatible (single value parses to a 1-element array), but `'both'` values from old data need handling.

**Files:**
- Modify: `src/services/profileService.ts`

- [ ] **Step 1: Handle legacy 'both' value in rowToProfile**

In the `rowToProfile` function, when parsing `delivery_type`, convert the legacy `'both'` value to `['same_folder', 'email']`:

```typescript
deliveryType: row.delivery_type === 'both'
  ? ['same_folder', 'email'] as DeliveryType[]
  : (row.delivery_type || 'same_folder').split(',') as DeliveryType[],
```

- [ ] **Step 2: Commit**

```bash
git add src/services/profileService.ts
git commit -m "fix: handle legacy 'both' delivery type in profile migration"
```

---

## Summary

| Phase | Task | Priority | Effort |
|-------|------|----------|--------|
| 1 | Wire upload worker | Critical | Medium |
| 1 | Handle upload errors | Critical | Small |
| 2 | Fix test mocks | Important | Small |
| 3 | Dynamic StatusBar | Polish | Small |
| 3 | Fix notification permission | Polish | Small |
| 3 | Fix stack header colors | Polish | Small |
| 4 | Backend Dockerfile | Deployment | Small |
| 5 | Profile delivery migration | Data fix | Small |
