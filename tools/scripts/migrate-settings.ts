import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../../packages/shared/src/db/sqlite-schema';
import { readFileSync } from 'fs';

const sqlite = new Database('local.db');
const db = drizzle(sqlite, { schema });

const data = JSON.parse(readFileSync('./data/storage.json.bak', 'utf-8'));

async function migrate() {
  console.log('Starting settings and notifications migration...');

  // Migrate adminSettings
  if (data.adminSettings) {
    for (const key in data.adminSettings) {
      await db.insert(schema.adminSettings).values({
        key,
        value: data.adminSettings[key],
      });
    }
  }

  // Migrate notifications
  if (data.notifications) {
    for (const notification of data.notifications) {
      await db.insert(schema.notifications).values({
        ...notification,
        details: notification.details,
      });
    }
  }

  console.log('Settings and notifications migration complete!');
}

migrate().catch(console.error);
