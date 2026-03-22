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
