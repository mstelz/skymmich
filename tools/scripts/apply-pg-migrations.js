import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const connection = postgres(databaseUrl);
  const db = drizzle(connection);

  try {
    console.log('Creating tables if they don\'t exist...');
    
    // Create tables using SQL DDL since we don't have migration files
    await connection`
      CREATE TABLE IF NOT EXISTS astrophotography_images (
        id SERIAL PRIMARY KEY,
        immich_id TEXT UNIQUE,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        thumbnail_url TEXT,
        full_url TEXT,
        original_path TEXT,
        capture_date TIMESTAMP,
        focal_length REAL,
        aperture TEXT,
        iso INTEGER,
        exposure_time TEXT,
        frame_count INTEGER,
        total_integration_hours REAL,
        telescope TEXT,
        camera TEXT,
        mount TEXT,
        filters TEXT,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        plate_solved BOOLEAN DEFAULT false,
        ra TEXT,
        dec TEXT,
        pixel_scale REAL,
        field_of_view TEXT,
        rotation REAL,
        astrometry_job_id TEXT,
        tags TEXT[],
        object_type TEXT,
        constellation TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        specifications JSON,
        image_url TEXT,
        description TEXT,
        cost REAL,
        acquisition_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS image_equipment (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES astrophotography_images(id) ON DELETE CASCADE,
        equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
        settings JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS plate_solving_jobs (
        id SERIAL PRIMARY KEY,
        image_id INTEGER REFERENCES astrophotography_images(id),
        astrometry_submission_id TEXT,
        astrometry_job_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        result JSON
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value JSON
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        details JSON,
        acknowledged BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        altitude REAL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS image_acquisition (
        id SERIAL PRIMARY KEY,
        image_id INTEGER NOT NULL REFERENCES astrophotography_images(id) ON DELETE CASCADE,
        filter_id INTEGER REFERENCES equipment(id) ON DELETE SET NULL,
        filter_name TEXT,
        frame_count INTEGER NOT NULL,
        exposure_time REAL NOT NULL,
        gain INTEGER,
        "offset" INTEGER,
        binning TEXT,
        sensor_temp REAL,
        date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS equipment_groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await connection`
      CREATE TABLE IF NOT EXISTS equipment_group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES equipment_groups(id) ON DELETE CASCADE,
        equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Migration: Add original_path to astrophotography_images if it doesn't exist
    try {
      await connection`
        ALTER TABLE astrophotography_images ADD COLUMN IF NOT EXISTS original_path TEXT;
      `;
      console.log('Migration: Checked/Added original_path column to astrophotography_images');
    } catch (err) {
      console.error('Migration failed for original_path column:', err.message);
    }

    // Migration: Add cost and acquisition_date to equipment if they don't exist
    try {
      await connection`
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS cost REAL;
      `;
      await connection`
        ALTER TABLE equipment ADD COLUMN IF NOT EXISTS acquisition_date TIMESTAMP;
      `;
      console.log('Migration: Checked/Added cost and acquisition_date columns to equipment');
    } catch (err) {
      console.error('Migration failed for equipment cost/acquisition_date columns:', err.message);
    }

    // Migration: Add created_at to equipment_group_members if it doesn't exist
    try {
      await connection`
        ALTER TABLE equipment_group_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      `;
      console.log('Migration: Checked/Added created_at column to equipment_group_members');
    } catch (err) {
      console.error('Migration failed for equipment_group_members created_at:', err.message);
    }

    console.log('Database tables and migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);