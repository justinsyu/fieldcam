jest.mock('../../db/database', () => ({
  getDatabase: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  }),
}));

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid-profile-1' }));

import { getDatabase } from '../../db/database';
import { profileService } from '../profileService';

describe('profileService', () => {
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

  describe('create', () => {
    it('inserts a new profile and returns it', async () => {
      const profile = await profileService.create({
        name: 'Test Profile',
        description: 'A test profile',
        promptTemplate: 'Summarize: {{extracted_text}}',
        deliveryType: ['same_folder'],
      });

      expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO processing_profiles'),
        expect.arrayContaining(['test-uuid-profile-1', 'Test Profile', 'A test profile'])
      );
      expect(profile.id).toBe('test-uuid-profile-1');
      expect(profile.name).toBe('Test Profile');
      expect(profile.description).toBe('A test profile');
      expect(profile.promptTemplate).toBe('Summarize: {{extracted_text}}');
      expect(profile.deliveryType).toEqual(['same_folder']);
      expect(profile.isActive).toBe(true);
      expect(profile.isTeam).toBe(false);
      expect(profile.isLocked).toBe(false);
    });

    it('uses defaults for optional boolean fields', async () => {
      const profile = await profileService.create({
        name: 'Minimal Profile',
        promptTemplate: 'Process: {{extracted_text}}',
      });

      expect(profile.isActive).toBe(true);
      expect(profile.isTeam).toBe(false);
      expect(profile.isLocked).toBe(false);
      expect(profile.description).toBeNull();
      expect(profile.deliveryDestination).toBeNull();
    });

    it('respects isActive=false when provided', async () => {
      const profile = await profileService.create({
        name: 'Inactive Profile',
        promptTemplate: 'Process: {{extracted_text}}',
        isActive: false,
      });

      expect(profile.isActive).toBe(false);
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([0])
      );
    });
  });

  describe('getAll', () => {
    it('returns empty array when no profiles exist', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      const profiles = await profileService.getAll();
      expect(profiles).toHaveLength(0);
      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC')
      );
    });

    it('maps db rows to ProcessingProfile objects', async () => {
      const mockRow = {
        id: 'profile-row-1',
        name: 'My Profile',
        description: 'Some description',
        prompt_template: 'Do something: {{extracted_text}}',
        delivery_type: 'email',
        delivery_destination: 'user@example.com',
        is_active: 1,
        is_team: 0,
        is_locked: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };
      mockDb.getAllAsync.mockResolvedValueOnce([mockRow]);

      const profiles = await profileService.getAll();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe('profile-row-1');
      expect(profiles[0].name).toBe('My Profile');
      expect(profiles[0].promptTemplate).toBe('Do something: {{extracted_text}}');
      expect(profiles[0].deliveryType).toEqual(['email']);
      expect(profiles[0].deliveryDestination).toBe('user@example.com');
      expect(profiles[0].isActive).toBe(true);
      expect(profiles[0].isTeam).toBe(false);
      expect(profiles[0].isLocked).toBe(true);
    });
  });

  describe('seedDefaults', () => {
    it('always runs 3 INSERT OR IGNORE statements', async () => {
      await profileService.seedDefaults();

      expect(mockDb.runAsync).toHaveBeenCalledTimes(3);
      // All 3 use INSERT OR IGNORE so duplicates are safely ignored
      for (const call of mockDb.runAsync.mock.calls) {
        expect(call[0]).toContain('INSERT OR IGNORE');
      }
    });

    it('seeds profiles with expected names and fixed IDs', async () => {
      await profileService.seedDefaults();

      const calls = mockDb.runAsync.mock.calls;
      const insertedNames = calls.map((call: unknown[]) => (call[1] as unknown[])[1]);
      expect(insertedNames).toContain('Poster Summary');
      expect(insertedNames).toContain('Slide Notes');
      expect(insertedNames).toContain('Business Card');

      const insertedIds = calls.map((call: unknown[]) => (call[1] as unknown[])[0]);
      expect(insertedIds).toContain('00000000-0000-0000-0000-000000000001');
      expect(insertedIds).toContain('00000000-0000-0000-0000-000000000002');
      expect(insertedIds).toContain('00000000-0000-0000-0000-000000000003');
    });
  });

  describe('update', () => {
    it('builds dynamic SET clause for provided fields', async () => {
      await profileService.update('profile-1', { isActive: false, name: 'Updated Name' });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE processing_profiles SET'),
        expect.arrayContaining(['Updated Name', 0, 'profile-1'])
      );
    });
  });

  describe('delete', () => {
    it('deletes only unlocked profiles', async () => {
      await profileService.delete('profile-1');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('is_locked = 0'),
        ['profile-1']
      );
    });
  });
});
