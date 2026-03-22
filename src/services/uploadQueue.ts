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
}

interface DbRow {
  id: string;
  local_uri: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: string;
  provider: string;
  folder_id: string;
  folder_name: string;
  created_at: string;
  uploaded_at: string | null;
  error: string | null;
  retry_count: number;
  cloud_file_id: string | null;
  process_with_profile: string | null;
}

function rowToUploadItem(row: DbRow): UploadItem {
  return {
    id: row.id,
    localUri: row.local_uri,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    status: row.status as UploadStatus,
    provider: row.provider as CloudProvider,
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
  async enqueue(params: EnqueueParams): Promise<UploadItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO upload_queue
        (id, local_uri, file_name, mime_type, file_size, status, provider, folder_id, folder_name, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [id, params.localUri, params.fileName, params.mimeType, params.fileSize,
       params.provider, params.folderId, params.folderName, now]
    );

    return {
      id,
      localUri: params.localUri,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      status: 'pending',
      provider: params.provider,
      folderId: params.folderId,
      folderName: params.folderName,
      createdAt: now,
      uploadedAt: null,
      error: null,
      retryCount: 0,
      cloudFileId: null,
      processWithProfile: null,
    };
  },

  async getPending(): Promise<UploadItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      `SELECT * FROM upload_queue WHERE status IN ('pending', 'failed') AND retry_count < 5 ORDER BY created_at ASC`
    );
    return rows.map(rowToUploadItem);
  },

  async getAll(): Promise<UploadItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      `SELECT * FROM upload_queue ORDER BY created_at DESC LIMIT 100`
    );
    return rows.map(rowToUploadItem);
  },

  async updateStatus(
    id: string,
    status: UploadStatus,
    error?: string,
    cloudFileId?: string
  ): Promise<void> {
    const db = await getDatabase();
    const uploadedAt = status === 'completed' ? new Date().toISOString() : null;

    if (status === 'failed') {
      await db.runAsync(
        `UPDATE upload_queue SET status = ?, error = ?, retry_count = retry_count + 1 WHERE id = ?`,
        [status, error ?? null, id]
      );
    } else if (status === 'completed') {
      await db.runAsync(
        `UPDATE upload_queue SET status = ?, uploaded_at = ?, cloud_file_id = ?, error = NULL WHERE id = ?`,
        [status, uploadedAt, cloudFileId ?? null, id]
      );
    } else {
      await db.runAsync(
        `UPDATE upload_queue SET status = ? WHERE id = ?`,
        [status, id]
      );
    }
  },

  async clearHistory(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM upload_queue WHERE status = 'completed'`);
  },

  async deleteItem(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM upload_queue WHERE id = ?`, [id]);
  },
};
