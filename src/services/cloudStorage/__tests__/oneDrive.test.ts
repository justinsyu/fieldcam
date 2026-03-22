global.fetch = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  EncodingType: { Base64: 'base64' },
}));

import { oneDrive } from '../oneDrive';

describe('oneDrive', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('lists folders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        value: [
          { id: 'f1', name: 'Folder A', parentReference: { path: '/drive/root:' } },
          { id: 'f2', name: 'Folder B', parentReference: { path: '/drive/root:' } },
        ],
      }),
    });

    const folders = await oneDrive.listFolders('root', 'token');
    expect(folders).toHaveLength(2);
    expect(folders[0].id).toBe('f1');
    expect(folders[0].name).toBe('Folder A');
  });

  it('creates a folder', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-folder', name: 'New', parentReference: { path: '/drive/root:' } }),
    });

    const folder = await oneDrive.createFolder('New', 'root', 'token');
    expect(folder.id).toBe('new-folder');
    expect(folder.name).toBe('New');
  });

  it('uploads a file', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'file-1',
        name: 'photo.jpg',
        file: { mimeType: 'image/jpeg' },
        webUrl: 'https://onedrive.live.com/...',
      }),
    });

    const result = await oneDrive.uploadFile('file:///photo.jpg', 'photo.jpg', 'image/jpeg', 'folder-1', 'token');
    expect(result.id).toBe('file-1');
    expect(result.name).toBe('photo.jpg');
  });

  it('throws when listFolders fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(oneDrive.listFolders('root', 'bad-token')).rejects.toThrow('listFolders failed: 401');
  });
});
