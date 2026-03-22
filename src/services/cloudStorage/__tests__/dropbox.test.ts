global.fetch = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  EncodingType: { Base64: 'base64' },
}));

import { dropbox } from '../dropbox';

describe('dropbox', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('lists folders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        entries: [
          { '.tag': 'folder', id: 'id:f1', name: 'Folder A', path_display: '/Folder A' },
          { '.tag': 'folder', id: 'id:f2', name: 'Folder B', path_display: '/Folder B' },
        ],
        has_more: false,
      }),
    });

    const folders = await dropbox.listFolders('', 'token');
    expect(folders).toHaveLength(2);
    expect(folders[0].id).toBe('/Folder A'); // id stores path_display
    expect(folders[0].path).toBe('/Folder A');
  });

  it('creates a folder', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        metadata: { id: 'id:new', name: 'New', path_display: '/New' },
      }),
    });

    const folder = await dropbox.createFolder('New', '', 'token');
    expect(folder.id).toBe('/New'); // id is path_display for Dropbox
    expect(folder.name).toBe('New');
  });

  it('uploads a file', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'id:file1',
        name: 'photo.jpg',
        path_display: '/Photos/photo.jpg',
      }),
    });

    const result = await dropbox.uploadFile('file:///photo.jpg', 'photo.jpg', 'image/jpeg', '/Photos', 'token');
    expect(result.id).toBe('id:file1');
    expect(result.name).toBe('photo.jpg');
  });

  it('throws when listFolders fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(dropbox.listFolders('', 'bad-token')).rejects.toThrow('listFolders failed: 401');
  });
});
