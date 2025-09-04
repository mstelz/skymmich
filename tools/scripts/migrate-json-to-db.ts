import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../../packages/shared/src/db/sqlite-schema';
import { readFileSync } from 'fs';

const sqlite = new Database('local.db');
const db = drizzle(sqlite, { schema });

const data = JSON.parse(readFileSync('./data/storage.json', 'utf-8'));

async function migrate() {
  console.log('Starting migration...');

  // Migrate astroImages
  for (const image of data.astroImages) {
    await db.insert(schema.astrophotographyImages).values({
      ...image,
      tags: image.tags,
    });
  }

  // Migrate equipment
  for (const equip of data.equipment) {
    await db.insert(schema.equipment).values({
      ...equip,
      specifications: equip.specifications,
    });
  }

  // Migrate imageEquipment
  for (const ie of data.imageEquipment) {
    await db.insert(schema.imageEquipment).values({
        ...ie,
        settings: ie.settings,
    });
  }

  // Migrate plateSolvingJobs
  for (const job of data.plateSolvingJobs) {
    await db.insert(schema.plateSolvingJobs).values({
        ...job,
        result: job.result,
    });
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
