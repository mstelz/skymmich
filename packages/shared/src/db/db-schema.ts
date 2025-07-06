import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { pgTable, serial, timestamp, json, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// PostgreSQL schema
export const astrophotographyImages = pgTable('astrophotography_images', {
  id: serial('id').primaryKey(),
  immichId: text('immich_id').unique(),
  title: text('title').notNull(),
  filename: text('filename').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fullUrl: text('full_url'),
  captureDate: timestamp('capture_date'),
  focalLength: real('focal_length'),
  aperture: text('aperture'),
  iso: integer('iso'),
  exposureTime: text('exposure_time'),
  frameCount: integer('frame_count'),
  totalIntegration: real('total_integration_hours'),
  telescope: text('telescope'),
  camera: text('camera'),
  mount: text('mount'),
  filters: text('filters'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  altitude: real('altitude'),
  plateSolved: boolean('plate_solved').default(false),
  ra: text('ra'),
  dec: text('dec'),
  pixelScale: real('pixel_scale'),
  fieldOfView: text('field_of_view'),
  rotation: real('rotation'),
  astrometryJobId: text('astrometry_job_id'),
  tags: text('tags'),
  objectType: text('object_type'),
  constellation: text('constellation'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  specifications: json('specifications'),
  imageUrl: text('image_url'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const imageEquipment = pgTable('image_equipment', {
    id: serial('id').primaryKey(),
    imageId: integer('image_id').references(() => astrophotographyImages.id, { onDelete: 'cascade' }),
    equipmentId: integer('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }),
    settings: json('settings'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const plateSolvingJobs = pgTable('plate_solving_jobs', {
    id: serial('id').primaryKey(),
    imageId: integer('image_id').references(() => astrophotographyImages.id),
    astrometrySubmissionId: text('astrometry_submission_id'),
    astrometryJobId: text('astrometry_job_id'),
    status: text('status').notNull().default('pending'),
    submittedAt: timestamp('submitted_at').defaultNow(),
    completedAt: timestamp('completed_at'),
    result: json('result'),
});

// SQLite schema
export const sqliteAstrophotographyImages = sqliteTable('astrophotography_images', {
    id: integer('id').primaryKey(),
    immichId: text('immich_id').unique(),
    title: text('title').notNull(),
    filename: text('filename').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    fullUrl: text('full_url'),
    captureDate: text('capture_date'),
    focalLength: real('focal_length'),
    aperture: text('aperture'),
    iso: integer('iso'),
    exposureTime: text('exposure_time'),
    frameCount: integer('frame_count'),
    totalIntegration: real('total_integration_hours'),
    telescope: text('telescope'),
    camera: text('camera'),
    mount: text('mount'),
    filters: text('filters'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    altitude: real('altitude'),
    plateSolved: integer('plate_solved', { mode: 'boolean' }).default(false),
    ra: text('ra'),
    dec: text('dec'),
    pixelScale: real('pixel_scale'),
    fieldOfView: text('field_of_view'),
    rotation: real('rotation'),
    astrometryJobId: text('astrometry_job_id'),
    tags: text('tags'), // Stored as a JSON string in SQLite
    objectType: text('object_type'),
    constellation: text('constellation'),
    description: text('description'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
});

export const sqliteEquipment = sqliteTable('equipment', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    specifications: text('specifications'), // Stored as a JSON string
    imageUrl: text('image_url'),
    description: text('description'),
    createdAt: text('created_at'),
    updatedAt: text('updated_at'),
});

export const sqliteImageEquipment = sqliteTable('image_equipment', {
    id: integer('id').primaryKey(),
    imageId: integer('image_id'),
    equipmentId: integer('equipment_id'),
    settings: text('settings'), // Stored as a JSON string
    notes: text('notes'),
    createdAt: text('created_at'),
});

export const sqlitePlateSolvingJobs = sqliteTable('plate_solving_jobs', {
    id: integer('id').primaryKey(),
    imageId: integer('image_id'),
    astrometrySubmissionId: text('astrometry_submission_id'),
    astrometryJobId: text('astrometry_job_id'),
    status: text('status').notNull().default('pending'),
    submittedAt: text('submitted_at'),
    completedAt: text('completed_at'),
    result: text('result'), // Stored as a JSON string
});


