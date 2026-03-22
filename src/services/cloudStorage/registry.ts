import type { CloudProvider } from '../../types/auth';
import type { CloudStorageProvider } from './types';
import { googleDrive } from './googleDrive';

const providers: Record<string, CloudStorageProvider> = {
  google: googleDrive,
};

export function getProvider(provider: CloudProvider): CloudStorageProvider {
  const impl = providers[provider];
  if (!impl) throw new Error(`Cloud storage provider "${provider}" is not registered`);
  return impl;
}

export function registerProvider(provider: CloudProvider, impl: CloudStorageProvider): void {
  providers[provider] = impl;
}
