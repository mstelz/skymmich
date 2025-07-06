import { db, schema } from '../db';
import { eq, and } from 'drizzle-orm';
import type { AstroImage, InsertAstroImage, Equipment, InsertEquipment, ImageEquipment, InsertImageEquipment, PlateSolvingJob, InsertPlateSolvingJob } from "../../../../packages/shared/src/types";

const isProduction = process.env.NODE_ENV === 'production';

// Helper function to parse JSON fields for SQLite
function parseJsonFields(item: any, fields: string[]) {
  if (isProduction) return item;
  const newItem = { ...item };
  for (const field of fields) {
    if (newItem[field] && typeof newItem[field] === 'string') {
      try {
        newItem[field] = JSON.parse(newItem[field]);
      } catch (e) {
        console.error(`Failed to parse JSON for field ${field}:`, newItem[field], e);
      }
    }
  }
  return newItem;
}

class DbStorage {
  // Astrophotography images
  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean; constellation?: string }): Promise<AstroImage[]> {
    const query = db.select().from(isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages);

    if (filters) {
      if (filters.objectType) {
        query.where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).objectType, filters.objectType));
      }
      if (filters.plateSolved !== undefined) {
        query.where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).plateSolved, filters.plateSolved));
      }
      if (filters.constellation) {
        query.where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).constellation, filters.constellation));
      }
    }

    const images = await query.execute();

    const parsedImages = images.map(img => parseJsonFields(img, ['tags']));

    if (filters && filters.tags && filters.tags.length > 0) {
        return parsedImages.filter((image: AstroImage) => {
            const tags = image.tags;
            return filters.tags?.some(tag => tags.includes(tag));
        });
    }

    return parsedImages;
  }

  async getAstroImage(id: number): Promise<AstroImage | undefined> {
    const result = await db.select().from(isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).id, id)).execute();
    return result[0] ? parseJsonFields(result[0], ['tags']) : undefined;
  }

  async getAstroImageByImmichId(immichId: string): Promise<AstroImage | undefined> {
    const result = await db.select().from(isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).immichId, immichId)).execute();
    return result[0] ? parseJsonFields(result[0], ['tags']) : undefined;
  }

  async createAstroImage(image: InsertAstroImage): Promise<AstroImage> {
    const values = {
        ...image,
        tags: isProduction ? image.tags : JSON.stringify(image.tags),
    };
    const result = await db.insert(isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).values(values).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['tags']) : undefined;
  }

  async updateAstroImage(id: number, updates: Partial<InsertAstroImage>): Promise<AstroImage | undefined> {
    const values = {
        ...updates,
        tags: isProduction ? updates.tags : JSON.stringify(updates.tags),
        updatedAt: new Date(),
    };
    const result = await db.update(isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).set(values).where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).id, id)).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['tags']) : undefined;
  }

  async deleteAstroImage(id: number): Promise<boolean> {
    await db.delete(isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).where(eq((isProduction ? schema.astrophotographyImages : schema.sqliteAstrophotographyImages).id, id)).execute();
    return true;
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    const equipment = await db.select().from(isProduction ? schema.equipment : schema.sqliteEquipment).execute();
    return equipment.map(eq => parseJsonFields(eq, ['specifications']));
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const values = {
        ...equipmentData,
        specifications: isProduction ? equipmentData.specifications : JSON.stringify(equipmentData.specifications),
    };
    const result = await db.insert(isProduction ? schema.equipment : schema.sqliteEquipment).values(values).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['specifications']) : undefined;
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const values = {
        ...updates,
        specifications: isProduction ? updates.specifications : JSON.stringify(updates.specifications),
        updatedAt: new Date(),
    };
    const result = await db.update(isProduction ? schema.equipment : schema.sqliteEquipment).set(values).where(eq((isProduction ? schema.equipment : schema.sqliteEquipment).id, id)).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['specifications']) : undefined;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    await db.delete(isProduction ? schema.equipment : schema.sqliteEquipment).where(eq((isProduction ? schema.equipment : schema.sqliteEquipment).id, id)).execute();
    return true;
  }

  // Image Equipment relationships
  async getImageEquipment(imageId: number): Promise<ImageEquipment[]> {
    const imageEquipment = await db.select().from(isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).where(eq((isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).imageId, imageId)).execute();
    return imageEquipment.map(ie => parseJsonFields(ie, ['settings']));
  }

  async getEquipmentForImage(imageId: number): Promise<Equipment[]> {
    const imageEquipment = await this.getImageEquipment(imageId);
    const equipmentIds = imageEquipment.map(ie => ie.equipmentId);
    if (equipmentIds.length === 0) {
        return [];
    }
    const equipment = await db.select().from(isProduction ? schema.equipment : schema.sqliteEquipment).where(eq((isProduction ? schema.equipment : schema.sqliteEquipment).id, equipmentIds[0])).execute();
    return equipment.map(eq => parseJsonFields(eq, ['specifications']));
  }

  async addEquipmentToImage(imageId: number, equipmentId: number, settings?: any, notes?: string): Promise<ImageEquipment> {
    const values = {
        imageId,
        equipmentId,
        settings: isProduction ? settings : JSON.stringify(settings),
        notes,
    };
    const result = await db.insert(isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).values(values).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['settings']) : undefined;
  }

  async removeEquipmentFromImage(imageId: number, equipmentId: number): Promise<boolean> {
    await db.delete(isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).where(and(eq((isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).imageId, imageId), eq((isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).equipmentId, equipmentId))).execute();
    return true;
  }

  async updateImageEquipment(imageId: number, equipmentId: number, updates: Partial<InsertImageEquipment>): Promise<ImageEquipment | undefined> {
    const values = {
        ...updates,
        settings: isProduction ? updates.settings : JSON.stringify(updates.settings),
    };
    const result = await db.update(isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).set(values).where(and(eq((isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).imageId, imageId), eq((isProduction ? schema.imageEquipment : schema.sqliteImageEquipment).equipmentId, equipmentId))).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['settings']) : undefined;
  }

  // Plate solving
  async getPlateSolvingJobs(): Promise<PlateSolvingJob[]> {
    const jobs = await db.select().from(isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).execute();
    return jobs.map(job => parseJsonFields(job, ['result']));
  }

  async getPlateSolvingJob(id: number): Promise<PlateSolvingJob | undefined> {
    const result = await db.select().from(isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).where(eq((isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).id, id)).execute();
    return result[0] ? parseJsonFields(result[0], ['result']) : undefined;
  }

  async getPlateSolvingJobByAstrometryId(astrometryJobId: string): Promise<PlateSolvingJob | undefined> {
    const result = await db.select().from(isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).where(eq((isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).astrometryJobId, astrometryJobId)).execute();
    return result[0] ? parseJsonFields(result[0], ['result']) : undefined;
  }

  async createPlateSolvingJob(job: InsertPlateSolvingJob): Promise<PlateSolvingJob> {
    const values = {
        ...job,
        result: isProduction ? job.result : JSON.stringify(job.result),
    };
    const result = await db.insert(isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).values(values).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['result']) : undefined;
  }

  async updatePlateSolvingJob(id: number, updates: Partial<InsertPlateSolvingJob>): Promise<PlateSolvingJob | undefined> {
    const values = {
        ...updates,
        result: isProduction ? updates.result : JSON.stringify(updates.result),
        completedAt: new Date(),
    };
    const result = await db.update(isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).set(values).where(eq((isProduction ? schema.plateSolvingJobs : schema.sqlitePlateSolvingJobs).id, id)).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['result']) : undefined;
  }

  // Admin settings
  async getAdminSettings(): Promise<any> {
    const settings = await db.select().from(isProduction ? schema.adminSettings : schema.sqliteAdminSettings).execute();
    return settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = isProduction ? setting.value : JSON.parse(setting.value);
      return acc;
    }, {});
  }

  async updateAdminSettings(settings: any): Promise<void> {
    for (const key in settings) {
      const value = isProduction ? settings[key] : JSON.stringify(settings[key]);
      await db.insert(isProduction ? schema.adminSettings : schema.sqliteAdminSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: (isProduction ? schema.adminSettings : schema.sqliteAdminSettings).key, set: { value } })
        .execute();
    }
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    const notifications = await db.select().from(isProduction ? schema.notifications : schema.sqliteNotifications).where(eq((isProduction ? schema.notifications : schema.sqliteNotifications).acknowledged, false)).execute();
    return notifications.map(n => parseJsonFields(n, ['details']));
  }

  async createNotification(notification: any): Promise<any> {
    const values = {
        ...notification,
        details: isProduction ? notification.details : JSON.stringify(notification.details),
    };
    const result = await db.insert(isProduction ? schema.notifications : schema.sqliteNotifications).values(values).returning().execute();
    return result[0] ? parseJsonFields(result[0], ['details']) : undefined;
  }

  async acknowledgeNotification(id: number): Promise<void> {
    await db.update(isProduction ? schema.notifications : schema.sqliteNotifications).set({ acknowledged: true }).where(eq((isProduction ? schema.notifications : schema.sqliteNotifications).id, id)).execute();
  }

  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await db.delete(isProduction ? schema.notifications : schema.sqliteNotifications).where(and(eq((isProduction ? schema.notifications : schema.sqliteNotifications).acknowledged, true), eq((isProduction ? schema.notifications : schema.sqliteNotifications).createdAt, cutoffDate.toISOString()))).execute();
  }
}

export const storage = new DbStorage();
