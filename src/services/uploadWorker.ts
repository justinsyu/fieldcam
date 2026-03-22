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
