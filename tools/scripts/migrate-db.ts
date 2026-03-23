#!/usr/bin/env tsx
/**
 * Database Migration Script — PostgreSQL ↔ SQLite
 *
 * Migrates all data between PostgreSQL and SQLite in either direction.
 *
 * Usage:
 *   # PostgreSQL → SQLite
 *   npx tsx tools/scripts/migrate-db.ts --from postgresql://user:pass@host:5432/skymmich --to sqlite:path/to/skymmich.db
 *
 *   # SQLite → PostgreSQL
 *   npx tsx tools/scripts/migrate-db.ts --from sqlite:path/to/local.db --to postgresql://user:pass@host:5432/skymmich
 *
 * Inside Docker container:
 *   node /app/dist/tools/scripts/migrate-db.js --from postgresql://... --to sqlite:/app/config/skymmich.db
 */

import postgres from 'postgres';
import Database from 'better-sqlite3';

// Tables in insertion order (respects foreign key dependencies)
const TABLE_ORDER = [
  'astrophotography_images',
  'equipment',
  'equipment_groups',
  'admin_settings',
  'notifications',
  'catalog_objects',
  'locations',
  // Junction / dependent tables
  'image_equipment',
  'plate_solving_jobs',
  'image_acquisition',
  'equipment_group_members',
  'user_targets',
];

// Columns with timestamps (PG: Date ↔ SQLite: Unix integer)
const TIMESTAMP_COLUMNS = new Set([
  'capture_date', 'created_at', 'updated_at', 'submitted_at',
  'completed_at', 'acquisition_date', 'date',
]);

// Columns with booleans (PG: boolean ↔ SQLite: 0/1 integer)
const BOOLEAN_COLUMNS = new Set(['plate_solved', 'acknowledged']);

// Columns with JSON (PG: json ↔ SQLite: text)
const JSON_COLUMNS = new Set([
  'specifications', 'settings', 'result', 'details', 'value', 'tags',
]);

// The tags column on astrophotography_images uses PG text[] array, not json
const PG_ARRAY_COLUMNS: Record<string, Set<string>> = {
  'astrophotography_images': new Set(['tags']),
};

interface DbConnection {
  type: 'postgresql' | 'sqlite';
  readAll(table: string): Promise<Record<string, unknown>[]>;
  insertRows(table: string, rows: Record<string, unknown>[]): Promise<number>;
  close(): Promise<void>;
}

function parseConnectionString(connStr: string): { type: 'postgresql' | 'sqlite'; url: string } {
  if (connStr.startsWith('postgresql://') || connStr.startsWith('postgres://')) {
    return { type: 'postgresql', url: connStr };
  }
  if (connStr.startsWith('sqlite:')) {
    return { type: 'sqlite', url: connStr.slice('sqlite:'.length) };
  }
  throw new Error(`Unknown connection string format: ${connStr}. Use postgresql://... or sqlite:path/to/file.db`);
}

function createPgConnection(url: string): DbConnection {
  const sql = postgres(url);

  return {
    type: 'postgresql',

    async readAll(table: string): Promise<Record<string, unknown>[]> {
      const rows = await sql`SELECT * FROM ${sql(table)} ORDER BY id`;
      return rows as Record<string, unknown>[];
    },

    async insertRows(table: string, rows: Record<string, unknown>[]): Promise<number> {
      if (rows.length === 0) return 0;

      let inserted = 0;
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = columns.map(col => {
          const val = row[col];
          // Convert SQLite integer timestamps back to Date
          if (TIMESTAMP_COLUMNS.has(col) && typeof val === 'number') {
            return new Date(val * 1000);
          }
          // Convert SQLite integer booleans back to boolean
          if (BOOLEAN_COLUMNS.has(col) && typeof val === 'number') {
            return val === 1;
          }
          // Convert JSON text back to object for json columns
          if (JSON_COLUMNS.has(col) && typeof val === 'string' && !PG_ARRAY_COLUMNS[table]?.has(col)) {
            try { return JSON.parse(val); } catch { return val; }
          }
          // Convert JSON array string to PG text[] for array columns
          if (PG_ARRAY_COLUMNS[table]?.has(col) && typeof val === 'string') {
            try { return JSON.parse(val); } catch { return val; }
          }
          return val;
        });

        await sql`INSERT INTO ${sql(table)} (${sql(columns)}) VALUES (${sql(values)})`;
        inserted++;
      }

      // Reset the serial sequence to avoid ID conflicts on future inserts
      try {
        await sql`SELECT setval(pg_get_serial_sequence(${table}, 'id'), COALESCE((SELECT MAX(id) FROM ${sql(table)}), 0))`;
      } catch {
        // Table might not have a serial id — ignore
      }

      return inserted;
    },

    async close() {
      await sql.end();
    },
  };
}

function createSqliteConnection(path: string): DbConnection {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF'); // Disable during bulk insert

  return {
    type: 'sqlite',

    async readAll(table: string): Promise<Record<string, unknown>[]> {
      return db.prepare(`SELECT * FROM ${table} ORDER BY id`).all() as Record<string, unknown>[];
    },

    async insertRows(table: string, rows: Record<string, unknown>[]): Promise<number> {
      if (rows.length === 0) return 0;

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);

      const insertMany = db.transaction((rowList: Record<string, unknown>[]) => {
        let count = 0;
        for (const row of rowList) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return null;
            // Convert PG Date timestamps to Unix integer
            if (TIMESTAMP_COLUMNS.has(col) && val instanceof Date) {
              return Math.floor(val.getTime() / 1000);
            }
            // Convert PG boolean to 0/1
            if (BOOLEAN_COLUMNS.has(col) && typeof val === 'boolean') {
              return val ? 1 : 0;
            }
            // Convert PG text[] array to JSON string
            if (PG_ARRAY_COLUMNS[table]?.has(col) && Array.isArray(val)) {
              return JSON.stringify(val);
            }
            // Convert PG json objects to JSON string
            if (JSON_COLUMNS.has(col) && typeof val === 'object') {
              return JSON.stringify(val);
            }
            return val;
          });
          stmt.run(...values);
          count++;
        }
        return count;
      });

      return insertMany(rows);
    },

    async close() {
      db.close();
    },
  };
}

async function migrate(fromStr: string, toStr: string) {
  const from = parseConnectionString(fromStr);
  const to = parseConnectionString(toStr);

  if (from.type === to.type) {
    console.error('Source and target must be different database types (one PostgreSQL, one SQLite).');
    process.exit(1);
  }

  console.log(`\nMigrating: ${from.type} → ${to.type}`);
  console.log(`  From: ${from.type === 'postgresql' ? from.url.replace(/\/\/[^:]*:[^@]*@/, '//****:****@') : from.url}`);
  console.log(`  To:   ${to.type === 'postgresql' ? to.url.replace(/\/\/[^:]*:[^@]*@/, '//****:****@') : to.url}\n`);

  const source = from.type === 'postgresql' ? createPgConnection(from.url) : createSqliteConnection(from.url);
  const target = to.type === 'postgresql' ? createPgConnection(to.url) : createSqliteConnection(to.url);

  try {
    let totalRows = 0;
    const results: { table: string; rows: number }[] = [];

    for (const table of TABLE_ORDER) {
      try {
        const rows = await source.readAll(table);
        if (rows.length === 0) {
          results.push({ table, rows: 0 });
          continue;
        }

        const inserted = await target.insertRows(table, rows);
        results.push({ table, rows: inserted });
        totalRows += inserted;
        console.log(`  ✓ ${table}: ${inserted} rows`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // Table might not exist in source (e.g., older schema) — skip
        if (msg.includes('no such table') || msg.includes('does not exist') || msg.includes('relation')) {
          console.log(`  - ${table}: skipped (table not found in source)`);
          results.push({ table, rows: 0 });
        } else {
          console.error(`  ✗ ${table}: ${msg}`);
          throw error;
        }
      }
    }

    console.log(`\nMigration complete: ${totalRows} total rows across ${results.filter(r => r.rows > 0).length} tables.`);
  } finally {
    await source.close();
    await target.close();
  }
}

// Parse CLI args
const args = process.argv.slice(2);
let fromUrl = '';
let toUrl = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--from' && args[i + 1]) fromUrl = args[++i];
  else if (args[i] === '--to' && args[i + 1]) toUrl = args[++i];
}

if (!fromUrl || !toUrl) {
  console.log(`
Skymmich Database Migration Tool

Migrates all data between PostgreSQL and SQLite in either direction.

Usage:
  npx tsx tools/scripts/migrate-db.ts --from <source> --to <target>

Examples:
  # PostgreSQL → SQLite
  npx tsx tools/scripts/migrate-db.ts \\
    --from postgresql://skymmich:password@localhost:5432/skymmich \\
    --to sqlite:skymmich.db

  # SQLite → PostgreSQL
  npx tsx tools/scripts/migrate-db.ts \\
    --from sqlite:local.db \\
    --to postgresql://skymmich:password@localhost:5432/skymmich

  # Inside Docker container
  node /app/dist/tools/scripts/migrate-db.js \\
    --from postgresql://skymmich:pass@skymmich-db:5432/skymmich \\
    --to sqlite:/app/config/skymmich.db

Note: The target database must already have its schema created (tables must exist).
      Run the application once against the target to initialize the schema before migrating.
`);
  process.exit(1);
}

migrate(fromUrl, toUrl).catch((error) => {
  console.error('\nMigration failed:', error.message);
  process.exit(1);
});
