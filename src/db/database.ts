import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;
let seedCallback: (() => Promise<void>) | null = null;
let seeded = false;

/** Register a callback to run once after database init (used for seeding defaults). */
export function onDatabaseReady(cb: () => Promise<void>): void {
  seedCallback = cb;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db && seeded) return db;
  if (!db) {
    db = await SQLite.openDatabaseAsync('fieldcam.db');
    await db.execAsync(CREATE_TABLES);
  }
  if (!seeded && seedCallback) {
    seeded = true;
    await seedCallback();
  } else {
    seeded = true;
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) { await db.closeAsync(); db = null; }
}
