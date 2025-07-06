import { pgTable, serial, text, timestamp, real, integer, boolean, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

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
  tags: text('tags').array(),
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

export const adminSettings = pgTable('admin_settings', {
    id: serial('id').primaryKey(),
    key: text('key').unique().notNull(),
    value: json('value'),
});

export const notifications = pgTable('notifications', {
    id: serial('id').primaryKey(),
    type: text('type').notNull(), // 'error' | 'warning' | 'info' | 'success'
    title: text('title').notNull(),
    message: text('message').notNull(),
    details: json('details'),
    acknowledged: boolean('acknowledged').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});


// Zod schemas for validation
export const insertAstroImageSchema = createInsertSchema(astrophotographyImages);
export const insertEquipmentSchema = createInsertSchema(equipment);
export const insertImageEquipmentSchema = createInsertSchema(imageEquipment);
export const insertPlateSolvingJobSchema = createInsertSchema(plateSolvingJobs);

export type AstroImage = typeof astrophotographyImages.$inferSelect;
export type InsertAstroImage = z.infer<typeof insertAstroImageSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type ImageEquipment = typeof imageEquipment.$inferSelect;
export type InsertImageEquipment = z.infer<typeof insertImageEquipmentSchema>;
export type PlateSolvingJob = typeof plateSolvingJobs.$inferSelect;
export type InsertPlateSolvingJob = z.infer<typeof insertPlateSolvingJobSchema>;
