import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as pgSchema from '../../../packages/shared/src/db/pg-schema';

let db: any;
let schema: any;
let initialized = false;

async function initializeDatabase() {
  if (initialized) return;

  // Check if DATABASE_URL is provided (PostgreSQL)
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    schema = pgSchema;
    db = pgDrizzle(pool, { schema });
  } else {
    // Fallback to SQLite for development (only if better-sqlite3 is available)
    try {
      console.log('Using SQLite database (development)');
      
      // Dynamic imports to handle missing dependencies gracefully
      const { drizzle: sqliteDrizzle } = await import('drizzle-orm/better-sqlite3');
      const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
      const Database = (await import('better-sqlite3')).default;
      const sqliteSchema = await import('../../../packages/shared/src/db/sqlite-schema');
      
      const sqlite = new Database('local.db');
      schema = sqliteSchema;
      db = sqliteDrizzle(sqlite, { schema });
      
      // Check if tables exist and run migrations if needed
      const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'").all();
      const hasUserTables = tables.length > 0;
      
      if (!hasUserTables) {
        console.log('No tables found, running migrations...');
        try {
          migrate(db, { migrationsFolder: './tools/migrations/sqlite' });
          console.log('Migrations completed successfully');
        } catch (migrationError) {
          console.error('Migration error:', migrationError);
          throw migrationError;
        }
      } else {
        console.log(`Found ${tables.length} existing tables, skipping migrations`);
      }
    } catch (error) {
      throw new Error(
        'No database configuration found. Please set DATABASE_URL environment variable for PostgreSQL connection.'
      );
    }
  }

  initialized = true;
}

// Initialize immediately
await initializeDatabase();

export { db, schema };