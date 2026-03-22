import * as Crypto from 'expo-crypto';
import { getDatabase } from '../db/database';
import type { ProcessingProfile, DeliveryType } from '../types/profile';

interface CreateParams {
  name: string;
  description?: string | null;
  promptTemplate: string;
  deliveryType?: DeliveryType;
  deliveryDestination?: string | null;
  isActive?: boolean;
  isTeam?: boolean;
  isLocked?: boolean;
}

interface UpdateParams {
  name?: string;
  description?: string | null;
  promptTemplate?: string;
  deliveryType?: DeliveryType;
  deliveryDestination?: string | null;
  isActive?: boolean;
  isTeam?: boolean;
  isLocked?: boolean;
}

interface DbRow {
  id: string;
  name: string;
  description: string | null;
  prompt_template: string;
  delivery_type: string;
  delivery_destination: string | null;
  is_active: number;
  is_team: number;
  is_locked: number;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: DbRow): ProcessingProfile {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    promptTemplate: row.prompt_template,
    deliveryType: row.delivery_type as DeliveryType,
    deliveryDestination: row.delivery_destination,
    isActive: row.is_active === 1,
    isTeam: row.is_team === 1,
    isLocked: row.is_locked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profileService = {
  async create(params: CreateParams): Promise<ProcessingProfile> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const deliveryType = params.deliveryType ?? 'same_folder';
    const isActive = params.isActive !== undefined ? (params.isActive ? 1 : 0) : 1;
    const isTeam = params.isTeam !== undefined ? (params.isTeam ? 1 : 0) : 0;
    const isLocked = params.isLocked !== undefined ? (params.isLocked ? 1 : 0) : 0;

    await db.runAsync(
      `INSERT INTO processing_profiles
        (id, name, description, prompt_template, delivery_type, delivery_destination,
         is_active, is_team, is_locked, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, params.name, params.description ?? null, params.promptTemplate,
       deliveryType, params.deliveryDestination ?? null,
       isActive, isTeam, isLocked, now, now]
    );

    return {
      id,
      name: params.name,
      description: params.description ?? null,
      promptTemplate: params.promptTemplate,
      deliveryType,
      deliveryDestination: params.deliveryDestination ?? null,
      isActive: isActive === 1,
      isTeam: isTeam === 1,
      isLocked: isLocked === 1,
      createdAt: now,
      updatedAt: now,
    };
  },

  async getAll(): Promise<ProcessingProfile[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      `SELECT * FROM processing_profiles ORDER BY name ASC`
    );
    return rows.map(rowToProfile);
  },

  async getActive(): Promise<ProcessingProfile[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<DbRow>(
      `SELECT * FROM processing_profiles WHERE is_active = 1 ORDER BY name ASC`
    );
    return rows.map(rowToProfile);
  },

  async update(id: string, params: UpdateParams): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (params.name !== undefined) { setClauses.push('name = ?'); values.push(params.name); }
    if (params.description !== undefined) { setClauses.push('description = ?'); values.push(params.description); }
    if (params.promptTemplate !== undefined) { setClauses.push('prompt_template = ?'); values.push(params.promptTemplate); }
    if (params.deliveryType !== undefined) { setClauses.push('delivery_type = ?'); values.push(params.deliveryType); }
    if (params.deliveryDestination !== undefined) { setClauses.push('delivery_destination = ?'); values.push(params.deliveryDestination); }
    if (params.isActive !== undefined) { setClauses.push('is_active = ?'); values.push(params.isActive ? 1 : 0); }
    if (params.isTeam !== undefined) { setClauses.push('is_team = ?'); values.push(params.isTeam ? 1 : 0); }
    if (params.isLocked !== undefined) { setClauses.push('is_locked = ?'); values.push(params.isLocked ? 1 : 0); }

    setClauses.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db.runAsync(
      `UPDATE processing_profiles SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `DELETE FROM processing_profiles WHERE id = ? AND is_locked = 0`,
      [id]
    );
  },

  async seedDefaults(): Promise<void> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM processing_profiles`
    );
    if (row && row.count > 0) return;

    await profileService.create({
      name: 'Poster Summary',
      description: 'Extracts key findings from research posters',
      promptTemplate: 'Extract the key findings, methodology, and conclusions from this research poster. Format as a structured summary with sections for: Title, Objective, Methods, Results, and Conclusions.\n\nText: {{extracted_text}}',
      deliveryType: 'same_folder',
      isActive: true,
      isTeam: false,
      isLocked: false,
    });

    await profileService.create({
      name: 'Slide Notes',
      description: 'Converts slides to structured notes',
      promptTemplate: 'Convert the content from these slides into structured notes. Include main points, sub-points, and any key data or statistics mentioned.\n\nSlide content: {{extracted_text}}\nTimestamp: {{timestamp}}',
      deliveryType: 'same_folder',
      isActive: true,
      isTeam: false,
      isLocked: false,
    });

    await profileService.create({
      name: 'Business Card',
      description: 'Extracts contact info from business cards',
      promptTemplate: 'Extract all contact information from this business card and return it as structured JSON with fields: name, title, company, email, phone, website, address.\n\nCard text: {{extracted_text}}\nFolder: {{folder_name}}',
      deliveryType: 'same_folder',
      isActive: true,
      isTeam: false,
      isLocked: false,
    });
  },
};
