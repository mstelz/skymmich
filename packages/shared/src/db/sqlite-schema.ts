import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const astrophotographyImages = sqliteTable('astrophotography_images', {
    id: integer('id').primaryKey(),
    immichId: text('immich_id').unique(),
    title: text('title').notNull(),
    filename: text('filename').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    fullUrl: text('full_url'),
    captureDate: integer('capture_date', { mode: 'timestamp' }),
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
    tags: text('tags', { mode: 'json' }),
    objectType: text('object_type'),
    constellation: text('constellation'),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const equipment = sqliteTable('equipment', {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(),
    specifications: text('specifications', { mode: 'json' }),
    imageUrl: text('image_url'),
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const imageEquipment = sqliteTable('image_equipment', {
    id: integer('id').primaryKey(),
    imageId: integer('image_id'),
    equipmentId: integer('equipment_id'),
    settings: text('settings', { mode: 'json' }),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const plateSolvingJobs = sqliteTable('plate_solving_jobs', {
    id: integer('id').primaryKey(),
    imageId: integer('image_id'),
    astrometrySubmissionId: text('astrometry_submission_id'),
    astrometryJobId: text('astrometry_job_id'),
    status: text('status').notNull().default('pending'),
    submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    result: text('result', { mode: 'json' }),
});

export const adminSettings = sqliteTable('admin_settings', {
    id: integer('id').primaryKey(),
    key: text('key').unique().notNull(),
    value: text('value', { mode: 'json' }),
});

export const notifications = sqliteTable('notifications', {
    id: integer('id').primaryKey(),
    type: text('type').notNull(), // 'error' | 'warning' | 'info' | 'success'
    title: text('title').notNull(),
    message: text('message').notNull(),
    details: text('details', { mode: 'json' }),
    acknowledged: integer('acknowledged', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});