import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;
let initialized = false;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db && initialized) return db;
  if (!db) {
    db = await SQLite.openDatabaseAsync('fieldcam.db');
    await db.execAsync(CREATE_TABLES);
  }
  if (!initialized) {
    initialized = true;
    // Seed default profiles once at startup, after tables exist.
    // Import lazily to avoid a circular-dependency at module load time.
    const { profileService } = await import('../services/profileService');
    await profileService.seedDefaults();
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) { await db.closeAsync(); db = null; }
}
