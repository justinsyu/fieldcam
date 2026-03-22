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
