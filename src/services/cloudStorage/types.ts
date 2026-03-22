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
  uploadFile(localUri: string, fileName: string, mimeType: string, folderId: string, accessToken: string): Promise<CloudFile>;
}
