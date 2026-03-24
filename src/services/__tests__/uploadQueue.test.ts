jest.mock('../../db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  }),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid-123' }));

import { getDatabase } from '../../db/database';
import { uploadQueue } from '../uploadQueue';

describe('uploadQueue', () => {
  let mockDb: {
    execAsync: jest.Mock;
    getAllAsync: jest.Mock;
    runAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    closeAsync: jest.Mock;
  };

  beforeEach(async () => {
    mockDb = await (getDatabase as jest.Mock)();
    mockDb.execAsync.mockClear();
    mockDb.getAllAsync.mockClear().mockResolvedValue([]);
    mockDb.runAsync.mockClear().mockResolvedValue({ lastInsertRowId: 1, changes: 1 });
    mockDb.getFirstAsync.mockClear().mockResolvedValue(null);
    mockDb.closeAsync.mockClear();
  });

  it('enqueue inserts a new item and returns it', async () => {
    const item = await uploadQueue.enqueue({
      localUri: 'file:///test/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      provider: 'google',
      folderId: 'folder-1',
      folderName: 'My Folder',
    });

    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    expect(item.id).toBe('test-uuid-123');
    expect(item.localUri).toBe('file:///test/photo.jpg');
    expect(item.status).toBe('pending');
    expect(item.provider).toBe('google');
    expect(item.retryCount).toBe(0);
    expect(item.uploadedAt).toBeNull();
    expect(item.error).toBeNull();
  });

  it('getPending returns mapped items', async () => {
    const mockRow = {
      id: 'row-1',
      local_uri: 'file:///img.jpg',
      file_name: 'img.jpg',
      mime_type: 'image/jpeg',
      file_size: 512,
      status: 'pending',
      provider: 'google',
      folder_id: 'root',
      folder_name: 'Root',
      created_at: '2024-01-01T00:00:00.000Z',
      uploaded_at: null,
      error: null,
      retry_count: 0,
      cloud_file_id: null,
      process_with_profile: null,
    };
    mockDb.getAllAsync.mockResolvedValueOnce([mockRow]);

    const items = await uploadQueue.getPending();

    expect(mockDb.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("status IN ('pending', 'failed', 'uploading')")
    );
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('row-1');
    expect(items[0].localUri).toBe('file:///img.jpg');
    expect(items[0].folderId).toBe('root');
  });

  it('updateStatus updates to failed and increments retry_count', async () => {
    await uploadQueue.updateStatus('test-id', 'failed', 'Network error');

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('retry_count = retry_count + 1'),
      ['failed', 'Network error', 'test-id']
    );
  });

  it('updateStatus updates to completed and sets uploaded_at', async () => {
    await uploadQueue.updateStatus('test-id', 'completed', undefined, 'cloud-file-99');

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('uploaded_at'),
      expect.arrayContaining(['completed', 'cloud-file-99', 'test-id'])
    );
  });
});
