import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUploadQueue } from '../hooks/useUploadQueue';
import { processUploadQueue } from '../services/uploadWorker';
import type { UploadItem } from '../types/upload';

interface UploadContextValue {
  items: UploadItem[];
  pendingCount: number;
  isUploading: boolean;
  refresh: () => Promise<void>;
  uploadPending: () => Promise<void>;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const queue = useUploadQueue();
  const [isUploading, setIsUploading] = useState(false);

  const uploadPending = useCallback(async () => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      await processUploadQueue();
    } finally {
      setIsUploading(false);
      await queue.refresh();
    }
  }, [queue, isUploading]);

  // Auto-trigger upload when pending items exist
  useEffect(() => {
    if (queue.pendingCount > 0 && !isUploading) {
      uploadPending();
    }
  }, [queue.pendingCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = { ...queue, isUploading, uploadPending };
  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads must be used within UploadProvider');
  return ctx;
}
