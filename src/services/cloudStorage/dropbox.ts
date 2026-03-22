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
    // We store path_display as the id field so createFolder/uploadFile
    // can use it directly as a path.
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
