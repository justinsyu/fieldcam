import * as FileSystem from 'expo-file-system/legacy';
import type { CloudStorageProvider, CloudFolder, CloudFile } from './types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

const googleDriveProvider: CloudStorageProvider = {
  async listFolders(parentId: string, accessToken: string): Promise<CloudFolder[]> {
    const query = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    );
    const url = `${DRIVE_API}/files?q=${query}&fields=files(id,name)`;

    const response = await fetch(url, {
      headers: authHeader(accessToken),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`listFolders failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return (data.files as { id: string; name: string }[]).map((f) => ({
      id: f.id,
      name: f.name,
      path: f.name,
    }));
  },

  async createFolder(name: string, parentId: string, accessToken: string): Promise<CloudFolder> {
    const response = await fetch(`${DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        ...authHeader(accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`createFolder failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    return { id: data.id, name: data.name, path: data.name };
  },

  async uploadFile(
    localUri: string,
    fileName: string,
    mimeType: string,
    folderId: string,
    accessToken: string
  ): Promise<CloudFile> {
    // Step 1: Initiate resumable upload session
    const initResponse = await fetch(
      `${UPLOAD_API}/files?uploadType=resumable`,
      {
        method: 'POST',
        headers: {
          ...authHeader(accessToken),
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
        },
        body: JSON.stringify({
          name: fileName,
          parents: [folderId],
        }),
      }
    );

    if (!initResponse.ok) {
      const text = await initResponse.text();
      throw new Error(`uploadFile initiation failed: ${initResponse.status} ${text}`);
    }

    const uploadUri = initResponse.headers.get('Location');
    if (!uploadUri) {
      throw new Error('No Location header returned from resumable upload initiation');
    }

    // Step 2: Upload the file content
    const uploadResult = await FileSystem.uploadAsync(uploadUri, localUri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    const parsed = JSON.parse(uploadResult.body) as {
      id: string;
      name: string;
      mimeType: string;
      webViewLink?: string;
    };

    return {
      id: parsed.id,
      name: parsed.name,
      mimeType: parsed.mimeType,
      webViewLink: parsed.webViewLink,
    };
  },
};

export { googleDriveProvider as googleDrive };
