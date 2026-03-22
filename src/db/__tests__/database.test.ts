jest.mock('expo-sqlite', () => {
  const mockDb = {
    execAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    closeAsync: jest.fn(),
  };
  return { openDatabaseAsync: jest.fn().mockResolvedValue(mockDb) };
});

import { getDatabase } from '../database';

describe('database', () => {
  it('opens and initializes the database', async () => {
    const db = await getDatabase();
    expect(db).toBeDefined();
    expect(db.execAsync).toHaveBeenCalled();
  });
});
