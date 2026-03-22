# OAuth Integration & App Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Firebase Auth (email/password, Google Sign-In, Apple Sign-In) as the identity layer, implement cloud storage linking for Google Drive, OneDrive, and Dropbox with full folder browsing, and create the app icon.

**Architecture:** Identity via Firebase Auth (uid-based). Cloud storage as separately linked accounts with on-device token storage. Provider registry abstracts Google Drive / OneDrive / Dropbox behind existing `CloudStorageProvider` interface. Google uses library-managed token refresh; Microsoft/Dropbox use manual refresh via stored refresh tokens.

**Tech Stack:** React Native (Expo SDK 55), TypeScript, @react-native-firebase/app + auth, @react-native-google-signin/google-signin, expo-apple-authentication, react-native-msal, expo-auth-session, expo-secure-store, firebase-admin (backend)

**Spec:** `docs/superpowers/specs/2026-03-22-oauth-and-icon-design.md`

---

## Task 1: App Icon Generation

**Files:**
- Replace: `assets/images/icon.png`
- Replace: `assets/images/android-icon-foreground.png`
- Replace: `assets/images/android-icon-background.png`
- Replace: `assets/images/android-icon-monochrome.png`
- Replace: `assets/images/splash-icon.png`
- Replace: `assets/images/favicon.png`
- Create: `scripts/generate-icons.js`

- [ ] **Step 1: Create icon generation script**

Create `scripts/generate-icons.js` that generates all icon variants as SVG, then uses `sharp` to convert to PNG. The icon design: bold orange gradient background (#DA532C to #E8764F, 135deg), large white camera body filling ~70% of the icon, navy (#152455) lens center, orange accent dot.

```bash
npm install --save-dev sharp
```

```javascript
// scripts/generate-icons.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');

// Main icon: orange gradient bg + white camera + navy lens
const mainIconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DA532C"/>
      <stop offset="100%" style="stop-color:#E8764F"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="180" fill="url(#bg)"/>
  <!-- Camera body -->
  <rect x="182" y="332" width="660" height="440" rx="48" fill="white"/>
  <!-- Viewfinder bump -->
  <path d="M380 332 L430 252 L594 252 L644 332" fill="white"/>
  <!-- Lens outer ring -->
  <circle cx="512" cy="552" r="160" fill="#152455"/>
  <!-- Lens inner ring -->
  <circle cx="512" cy="552" r="110" fill="#1F2A45"/>
  <!-- Lens highlight -->
  <circle cx="512" cy="552" r="50" fill="#DA532C"/>
  <!-- Flash -->
  <rect x="700" y="380" width="60" height="36" rx="8" fill="#152455" opacity="0.3"/>
</svg>`;

// Android foreground: camera on transparent
const foregroundSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="182" y="332" width="660" height="440" rx="48" fill="white"/>
  <path d="M380 332 L430 252 L594 252 L644 332" fill="white"/>
  <circle cx="512" cy="552" r="160" fill="#152455"/>
  <circle cx="512" cy="552" r="110" fill="#1F2A45"/>
  <circle cx="512" cy="552" r="50" fill="#DA532C"/>
  <rect x="700" y="380" width="60" height="36" rx="8" fill="#152455" opacity="0.3"/>
</svg>`;

// Android background: orange gradient
const backgroundSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DA532C"/>
      <stop offset="100%" style="stop-color:#E8764F"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;

// Monochrome: camera silhouette
const monochromeSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="182" y="332" width="660" height="440" rx="48" fill="white"/>
  <path d="M380 332 L430 252 L594 252 L644 332" fill="white"/>
  <circle cx="512" cy="552" r="160" fill="black"/>
  <circle cx="512" cy="552" r="110" fill="white"/>
  <circle cx="512" cy="552" r="50" fill="black"/>
</svg>`;

async function generate() {
  // Main icon 1024x1024
  await sharp(Buffer.from(mainIconSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'icon.png'));
  // Android adaptive
  await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  await sharp(Buffer.from(backgroundSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-background.png'));
  await sharp(Buffer.from(monochromeSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  // Splash icon 512x512
  await sharp(Buffer.from(mainIconSvg)).resize(512, 512).png().toFile(path.join(ASSETS, 'splash-icon.png'));
  // Favicon 48x48
  await sharp(Buffer.from(mainIconSvg)).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
```

- [ ] **Step 2: Run the script to generate icons**

```bash
node scripts/generate-icons.js
```

Verify files exist and look correct by opening them.

- [ ] **Step 3: Update app.json adaptive icon background color**

In `app.json`, change `android.adaptiveIcon.backgroundColor` from `"#E6F4FE"` to `"#DA532C"`. Also change `splash.backgroundColor` from `"#ffffff"` to `"#0A0E1A"` (dark theme match).

- [ ] **Step 4: Commit**

```bash
git add assets/images/ scripts/generate-icons.js app.json
git commit -m "feat: generate bold orange camera app icon"
```

---

## Task 2: Update Types & Secure Storage

**Files:**
- Modify: `src/types/auth.ts`
- Modify: `src/services/secureStorage.ts`
- Test: `src/services/__tests__/secureStorage.test.ts`

- [ ] **Step 1: Update auth types**

Replace `src/types/auth.ts` with:

```typescript
export type CloudProvider = 'google' | 'microsoft' | 'dropbox';

export interface LinkedCloudAccount {
  provider: CloudProvider;
  email: string;
  accessToken: string;
  refreshToken: string | null;    // null for Google (library-managed), present for Microsoft/Dropbox
  expiresAt: number;              // Unix timestamp ms
  linkedAt: string;               // ISO date
}

export interface FieldCamUser {
  uid: string;                    // Firebase uid - canonical identifier
  email: string;                  // Display only
  displayName: string;
  initialAuthProvider: 'email' | 'google' | 'apple';
  createdAt: string;
}

export interface AuthState {
  user: FieldCamUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

- [ ] **Step 2: Write failing test for new secureStorage methods**

Update `src/services/__tests__/secureStorage.test.ts`:

```typescript
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
  };
});

import { secureStorage } from '../secureStorage';
import type { LinkedCloudAccount } from '../../types/auth';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAccount: LinkedCloudAccount = {
    provider: 'google',
    email: 'test@example.com',
    accessToken: 'access-123',
    refreshToken: null,
    expiresAt: Date.now() + 3600000,
    linkedAt: new Date().toISOString(),
  };

  it('saves and retrieves a cloud account', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    const result = await secureStorage.getCloudAccount('google');
    expect(result).toEqual(mockAccount);
  });

  it('returns null for unlinked provider', async () => {
    const result = await secureStorage.getCloudAccount('microsoft');
    expect(result).toBeNull();
  });

  it('deletes a cloud account', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    await secureStorage.deleteCloudAccount('google');
    const result = await secureStorage.getCloudAccount('google');
    expect(result).toBeNull();
  });

  it('lists all linked accounts', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    const msAccount: LinkedCloudAccount = { ...mockAccount, provider: 'microsoft', refreshToken: 'refresh-456' };
    await secureStorage.saveCloudAccount(msAccount);
    const accounts = await secureStorage.getLinkedAccounts();
    expect(accounts).toHaveLength(2);
  });

  it('saves and retrieves user', async () => {
    const user = { uid: 'uid-1', email: 'a@b.com', displayName: 'Test', initialAuthProvider: 'email' as const, createdAt: new Date().toISOString() };
    await secureStorage.saveUser(user);
    const result = await secureStorage.getUser();
    expect(result).toEqual(user);
  });

  it('clears all data', async () => {
    await secureStorage.saveCloudAccount(mockAccount);
    await secureStorage.clearAll();
    const accounts = await secureStorage.getLinkedAccounts();
    expect(accounts).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/services/__tests__/secureStorage.test.ts --no-coverage
```

Expected: FAIL (saveCloudAccount, getCloudAccount, etc. don't exist yet)

- [ ] **Step 4: Implement updated secureStorage**

Replace `src/services/secureStorage.ts` with:

```typescript
import * as SecureStore from 'expo-secure-store';
import type { CloudProvider, LinkedCloudAccount, FieldCamUser } from '../types/auth';

const CLOUD_PREFIX = 'fieldcam_cloud_';
const USER_KEY = 'fieldcam_user';
const ALL_PROVIDERS: CloudProvider[] = ['google', 'microsoft', 'dropbox'];

export const secureStorage = {
  // Cloud account management
  async saveCloudAccount(account: LinkedCloudAccount): Promise<void> {
    await SecureStore.setItemAsync(`${CLOUD_PREFIX}${account.provider}`, JSON.stringify(account));
  },

  async getCloudAccount(provider: CloudProvider): Promise<LinkedCloudAccount | null> {
    const data = await SecureStore.getItemAsync(`${CLOUD_PREFIX}${provider}`);
    return data ? JSON.parse(data) : null;
  },

  async deleteCloudAccount(provider: CloudProvider): Promise<void> {
    await SecureStore.deleteItemAsync(`${CLOUD_PREFIX}${provider}`);
  },

  async getLinkedAccounts(): Promise<LinkedCloudAccount[]> {
    const accounts: LinkedCloudAccount[] = [];
    for (const provider of ALL_PROVIDERS) {
      const account = await this.getCloudAccount(provider);
      if (account) accounts.push(account);
    }
    return accounts;
  },

  // User management
  async saveUser(user: FieldCamUser): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<FieldCamUser | null> {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  // Cleanup
  async clearAll(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
    for (const provider of ALL_PROVIDERS) {
      await SecureStore.deleteItemAsync(`${CLOUD_PREFIX}${provider}`);
      // Clean up legacy keys from pre-Firebase version
      await SecureStore.deleteItemAsync(`fieldcam_token_${provider}`);
    }
  },
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/services/__tests__/secureStorage.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/auth.ts src/services/secureStorage.ts src/services/__tests__/secureStorage.test.ts
git commit -m "feat: update auth types and secure storage for linked cloud accounts"
```

---

## Task 3: Cloud Storage Provider Registry

**Files:**
- Create: `src/services/cloudStorage/registry.ts`
- Test: `src/services/cloudStorage/__tests__/registry.test.ts`

- [ ] **Step 1: Write failing test for registry**

```typescript
// src/services/cloudStorage/__tests__/registry.test.ts
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
  };
});

import { getProvider } from '../registry';

describe('getProvider', () => {
  it('returns google drive provider', () => {
    const provider = getProvider('google');
    expect(provider).toBeDefined();
    expect(provider.listFolders).toBeDefined();
    expect(provider.createFolder).toBeDefined();
    expect(provider.uploadFile).toBeDefined();
  });

  it('returns onedrive provider', () => {
    const provider = getProvider('microsoft');
    expect(provider).toBeDefined();
  });

  it('returns dropbox provider', () => {
    const provider = getProvider('dropbox');
    expect(provider).toBeDefined();
  });

  it('throws for unknown provider', () => {
    expect(() => getProvider('unknown' as any)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/services/cloudStorage/__tests__/registry.test.ts --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement registry (initially with Google only, stubs for others)**

```typescript
// src/services/cloudStorage/registry.ts
import type { CloudProvider } from '../../types/auth';
import type { CloudStorageProvider } from './types';
import { googleDrive } from './googleDrive';

const providers: Record<string, CloudStorageProvider> = {
  google: googleDrive,
};

export function getProvider(provider: CloudProvider): CloudStorageProvider {
  const impl = providers[provider];
  if (!impl) throw new Error(`Cloud storage provider "${provider}" is not registered`);
  return impl;
}

export function registerProvider(provider: CloudProvider, impl: CloudStorageProvider): void {
  providers[provider] = impl;
}
```

- [ ] **Step 4: Run test to verify it passes**

The test for 'microsoft' and 'dropbox' will fail because they're not registered yet. Update the test to only test 'google' for now, and add the others when we implement them:

Update the microsoft and dropbox tests to expect throws until implemented:

```typescript
  it('throws for unregistered microsoft', () => {
    expect(() => getProvider('microsoft')).toThrow('not registered');
  });

  it('throws for unregistered dropbox', () => {
    expect(() => getProvider('dropbox')).toThrow('not registered');
  });
```

```bash
npx jest src/services/cloudStorage/__tests__/registry.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/cloudStorage/registry.ts src/services/cloudStorage/__tests__/registry.test.ts
git commit -m "feat: add cloud storage provider registry"
```

---

## Task 4: OneDrive CloudStorageProvider

**Files:**
- Create: `src/services/cloudStorage/oneDrive.ts`
- Test: `src/services/cloudStorage/__tests__/oneDrive.test.ts`
- Modify: `src/services/cloudStorage/registry.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/services/cloudStorage/__tests__/oneDrive.test.ts
global.fetch = jest.fn();

import { oneDrive } from '../oneDrive';

describe('oneDrive', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('lists folders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: [
          { id: 'f1', name: 'Folder A', parentReference: { path: '/drive/root:' } },
          { id: 'f2', name: 'Folder B', parentReference: { path: '/drive/root:' } },
        ],
      }),
    });

    const folders = await oneDrive.listFolders('root', 'token');
    expect(folders).toHaveLength(2);
    expect(folders[0].id).toBe('f1');
    expect(folders[0].name).toBe('Folder A');
  });

  it('creates a folder', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-folder', name: 'New', parentReference: { path: '/drive/root:' } }),
    });

    const folder = await oneDrive.createFolder('New', 'root', 'token');
    expect(folder.id).toBe('new-folder');
    expect(folder.name).toBe('New');
  });

  it('uploads a file', async () => {
    // Mock the file read
    jest.spyOn(require('expo-file-system/legacy'), 'readAsStringAsync').mockResolvedValue('base64data');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'file-1',
        name: 'photo.jpg',
        file: { mimeType: 'image/jpeg' },
        webUrl: 'https://onedrive.live.com/...',
      }),
    });

    const result = await oneDrive.uploadFile('file:///photo.jpg', 'photo.jpg', 'image/jpeg', 'folder-1', 'token');
    expect(result.id).toBe('file-1');
    expect(result.name).toBe('photo.jpg');
  });

  it('throws when listFolders fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(oneDrive.listFolders('root', 'bad-token')).rejects.toThrow('listFolders failed: 401');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/services/cloudStorage/__tests__/oneDrive.test.ts --no-coverage
```

- [ ] **Step 3: Implement OneDrive provider**

```typescript
// src/services/cloudStorage/oneDrive.ts
import * as FileSystem from 'expo-file-system/legacy';
import type { CloudStorageProvider, CloudFolder, CloudFile } from './types';

const GRAPH_API = 'https://graph.microsoft.com/v1.0/me/drive';

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function itemsUrl(parentId: string): string {
  if (parentId === 'root') return `${GRAPH_API}/root/children`;
  return `${GRAPH_API}/items/${parentId}/children`;
}

const oneDriveProvider: CloudStorageProvider = {
  async listFolders(parentId: string, accessToken: string): Promise<CloudFolder[]> {
    const url = `${itemsUrl(parentId)}?$filter=folder ne null&$select=id,name,parentReference`;
    const response = await fetch(url, { headers: authHeader(accessToken) });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`listFolders failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return (data.value as any[]).map((item) => ({
      id: item.id,
      name: item.name,
      path: item.parentReference?.path ?? '',
    }));
  },

  async createFolder(name: string, parentId: string, accessToken: string): Promise<CloudFolder> {
    const url = itemsUrl(parentId);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...authHeader(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`createFolder failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return { id: data.id, name: data.name, path: data.parentReference?.path ?? '' };
  },

  async uploadFile(
    localUri: string,
    fileName: string,
    mimeType: string,
    folderId: string,
    accessToken: string
  ): Promise<CloudFile> {
    const fileContent = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const parentPath = folderId === 'root' ? '/root:' : `/items/${folderId}:`;
    const url = `${GRAPH_API}${parentPath}/${encodeURIComponent(fileName)}:/content`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...authHeader(accessToken),
        'Content-Type': mimeType,
      },
      body: Uint8Array.from(atob(fileContent), (c) => c.charCodeAt(0)),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`uploadFile failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      mimeType: data.file?.mimeType ?? mimeType,
      webViewLink: data.webUrl,
    };
  },
};

export { oneDriveProvider as oneDrive };
```

- [ ] **Step 4: Register OneDrive in registry**

Add to `src/services/cloudStorage/registry.ts`:

```typescript
import { oneDrive } from './oneDrive';
```

And add to the `providers` object:

```typescript
const providers: Record<string, CloudStorageProvider> = {
  google: googleDrive,
  microsoft: oneDrive,
};
```

- [ ] **Step 5: Update registry test for microsoft**

Change the microsoft test from expecting a throw to expecting success:

```typescript
  it('returns onedrive provider', () => {
    const provider = getProvider('microsoft');
    expect(provider).toBeDefined();
    expect(provider.listFolders).toBeDefined();
  });
```

- [ ] **Step 6: Run all tests**

```bash
npx jest --no-coverage
```

Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/cloudStorage/oneDrive.ts src/services/cloudStorage/__tests__/oneDrive.test.ts src/services/cloudStorage/registry.ts src/services/cloudStorage/__tests__/registry.test.ts
git commit -m "feat: add OneDrive CloudStorageProvider implementation"
```

---

## Task 5: Dropbox CloudStorageProvider

**Files:**
- Create: `src/services/cloudStorage/dropbox.ts`
- Test: `src/services/cloudStorage/__tests__/dropbox.test.ts`
- Modify: `src/services/cloudStorage/registry.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/services/cloudStorage/__tests__/dropbox.test.ts
global.fetch = jest.fn();

import { dropbox } from '../dropbox';

describe('dropbox', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('lists folders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        entries: [
          { '.tag': 'folder', id: 'id:f1', name: 'Folder A', path_display: '/Folder A' },
          { '.tag': 'folder', id: 'id:f2', name: 'Folder B', path_display: '/Folder B' },
        ],
        has_more: false,
      }),
    });

    const folders = await dropbox.listFolders('', 'token');
    expect(folders).toHaveLength(2);
    expect(folders[0].id).toBe('id:f1');
    expect(folders[0].path).toBe('/Folder A');
  });

  it('creates a folder', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metadata: { id: 'id:new', name: 'New', path_display: '/New', path_lower: '/new' },
      }),
    });

    const folder = await dropbox.createFolder('New', '', 'token');
    expect(folder.id).toBe('/New'); // id is path_display for Dropbox
    expect(folder.name).toBe('New');
  });

  it('uploads a file', async () => {
    jest.spyOn(require('expo-file-system/legacy'), 'readAsStringAsync').mockResolvedValue('base64data');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'id:file1',
        name: 'photo.jpg',
        path_display: '/Photos/photo.jpg',
      }),
    });

    const result = await dropbox.uploadFile('file:///photo.jpg', 'photo.jpg', 'image/jpeg', '/Photos', 'token');
    expect(result.id).toBe('id:file1');
    expect(result.name).toBe('photo.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/services/cloudStorage/__tests__/dropbox.test.ts --no-coverage
```

- [ ] **Step 3: Implement Dropbox provider**

```typescript
// src/services/cloudStorage/dropbox.ts
import * as FileSystem from 'expo-file-system/legacy';
import type { CloudStorageProvider, CloudFolder, CloudFile } from './types';

const API_BASE = 'https://api.dropboxapi.com/2';
const CONTENT_BASE = 'https://content.dropboxapi.com/2';

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

const dropboxProvider: CloudStorageProvider = {
  async listFolders(parentId: string, accessToken: string): Promise<CloudFolder[]> {
    const path = parentId === '' ? '' : parentId;
    const response = await fetch(`${API_BASE}/files/list_folder`, {
      method: 'POST',
      headers: {
        ...authHeader(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        include_non_downloadable_files: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`listFolders failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    // IMPORTANT: Dropbox API uses paths, not IDs, for most operations.
    // We store path_display as the `id` field so createFolder/uploadFile
    // can use it directly as a path. This is a semantic compromise
    // but makes the CloudStorageProvider interface work uniformly.
    return (data.entries as any[])
      .filter((e: any) => e['.tag'] === 'folder')
      .map((e: any) => ({
        id: e.path_display ?? e.path_lower ?? '',
        name: e.name,
        path: e.path_display ?? '',
      }));
  },

  async createFolder(name: string, parentId: string, accessToken: string): Promise<CloudFolder> {
    const parentPath = parentId === '' ? '' : parentId;
    // Dropbox uses paths, not IDs for folder creation
    // We need to construct the full path
    const fullPath = parentPath ? `${parentPath}/${name}` : `/${name}`;

    const response = await fetch(`${API_BASE}/files/create_folder_v2`, {
      method: 'POST',
      headers: {
        ...authHeader(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: fullPath, autorename: true }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`createFolder failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    const meta = data.metadata;
    return { id: meta.path_display ?? '', name: meta.name, path: meta.path_display ?? '' };
  },

  async uploadFile(
    localUri: string,
    fileName: string,
    mimeType: string,
    folderId: string,
    accessToken: string
  ): Promise<CloudFile> {
    const fileContent = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Dropbox uses paths for uploads. folderId is the path_display of the parent folder.
    const parentPath = folderId === '' ? '' : folderId;
    const fullPath = `${parentPath}/${fileName}`;

    const response = await fetch(`${CONTENT_BASE}/files/upload`, {
      method: 'POST',
      headers: {
        ...authHeader(accessToken),
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: fullPath,
          mode: 'add',
          autorename: true,
          mute: false,
        }),
      },
      body: Uint8Array.from(atob(fileContent), (c) => c.charCodeAt(0)),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`uploadFile failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      mimeType,
    };
  },
};

export { dropboxProvider as dropbox };
```

- [ ] **Step 4: Register Dropbox in registry**

Add to `src/services/cloudStorage/registry.ts`:

```typescript
import { dropbox } from './dropbox';
```

Update providers:

```typescript
const providers: Record<string, CloudStorageProvider> = {
  google: googleDrive,
  microsoft: oneDrive,
  dropbox: dropbox,
};
```

- [ ] **Step 5: Update registry test for dropbox**

Change from expecting throw to expecting success.

- [ ] **Step 6: Run all tests**

```bash
npx jest --no-coverage
```

Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/services/cloudStorage/dropbox.ts src/services/cloudStorage/__tests__/dropbox.test.ts src/services/cloudStorage/registry.ts src/services/cloudStorage/__tests__/registry.test.ts
git commit -m "feat: add Dropbox CloudStorageProvider implementation"
```

---

## Task 6: Token Refresh Service

**Files:**
- Create: `src/services/oauth/tokenRefresh.ts`
- Create: `src/services/oauth/index.ts`
- Test: `src/services/oauth/__tests__/tokenRefresh.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/services/oauth/__tests__/tokenRefresh.test.ts
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { delete store[key]; }),
  };
});

global.fetch = jest.fn();

import { getValidAccessToken } from '../tokenRefresh';
import { secureStorage } from '../../secureStorage';
import type { LinkedCloudAccount } from '../../../types/auth';

describe('getValidAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('returns cached token if not expired', async () => {
    const account: LinkedCloudAccount = {
      provider: 'microsoft',
      email: 'test@example.com',
      accessToken: 'valid-token',
      refreshToken: 'refresh-123',
      expiresAt: Date.now() + 600000, // 10 min from now
      linkedAt: new Date().toISOString(),
    };
    await secureStorage.saveCloudAccount(account);

    const token = await getValidAccessToken('microsoft');
    expect(token).toBe('valid-token');
  });

  it('refreshes Microsoft token when expired', async () => {
    const account: LinkedCloudAccount = {
      provider: 'microsoft',
      email: 'test@example.com',
      accessToken: 'old-token',
      refreshToken: 'refresh-123',
      expiresAt: Date.now() - 1000, // expired
      linkedAt: new Date().toISOString(),
    };
    await secureStorage.saveCloudAccount(account);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
      }),
    });

    const token = await getValidAccessToken('microsoft');
    expect(token).toBe('new-token');
  });

  it('throws for unlinked provider', async () => {
    await expect(getValidAccessToken('dropbox')).rejects.toThrow('not linked');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/services/oauth/__tests__/tokenRefresh.test.ts --no-coverage
```

- [ ] **Step 3: Implement token refresh**

```typescript
// src/services/oauth/tokenRefresh.ts
import { secureStorage } from '../secureStorage';
import type { CloudProvider, LinkedCloudAccount } from '../../types/auth';

const TOKEN_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

// Microsoft client ID - replace with real value
const MS_CLIENT_ID = '__MICROSOFT_CLIENT_ID__';

// Dropbox client ID and secret - replace with real values
const DROPBOX_CLIENT_ID = '__DROPBOX_CLIENT_ID__';
const DROPBOX_CLIENT_SECRET = '__DROPBOX_CLIENT_SECRET__';

export async function getValidAccessToken(provider: CloudProvider): Promise<string> {
  const account = await secureStorage.getCloudAccount(provider);
  if (!account) throw new Error(`Provider "${provider}" is not linked`);

  // Check if token is still valid
  if (account.expiresAt > Date.now() + TOKEN_BUFFER_MS) {
    return account.accessToken;
  }

  // Token expired - refresh based on provider
  if (provider === 'google') {
    return refreshGoogleToken(account);
  } else if (provider === 'microsoft') {
    return refreshMicrosoftToken(account);
  } else if (provider === 'dropbox') {
    return refreshDropboxToken(account);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function refreshGoogleToken(account: LinkedCloudAccount): Promise<string> {
  // Google uses @react-native-google-signin library-managed refresh.
  // Import dynamically to avoid requiring the native module in tests.
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  try {
    await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();
    const updated: LinkedCloudAccount = {
      ...account,
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + 3600 * 1000, // Google tokens last ~1hr
    };
    await secureStorage.saveCloudAccount(updated);
    return tokens.accessToken;
  } catch {
    throw new Error('Google token refresh failed. Please re-link Google Drive.');
  }
}

async function refreshMicrosoftToken(account: LinkedCloudAccount): Promise<string> {
  if (!account.refreshToken) throw new Error('No refresh token for Microsoft');

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
      scope: 'Files.ReadWrite User.Read offline_access',
    }).toString(),
  });

  if (!response.ok) throw new Error('Microsoft token refresh failed. Please re-link OneDrive.');

  const data = await response.json();
  const updated: LinkedCloudAccount = {
    ...account,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? account.refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  await secureStorage.saveCloudAccount(updated);
  return data.access_token;
}

async function refreshDropboxToken(account: LinkedCloudAccount): Promise<string> {
  if (!account.refreshToken) throw new Error('No refresh token for Dropbox');

  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DROPBOX_CLIENT_ID,
      client_secret: DROPBOX_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: account.refreshToken,
    }).toString(),
  });

  if (!response.ok) throw new Error('Dropbox token refresh failed. Please re-link Dropbox.');

  const data = await response.json();
  const updated: LinkedCloudAccount = {
    ...account,
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 14400) * 1000,
  };
  await secureStorage.saveCloudAccount(updated);
  return data.access_token;
}
```

- [ ] **Step 4: Create oauth index**

```typescript
// src/services/oauth/index.ts
export { getValidAccessToken } from './tokenRefresh';
```

- [ ] **Step 5: Run tests**

```bash
npx jest src/services/oauth/__tests__/tokenRefresh.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/oauth/
git commit -m "feat: add provider-specific token refresh service"
```

---

## Task 7: Upload Worker Refactor

**Files:**
- Modify: `src/services/uploadWorker.ts`

- [ ] **Step 1: Refactor uploadWorker to use registry**

Replace `src/services/uploadWorker.ts`:

```typescript
import { uploadQueue } from './uploadQueue';
import { getProvider } from './cloudStorage/registry';
import { getValidAccessToken } from './oauth/tokenRefresh';
import type { UploadItem } from '../types/upload';

let isProcessing = false;

export async function processUploadQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;
  try {
    const pending = await uploadQueue.getPending();
    for (const item of pending) {
      if (item.retryCount >= 5) continue;
      await processItem(item);
    }
  } finally {
    isProcessing = false;
  }
}

async function processItem(item: UploadItem): Promise<void> {
  try {
    await uploadQueue.updateStatus(item.id, 'uploading');
    const accessToken = await getValidAccessToken(item.provider);
    const provider = getProvider(item.provider);
    const result = await provider.uploadFile(
      item.localUri,
      item.fileName,
      item.mimeType,
      item.folderId,
      accessToken
    );
    await uploadQueue.updateStatus(item.id, 'completed', undefined, result.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await uploadQueue.updateStatus(item.id, 'failed', message);
  }
}
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

```bash
npx jest --no-coverage
```

Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add src/services/uploadWorker.ts
git commit -m "refactor: make upload worker provider-agnostic via registry"
```

---

## Task 8: Install Firebase & Auth Dependencies

**Files:**
- Modify: `package.json`
- Modify: `app.json`

- [ ] **Step 1: Install Firebase and Google Sign-In packages**

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin expo-apple-authentication expo-build-properties
npm install react-native-msal
```

- [ ] **Step 2: Update app.json with plugins and Firebase config**

Update `app.json` to add the required plugins, Firebase config file references, and build properties. The full plugins array should be:

```json
"plugins": [
  "expo-router",
  "expo-sqlite",
  "expo-secure-store",
  "expo-web-browser",
  "@react-native-firebase/app",
  "@react-native-firebase/auth",
  "@react-native-google-signin/google-signin",
  "expo-apple-authentication",
  ["expo-build-properties", {
    "ios": { "useFrameworks": "static" }
  }]
]
```

Add to `android`:
```json
"googleServicesFile": "./google-services.json"
```

Add to `ios`:
```json
"googleServicesFile": "./GoogleService-Info.plist"
```

- [ ] **Step 3: Create placeholder Firebase config files**

Create `google-services.json` and `GoogleService-Info.plist` placeholders. These must be replaced with real files from Firebase Console before building.

```json
// google-services.json (placeholder)
{
  "_comment": "REPLACE with real google-services.json from Firebase Console",
  "project_info": { "project_number": "000000000000", "project_id": "fieldcam-placeholder" },
  "client": []
}
```

```xml
<!-- GoogleService-Info.plist (placeholder - REPLACE with real file from Firebase Console) -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>PLACEHOLDER</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>PLACEHOLDER</string>
  <key>BUNDLE_ID</key>
  <string>com.fieldcam.app</string>
  <key>PROJECT_ID</key>
  <string>fieldcam-placeholder</string>
  <key>GCM_SENDER_ID</key>
  <string>000000000000</string>
  <key>GOOGLE_APP_ID</key>
  <string>PLACEHOLDER</string>
</dict>
</plist>
```

- [ ] **Step 4: Commit**

```bash
git add package.json app.json google-services.json GoogleService-Info.plist
git commit -m "feat: install Firebase, Google Sign-In, and Apple Auth dependencies"
```

---

## Task 9: Rewrite AuthContext for Firebase

**Files:**
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Rewrite AuthContext**

Replace `src/context/AuthContext.tsx` with Firebase Auth integration:

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { secureStorage } from '../services/secureStorage';
import type { FieldCamUser, AuthState, LinkedCloudAccount } from '../types/auth';

// Configure Google Sign-In with Drive scope
GoogleSignin.configure({
  webClientId: '__GOOGLE_WEB_CLIENT_ID__', // from Firebase Console
  scopes: ['https://www.googleapis.com/auth/drive'],
  offlineAccess: false,
});

interface AuthContextValue extends AuthState {
  signInWithEmail: (email: string, password: string, isNewAccount: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  devBypass: () => Promise<void>;
  linkedAccounts: LinkedCloudAccount[];
  refreshLinkedAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseUserToFieldCam(
  fbUser: FirebaseAuthTypes.User,
  provider: 'email' | 'google' | 'apple'
): FieldCamUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? fbUser.email ?? '',
    initialAuthProvider: provider,
    createdAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedCloudAccount[]>([]);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        // Determine provider from Firebase user
        const providerData = fbUser.providerData;
        let provider: 'email' | 'google' | 'apple' = 'email';
        if (providerData.some((p) => p.providerId === 'google.com')) provider = 'google';
        if (providerData.some((p) => p.providerId === 'apple.com')) provider = 'apple';

        const user = firebaseUserToFieldCam(fbUser, provider);
        await secureStorage.saveUser(user);
        const accounts = await secureStorage.getLinkedAccounts();
        setLinkedAccounts(accounts);
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        setLinkedAccounts([]);
      }
    });
    return unsubscribe;
  }, []);

  const refreshLinkedAccounts = useCallback(async () => {
    const accounts = await secureStorage.getLinkedAccounts();
    setLinkedAccounts(accounts);
  }, []);

  // Dev mode bypass for local development without Firebase
  const devBypass = useCallback(async () => {
    if (!__DEV__) return;
    const mockUser: FieldCamUser = {
      uid: 'dev-user-uid',
      email: 'dev@fieldcam.local',
      displayName: 'Dev User',
      initialAuthProvider: 'email',
      createdAt: new Date().toISOString(),
    };
    await secureStorage.saveUser(mockUser);
    setState({ user: mockUser, isAuthenticated: true, isLoading: false });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string, isNewAccount: boolean) => {
    try {
      if (isNewAccount) {
        await auth().createUserWithEmailAndPassword(email, password);
      } else {
        await auth().signInWithEmailAndPassword(email, password);
      }
    } catch (error: any) {
      const message = error.message ?? String(error);
      Alert.alert('Sign-in failed', message);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) throw new Error('No ID token from Google');

      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);

      // Auto-link Google Drive since we requested the drive scope
      const tokens = await GoogleSignin.getTokens();
      const googleUser = await GoogleSignin.getCurrentUser();
      const driveAccount: LinkedCloudAccount = {
        provider: 'google',
        email: googleUser?.data?.user.email ?? '',
        accessToken: tokens.accessToken,
        refreshToken: null, // library-managed
        expiresAt: Date.now() + 3600 * 1000,
        linkedAt: new Date().toISOString(),
      };
      await secureStorage.saveCloudAccount(driveAccount);
      await refreshLinkedAccounts();
    } catch (error: any) {
      if (error.code === 'auth/account-exists-with-different-credential') {
        // Account exists with different provider. Attempt to link credentials.
        // The pending credential is in error.credential (Firebase v9+)
        const pendingCredential = error.credential;
        if (pendingCredential) {
          try {
            // Sign in with existing account, then link the new credential
            const currentUser = auth().currentUser;
            if (currentUser) {
              await currentUser.linkWithCredential(pendingCredential);
              return; // Successfully linked
            }
          } catch {
            // Fall through to alert
          }
        }
        Alert.alert('Account exists', 'An account with this email already exists. Please sign in with your original method first, then link Google in Settings.');
      } else if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign-In failed', error.message ?? String(error));
      }
    }
  }, [refreshLinkedAccounts]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const { AppleAuthentication } = require('expo-apple-authentication');
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleCredential.identityToken) throw new Error('No identity token from Apple');

      const credential = auth.AppleAuthProvider.credential(
        appleCredential.identityToken,
        appleCredential.authorizationCode ?? undefined
      );
      await auth().signInWithCredential(credential);
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In failed', error.message ?? String(error));
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut().catch(() => {});
      await auth().signOut();
      await secureStorage.clearAll();
    } catch (error: any) {
      Alert.alert('Sign-out failed', error.message ?? String(error));
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) return;
      await currentUser.delete();
      await secureStorage.clearAll();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert('Re-authentication required', 'Please sign out and sign back in before deleting your account.');
      } else {
        Alert.alert('Delete failed', error.message ?? String(error));
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      ...state,
      signInWithEmail,
      signInWithGoogle,
      signInWithApple,
      signOut,
      deleteAccount,
      devBypass,
      linkedAccounts,
      refreshLinkedAccounts,
    }}>
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

- [ ] **Step 2: Run tests (some will need updating due to type changes)**

```bash
npx jest --no-coverage 2>&1 | head -30
```

Fix any import errors in other files that reference the old `User` type or `signIn` method. Common fixes:
- `upload-history.tsx`: update `CloudProvider` import if needed
- Any file importing `User` from `types/auth` needs to use `FieldCamUser`

- [ ] **Step 3: Commit**

```bash
git add src/context/AuthContext.tsx
git commit -m "feat: rewrite AuthContext with Firebase Auth integration"
```

---

## Task 10: Rewrite Login Screen

**Files:**
- Modify: `app/(auth)/login.tsx`

- [ ] **Step 1: Rewrite login screen**

Replace `app/(auth)/login.tsx` with email/password + Google + Apple sign-in:

```typescript
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/ui';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

export default function LoginScreen() {
  const { signInWithEmail, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewAccount, setIsNewAccount] = useState(false);
  const [loading, setLoading] = useState(false);

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

        <Text style={styles.footer}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(auth)/login.tsx
git commit -m "feat: rewrite login screen with email/Google/Apple sign-in"
```

---

## Task 11: Settings - Cloud Accounts & Account Deletion

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Add Cloud Accounts section and Delete Account to settings**

Add a new "Cloud Storage" section between "Account" and "Upload" in `app/(tabs)/settings.tsx`. This section shows linked accounts with disconnect buttons, and buttons to link unlinked providers. Also add "Delete Account" to the Maintenance section.

The Cloud Accounts section needs:
- Import `useAuth` for `linkedAccounts`, `refreshLinkedAccounts`, `deleteAccount`
- Import `secureStorage` for unlinking
- Import `getValidAccessToken` from oauth
- For each provider: show connected state (email + disconnect button) or "Connect" button
- Google linking: call `GoogleSignin.signIn()` with drive scope, save token
- Microsoft linking: use `react-native-msal` to acquire token
- Dropbox linking: use `expo-auth-session` to perform OAuth

The linking flows (Microsoft, Dropbox) should be separate functions. For now, implement the UI shell and Google linking. Microsoft/Dropbox linking functions will be implemented in Tasks 12-13.

Add Delete Account button at the bottom of Maintenance section with confirmation dialog.

- [ ] **Step 2: Run tests**

```bash
npx jest --no-coverage
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: add cloud accounts section and account deletion to settings"
```

---

## Task 12: Microsoft OAuth Linking

**Files:**
- Create: `src/services/oauth/microsoft.ts`

- [ ] **Step 1: Implement Microsoft OAuth linking**

```typescript
// src/services/oauth/microsoft.ts
import type { LinkedCloudAccount } from '../../types/auth';

// Replace with real values from Microsoft Entra ID
const MS_CLIENT_ID = '__MICROSOFT_CLIENT_ID__';

export async function linkMicrosoftAccount(): Promise<LinkedCloudAccount> {
  const { PublicClientApplication } = require('react-native-msal');

  const config = {
    auth: {
      clientId: MS_CLIENT_ID,
      authority: 'https://login.microsoftonline.com/common',
    },
  };

  const pca = new PublicClientApplication(config);
  await pca.init();

  const result = await pca.acquireToken({
    scopes: ['Files.ReadWrite', 'User.Read', 'offline_access'],
  });

  if (!result) throw new Error('Microsoft sign-in cancelled');

  // Get user profile
  const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${result.accessToken}` },
  });
  const profile = await profileRes.json();

  return {
    provider: 'microsoft',
    email: profile.mail ?? profile.userPrincipalName ?? '',
    accessToken: result.accessToken,
    refreshToken: result.refreshToken ?? null,
    expiresAt: result.expiresOn
      ? new Date(result.expiresOn).getTime()
      : Date.now() + 3600 * 1000,
    linkedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/oauth/microsoft.ts
git commit -m "feat: add Microsoft OAuth linking for OneDrive"
```

---

## Task 13: Dropbox OAuth Linking

**Files:**
- Create: `src/services/oauth/dropbox.ts`

- [ ] **Step 1: Implement Dropbox OAuth linking**

```typescript
// src/services/oauth/dropbox.ts
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { LinkedCloudAccount } from '../../types/auth';

WebBrowser.maybeCompleteAuthSession();

const DROPBOX_CLIENT_ID = '__DROPBOX_CLIENT_ID__';
const DROPBOX_CLIENT_SECRET = '__DROPBOX_CLIENT_SECRET__';

export async function linkDropboxAccount(): Promise<LinkedCloudAccount> {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'fieldcam', path: 'oauth/dropbox' });

  const request = new AuthSession.AuthRequest({
    clientId: DROPBOX_CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      token_access_type: 'offline',
    },
  });

  const result = await request.promptAsync({
    authorizationEndpoint: 'https://www.dropbox.com/oauth2/authorize',
  });

  if (result.type !== 'success' || !result.params.code) {
    throw new Error('Dropbox sign-in cancelled');
  }

  // Exchange code for tokens
  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: DROPBOX_CLIENT_ID,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier!,
        client_secret: DROPBOX_CLIENT_SECRET,
      },
    },
    { tokenEndpoint: 'https://api.dropboxapi.com/oauth2/token' }
  );

  // Get account info
  const accountRes = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenResult.accessToken}`,
    },
  });
  const account = await accountRes.json();

  return {
    provider: 'dropbox',
    email: account.email ?? '',
    accessToken: tokenResult.accessToken!,
    refreshToken: tokenResult.refreshToken ?? null,
    expiresAt: Date.now() + (tokenResult.expiresIn ?? 14400) * 1000,
    linkedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Update oauth/index.ts exports**

```typescript
// src/services/oauth/index.ts
export { getValidAccessToken } from './tokenRefresh';
export { linkMicrosoftAccount } from './microsoft';
export { linkDropboxAccount } from './dropbox';
```

- [ ] **Step 3: Commit**

```bash
git add src/services/oauth/dropbox.ts src/services/oauth/index.ts
git commit -m "feat: add Dropbox OAuth linking"
```

---

## Task 14: Folder Picker Refactor

**Files:**
- Modify: `app/folder-picker.tsx`

- [ ] **Step 1: Refactor folder picker to support multiple providers**

Key changes:
1. Replace `import { googleDrive }` with `import { getProvider }` from registry
2. Replace `secureStorage.getToken('google')` with `getValidAccessToken(selectedProvider)`
3. Add provider selector pills at the top (only shows linked providers)
4. Add `selectedProvider` state, default to first linked provider
5. Replace all hardcoded `'google'` with `selectedProvider`
6. Change root folder ID based on provider: `'root'` for google/microsoft, `''` for dropbox
7. Change root folder name based on provider: `'My Drive'` / `'OneDrive'` / `'Dropbox'`

Replace the import section at top:

```typescript
import { getProvider } from '../src/services/cloudStorage/registry';
import { getValidAccessToken } from '../src/services/oauth/tokenRefresh';
import { useAuth } from '../src/context/AuthContext';
```

Add provider selector component above the folder browser:

```typescript
const { linkedAccounts } = useAuth();
const [selectedProvider, setSelectedProvider] = useState<CloudProvider>(
  linkedAccounts[0]?.provider ?? 'google'
);

const rootId = selectedProvider === 'dropbox' ? '' : 'root';
const rootName = selectedProvider === 'google' ? 'My Drive'
  : selectedProvider === 'microsoft' ? 'OneDrive' : 'Dropbox';
```

Update `loadFolders` to use registry:

```typescript
const loadFolders = useCallback(async (parentId: string) => {
  setBrowser((prev) => ({ ...prev, loading: true, folders: [] }));
  try {
    const token = await getValidAccessToken(selectedProvider);
    const provider = getProvider(selectedProvider);
    const cloudFolders = await provider.listFolders(parentId, token);
    const folderInfos: FolderInfo[] = cloudFolders.map((f) => ({
      id: f.id,
      name: f.name,
      provider: selectedProvider,
    }));
    folderInfos.sort((a, b) => a.name.localeCompare(b.name));
    setBrowser((prev) => ({ ...prev, folders: folderInfos, loading: false }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    Alert.alert('Error', msg);
    setBrowser((prev) => ({ ...prev, loading: false }));
  }
}, [selectedProvider]);
```

- [ ] **Step 2: Run tests**

```bash
npx jest --no-coverage
```

- [ ] **Step 3: Commit**

```bash
git add app/folder-picker.tsx
git commit -m "refactor: make folder picker provider-agnostic with provider selector"
```

---

## Task 15: Backend Auth Middleware

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Modify: `backend/src/index.ts`
- Modify: `backend/package.json`

- [ ] **Step 1: Install firebase-admin in backend**

```bash
cd C:/Users/Justin/Desktop/fieldcam/backend && npm install firebase-admin
```

- [ ] **Step 2: Create auth middleware**

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS env var or default credentials)
if (!admin.apps.length) {
  admin.initializeApp();
}

declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

- [ ] **Step 3: Apply middleware to routes in index.ts**

In `backend/src/index.ts`, add:

```typescript
import { firebaseAuth } from './middleware/auth';
```

Change route registrations to:

```typescript
app.use('/v1/process', firebaseAuth, processRouter);
app.use('/v1/profiles', firebaseAuth, profilesRouter);
```

The `/health` endpoint remains unauthenticated.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Justin/Desktop/fieldcam
git add backend/
git commit -m "feat: add Firebase auth middleware to backend API"
```

---

## Task 16: Delete Old OAuth File & Final Cleanup

**Files:**
- Delete: `src/services/oauth.ts`
- Various: fix any remaining type errors

- [ ] **Step 1: Delete old oauth.ts**

```bash
rm src/services/oauth.ts
```

- [ ] **Step 2: Fix any remaining import references to old oauth.ts**

Search for any files still importing from `../services/oauth` (the old file) and update them. The main one is `AuthContext.tsx` which was already rewritten.

- [ ] **Step 3: Run TypeScript check and tests**

```bash
npx tsc --noEmit
npx jest --no-coverage
```

Fix any remaining type errors. Common issues:
- Files importing old `User` type need `FieldCamUser`
- Files importing old `CloudAccount` need `LinkedCloudAccount`
- Files referencing `user.id` need `user.uid`
- Files referencing `user.primaryProvider` need updating

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old oauth.ts and fix remaining type references"
```

---

## Summary

| Task | What it produces |
|------|-----------------|
| 1. App Icon | Bold orange camera icon at all required sizes |
| 2. Types & Secure Storage | Updated auth types, LinkedCloudAccount storage |
| 3. Provider Registry | getProvider() routing for cloud storage |
| 4. OneDrive Provider | Full CloudStorageProvider for Microsoft Graph API |
| 5. Dropbox Provider | Full CloudStorageProvider for Dropbox API v2 |
| 6. Token Refresh | Provider-specific token refresh (Google library, MS/Dropbox HTTP) |
| 7. Upload Worker | Provider-agnostic uploads via registry |
| 8. Dependencies | Firebase, Google Sign-In, Apple Auth packages installed |
| 9. AuthContext | Firebase Auth with email/Google/Apple sign-in |
| 10. Login Screen | Email/password form + social sign-in buttons |
| 11. Settings | Cloud account linking UI + account deletion |
| 12. Microsoft OAuth | OneDrive linking via MSAL |
| 13. Dropbox OAuth | Dropbox linking via expo-auth-session |
| 14. Folder Picker | Provider selector, provider-agnostic browsing |
| 15. Backend Auth | Firebase ID token verification middleware |
| 16. Cleanup | Remove old code, fix type errors |
