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

    // Diagnostic: check token scopes and Drive API access
    if (item.provider === 'google') {
      const diag = await diagnoseDriveAccess(accessToken);
      if (diag) {
        // If diagnostic found an issue, fail with helpful message
        await uploadQueue.updateStatus(item.id, 'failed', diag);
        return;
      }
    }

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
    console.error('[UploadWorker] Upload failed:', message);
    await uploadQueue.updateStatus(item.id, 'failed', message);
  }
}

/** Returns an error message if Drive access has issues, null if OK */
async function diagnoseDriveAccess(accessToken: string): Promise<string | null> {
  try {
    // Check what scopes the token actually has
    const tokenInfo = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    const tokenData = await tokenInfo.json();
    const scopes: string = tokenData.scope ?? '';
    console.log('[UploadWorker] Token scopes:', scopes);

    if (tokenData.error) {
      return `Token invalid: ${tokenData.error_description}`;
    }

    const hasDriveScope = scopes.includes('drive');
    if (!hasDriveScope) {
      return `Token missing Drive scope. Scopes: ${scopes}. Please disconnect and reconnect Google Drive in Settings.`;
    }

    // Check if Drive API is accessible
    const driveCheck = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!driveCheck.ok) {
      const errBody = await driveCheck.text();
      return `Drive API error ${driveCheck.status}: ${errBody}`;
    }

    console.log('[UploadWorker] Drive access OK');
    return null;
  } catch (e) {
    console.error('[UploadWorker] Diagnostic error:', e);
    return null; // Don't block on diagnostic failure
  }
}
