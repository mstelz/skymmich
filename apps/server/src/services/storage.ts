import { db, schema } from '../db';
import { eq, and, inArray, lte } from 'drizzle-orm';
import type { AstroImage, InsertAstroImage, Equipment, InsertEquipment, ImageEquipment, InsertImageEquipment, PlateSolvingJob, InsertPlateSolvingJob } from "../../../../packages/shared/src/types";

class DbStorage {
  // Astrophotography images
  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean; constellation?: string }): Promise<AstroImage[]> {
    const query = db.select().from(schema.astrophotographyImages);

    if (filters) {
      if (filters.objectType) {
        query.where(eq(schema.astrophotographyImages.objectType, filters.objectType));
      }
      if (filters.plateSolved !== undefined) {
        query.where(eq(schema.astrophotographyImages.plateSolved, filters.plateSolved));
      }
      if (filters.constellation) {
        query.where(eq(schema.astrophotographyImages.constellation, filters.constellation));
      }
    }

    const images = await query.execute();

    if (filters && filters.tags && filters.tags.length > 0) {
        return images.filter((image: AstroImage) => {
            const tags = image.tags;
            return filters.tags?.some(tag => tags?.includes(tag));
        });
    }

    return images;
  }

  async getAstroImage(id: number): Promise<AstroImage | undefined> {
    const result = await db.select().from(schema.astrophotographyImages).where(eq(schema.astrophotographyImages.id, id)).execute();
    return result[0] || undefined;
  }

  async getAstroImageByImmichId(immichId: string): Promise<AstroImage | undefined> {
    const result = await db.select().from(schema.astrophotographyImages).where(eq(schema.astrophotographyImages.immichId, immichId)).execute();
    return result[0] || undefined;
  }

  async createAstroImage(image: InsertAstroImage): Promise<AstroImage> {
    const result = await db.insert(schema.astrophotographyImages).values(image).returning().execute();
    if (!result[0]) {
      throw new Error('Failed to create astro image');
    }
    return result[0];
  }

  async updateAstroImage(id: number, updates: Partial<InsertAstroImage>): Promise<AstroImage | undefined> {
    const values = {
        ...updates,
        updatedAt: new Date(),
    };
    const result = await db.update(schema.astrophotographyImages).set(values).where(eq(schema.astrophotographyImages.id, id)).returning().execute();
    return result[0] || undefined;
  }

  async deleteAstroImage(id: number): Promise<boolean> {
    await db.delete(schema.astrophotographyImages).where(eq(schema.astrophotographyImages.id, id)).execute();
    return true;
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    const equipment = await db.select().from(schema.equipment).execute();
    return equipment;
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const values = {
        ...equipmentData,
        specifications: equipmentData.specifications,
    };
    const result = await db.insert(schema.equipment).values(values).returning().execute();
    if (!result[0]) {
      throw new Error('Failed to create equipment');
    }
    return result[0];
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const values = {
        ...updates,
        specifications: updates.specifications,
        updatedAt: new Date(),
    };
    const result = await db.update(schema.equipment).set(values).where(eq((schema.equipment).id, id)).returning().execute();
    return result[0] ? result[0] : undefined;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    await db.delete(schema.equipment).where(eq((schema.equipment).id, id)).execute();
    return true;
  }

  // Image Equipment relationships
  async getImageEquipment(imageId: number): Promise<ImageEquipment[]> {
    const imageEquipment = await db.select().from(schema.imageEquipment).where(eq((schema.imageEquipment).imageId, imageId)).execute();
    return imageEquipment;
  }

  async getEquipmentForImage(imageId: number): Promise<Equipment[]> {
    const imageEquipment = await this.getImageEquipment(imageId);
    const equipmentIds = imageEquipment.map(ie => ie.equipmentId);
    if (equipmentIds.length === 0) {
        return [];
    }
    const equipment = await db.select().from(schema.equipment).where(inArray((schema.equipment).id, equipmentIds)).execute();
    return equipment;
  }

  async addEquipmentToImage(imageId: number, equipmentId: number, settings?: any, notes?: string): Promise<ImageEquipment> {
    const values = {
        imageId,
        equipmentId,
        settings: settings,
        notes,
    };
    const result = await db.insert(schema.imageEquipment).values(values).returning().execute();
    if (!result[0]) {
      throw new Error('Failed to add equipment to image');
    }
    return result[0];
  }

  async removeEquipmentFromImage(imageId: number, equipmentId: number): Promise<boolean> {
    await db.delete(schema.imageEquipment).where(and(eq((schema.imageEquipment).imageId, imageId), eq((schema.imageEquipment).equipmentId, equipmentId))).execute();
    return true;
  }

  async updateImageEquipment(imageId: number, equipmentId: number, updates: Partial<InsertImageEquipment>): Promise<ImageEquipment | undefined> {
    const values = {
        ...updates,
        settings: updates.settings,
    };
    const result = await db.update(schema.imageEquipment).set(values).where(and(eq((schema.imageEquipment).imageId, imageId), eq((schema.imageEquipment).equipmentId, equipmentId))).returning().execute();
    return result[0] ? result[0] : undefined;
  }

  // Plate solving
  async getPlateSolvingJobs(): Promise<PlateSolvingJob[]> {
    const jobs = await db.select().from(schema.plateSolvingJobs).execute();
    return jobs;
  }

  async getPlateSolvingJob(id: number): Promise<PlateSolvingJob | undefined> {
    const result = await db.select().from(schema.plateSolvingJobs).where(eq((schema.plateSolvingJobs).id, id)).execute();
    return result[0] ? result[0] : undefined;
  }

  async getPlateSolvingJobByAstrometryId(astrometryJobId: string): Promise<PlateSolvingJob | undefined> {
    const result = await db.select().from(schema.plateSolvingJobs).where(eq((schema.plateSolvingJobs).astrometryJobId, astrometryJobId)).execute();
    return result[0] ? result[0] : undefined;
  }

  async createPlateSolvingJob(job: InsertPlateSolvingJob): Promise<PlateSolvingJob> {
    const values = {
        ...job,
        result: job.result,
    };
    const result = await db.insert(schema.plateSolvingJobs).values(values).returning().execute();
    if (!result[0]) {
      throw new Error('Failed to create plate solving job');
    }
    return result[0];
  }

  async updatePlateSolvingJob(id: number, updates: Partial<InsertPlateSolvingJob>): Promise<PlateSolvingJob | undefined> {
    const values = {
        ...updates,
        result: updates.result,
        completedAt: new Date(),
    };
    const result = await db.update(schema.plateSolvingJobs).set(values).where(eq((schema.plateSolvingJobs).id, id)).returning().execute();
    return result[0] ? result[0] : undefined;
  }

  // Admin settings
  async getAdminSettings(): Promise<any> {
    const settings = await db.select().from(schema.adminSettings).execute();
    return settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
  }

  async updateAdminSettings(settings: any): Promise<void> {
    for (const key in settings) {
      const value = settings[key];
      await db.insert(schema.adminSettings)
        .values({ key, value })
        .onConflictDoUpdate({ target: (schema.adminSettings).key, set: { value } })
        .execute();
    }
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    const notifications = await db.select().from(schema.notifications).where(eq((schema.notifications).acknowledged, false)).execute();
    return notifications;
  }

  async createNotification(notification: any): Promise<any> {
    const values = {
        ...notification,
        details: notification.details,
    };
    const result = await db.insert(schema.notifications).values(values).returning().execute();
    return result[0] ? result[0] : undefined;
  }

  async acknowledgeNotification(id: number): Promise<void> {
    await db.update(schema.notifications).set({ acknowledged: true }).where(eq((schema.notifications).id, id)).execute();
  }

  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await db.delete(schema.notifications).where(and(eq(schema.notifications.acknowledged, true), lte(schema.notifications.createdAt, cutoffDate))).execute();
  }

  // Stats
  async getStats(): Promise<any> {
    try {
      const images = await this.getAstroImages();
      const equipment = await this.getEquipment();
      const plateSolvingJobs = await this.getPlateSolvingJobs();
      
      const plateSolvedImages = images.filter(img => img.plateSolved).length;
      const pendingJobs = plateSolvingJobs.filter(job => job.status === 'pending').length;
      const successfulJobs = plateSolvingJobs.filter(job => job.status === 'success').length;
      const failedJobs = plateSolvingJobs.filter(job => job.status === 'failed').length;
      
      // Calculate total integration time
      const totalIntegrationHours = images.reduce((total, img) => {
        return total + (img.totalIntegration || 0);
      }, 0);
      
      // Get object type distribution
      const objectTypeCounts: Record<string, number> = {};
      images.forEach(img => {
        const type = img.objectType || 'Unknown';
        objectTypeCounts[type] = (objectTypeCounts[type] || 0) + 1;
      });
      
      return {
        totalImages: images.length,
        plateSolvedImages,
        totalEquipment: equipment.length,
        totalIntegrationHours: Math.round(totalIntegrationHours * 100) / 100,
        objectTypeCounts,
        plateSolvingStats: {
          total: plateSolvingJobs.length,
          pending: pendingJobs,
          successful: successfulJobs,
          failed: failedJobs
        }
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      throw error;
    }
  }
}

export const storage = new DbStorage();
