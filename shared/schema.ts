import { pgTable, text, serial, integer, boolean, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const astrophotographyImages = pgTable("astrophotography_images", {
  id: serial("id").primaryKey(),
  immichId: text("immich_id").unique(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  fullUrl: text("full_url"),
  captureDate: timestamp("capture_date"),
  
  // Camera settings
  focalLength: real("focal_length"),
  aperture: text("aperture"),
  iso: integer("iso"),
  exposureTime: text("exposure_time"),
  frameCount: integer("frame_count"),
  totalIntegration: real("total_integration_hours"),
  
  // Equipment
  telescope: text("telescope"),
  camera: text("camera"),
  mount: text("mount"),
  filters: text("filters"),
  
  // Plate solving data
  plateSolved: boolean("plate_solved").default(false),
  ra: text("ra"),
  dec: text("dec"),
  pixelScale: real("pixel_scale"),
  fieldOfView: text("field_of_view"),
  rotation: real("rotation"),
  astrometryJobId: text("astrometry_job_id"),
  
  // Tags and categories
  tags: text("tags").array(),
  objectType: text("object_type"), // Galaxy, Nebula, Planetary, etc.
  
  // Metadata
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // telescope, camera, mount, filter
  specifications: json("specifications"),
  imageUrl: text("image_url"),
  description: text("description"),
});

export const plateSolvingJobs = pgTable("plate_solving_jobs", {
  id: serial("id").primaryKey(),
  imageId: integer("image_id").references(() => astrophotographyImages.id),
  astrometrySubmissionId: text("astrometry_submission_id"),
  astrometryJobId: text("astrometry_job_id"),
  status: text("status").notNull().default("pending"), // pending, processing, success, failed
  submittedAt: timestamp("submitted_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  result: json("result"),
});

export const insertAstroImageSchema = createInsertSchema(astrophotographyImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

export const insertPlateSolvingJobSchema = createInsertSchema(plateSolvingJobs).omit({
  id: true,
  submittedAt: true,
  completedAt: true,
});

export type AstroImage = typeof astrophotographyImages.$inferSelect;
export type InsertAstroImage = z.infer<typeof insertAstroImageSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type PlateSolvingJob = typeof plateSolvingJobs.$inferSelect;
export type InsertPlateSolvingJob = z.infer<typeof insertPlateSolvingJobSchema>;
