import { useState, useEffect, useCallback } from 'react';
import { uploadQueue } from '../services/uploadQueue';
import type { UploadItem } from '../types/upload';

export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    const all = await uploadQueue.getAll();
    setItems(all);
    setPendingCount(all.filter(i => i.status === 'pending' || i.status === 'uploading').length);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, pendingCount, refresh };
}
