import type { FolderInfo } from './folderService';

interface FieldCamQR {
  fieldcam: string;
  folder?: { provider: string; id: string; name: string };
  profile?: string;
}

export function parseFieldCamQR(data: string): FieldCamQR | null {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.fieldcam || typeof parsed.fieldcam !== 'string') return null;
    return parsed as FieldCamQR;
  } catch {
    return null;
  }
}

export function qrToFolderInfo(qr: FieldCamQR): FolderInfo | null {
  if (!qr.folder) return null;
  return { id: qr.folder.id, name: qr.folder.name, provider: qr.folder.provider };
}
