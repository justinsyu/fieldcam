import { onDatabaseReady } from './database';
import { profileService } from '../services/profileService';

// Register seed callback so default profiles are created on first DB access
onDatabaseReady(async () => {
  await profileService.seedDefaults();
});
