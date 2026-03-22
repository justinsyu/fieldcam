global.fetch = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn().mockResolvedValue({
    status: 200,
    body: '{"id":"file-1","name":"photo.jpg","mimeType":"image/jpeg"}',
  }),
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));

import { googleDrive } from '../googleDrive';

describe('googleDrive', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('lists folders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ files: [{ id: 'f1', name: 'Folder A' }] }),
    });

    const folders = await googleDrive.listFolders('root', 'token');

    expect(folders).toHaveLength(1);
    expect(folders[0].id).toBe('f1');
    expect(folders[0].name).toBe('Folder A');
  });

  it('creates a folder', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'folder-new', name: 'New Folder' }),
    });

    const folder = await googleDrive.createFolder('New Folder', 'root', 'token');

    expect(folder.id).toBe('folder-new');
    expect(folder.name).toBe('New Folder');
  });

  it('uploads a file via resumable upload', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (k: string) =>
          k === 'Location' ? 'https://upload.googleapis.com/resumable/123' : null,
      },
    });

    const result = await googleDrive.uploadFile(
      'file:///photo.jpg',
      'photo.jpg',
      'image/jpeg',
      'folder-1',
      'token'
    );

    expect(result.id).toBe('file-1');
    expect(result.name).toBe('photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
  });

  it('throws when listFolders response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(googleDrive.listFolders('root', 'bad-token')).rejects.toThrow(
      'listFolders failed: 401'
    );
  });

  it('throws when upload initiation has no Location header', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: { get: () => null },
    });

    await expect(
      googleDrive.uploadFile('file:///photo.jpg', 'photo.jpg', 'image/jpeg', 'folder-1', 'token')
    ).rejects.toThrow('No Location header');
  });
});
