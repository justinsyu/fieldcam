import React, { createContext, useContext } from 'react';
import { useUploadQueue } from '../hooks/useUploadQueue';
import type { UploadItem } from '../types/upload';

interface UploadContextValue {
  items: UploadItem[];
  pendingCount: number;
  refresh: () => Promise<void>;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const queue = useUploadQueue();
  return <UploadContext.Provider value={queue}>{children}</UploadContext.Provider>;
}

export function useUploads() {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads must be used within UploadProvider');
  return ctx;
}
