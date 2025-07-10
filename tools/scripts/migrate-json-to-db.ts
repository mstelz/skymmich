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
    await db.insert(schema.sqliteAstrophotographyImages).values({
      ...image,
      tags: JSON.stringify(image.tags),
    });
  }

  // Migrate equipment
  for (const equip of data.equipment) {
    await db.insert(schema.sqliteEquipment).values({
      ...equip,
      specifications: JSON.stringify(equip.specifications),
    });
  }

  // Migrate imageEquipment
  for (const ie of data.imageEquipment) {
    await db.insert(schema.sqliteImageEquipment).values({
        ...ie,
        settings: JSON.stringify(ie.settings),
    });
  }

  // Migrate plateSolvingJobs
  for (const job of data.plateSolvingJobs) {
    await db.insert(schema.sqlitePlateSolvingJobs).values({
        ...job,
        result: JSON.stringify(job.result),
    });
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
