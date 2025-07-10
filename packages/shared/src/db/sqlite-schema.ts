import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

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

export const sqliteAdminSettings = sqliteTable('admin_settings', {
    id: integer('id').primaryKey(),
    key: text('key').unique().notNull(),
    value: text('value'), // Stored as a JSON string
});

export const sqliteNotifications = sqliteTable('notifications', {
    id: integer('id').primaryKey(),
    type: text('type').notNull(), // 'error' | 'warning' | 'info' | 'success'
    title: text('title').notNull(),
    message: text('message').notNull(),
    details: text('details'), // Stored as a JSON string
    acknowledged: integer('acknowledged', { mode: 'boolean' }).default(false),
    createdAt: text('created_at'),
});