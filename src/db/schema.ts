export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS upload_queue (
    id TEXT PRIMARY KEY,
    local_uri TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
    file_size INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    provider TEXT NOT NULL,
    folder_id TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    uploaded_at TEXT,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    cloud_file_id TEXT,
    process_with_profile TEXT,
    annotations TEXT
  );

  CREATE TABLE IF NOT EXISTS processing_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    delivery_type TEXT NOT NULL DEFAULT 'same_folder',
    delivery_destination TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_team INTEGER NOT NULL DEFAULT 0,
    is_locked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_upload_status ON upload_queue(status);
  CREATE INDEX IF NOT EXISTS idx_upload_created ON upload_queue(created_at DESC);
`;
