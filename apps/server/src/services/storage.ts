import { db, schema } from '../db';
import { eq, and, inArray, lte } from 'drizzle-orm';
import type { AstroImage, InsertAstroImage, Equipment, InsertEquipment, ImageEquipment, InsertImageEquipment, PlateSolvingJob, InsertPlateSolvingJob, Location, InsertLocation, ImageAcquisitionRow, InsertImageAcquisitionRow } from "../../../../packages/shared/src/types";

class DbStorage {
  // Astrophotography images
  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean; constellation?: string; equipmentId?: number }): Promise<AstroImage[]> {
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

    let images = await query.execute();

    if (filters && filters.tags && filters.tags.length > 0) {
      images = images.filter((image: AstroImage) => {
        const tags = image.tags;
        return filters.tags?.some(tag => tags?.includes(tag));
      });
    }

    // Filter by equipment (post-query via image_equipment join)
    if (filters?.equipmentId) {
      const imageEquipmentRows = await db.select().from(schema.imageEquipment)
        .where(eq(schema.imageEquipment.equipmentId, filters.equipmentId)).execute();
      const imageIds = new Set(imageEquipmentRows.map((r: any) => r.imageId));
      images = images.filter((img: AstroImage) => imageIds.has(img.id));
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
    // Clean up related data (explicit for SQLite which lacks cascade, safe no-op if already cascaded in PG)
    await db.delete(schema.plateSolvingJobs).where(eq(schema.plateSolvingJobs.imageId, id)).execute();
    await db.delete(schema.imageEquipment).where(eq(schema.imageEquipment.imageId, id)).execute();
    await db.delete(schema.imageAcquisition).where(eq(schema.imageAcquisition.imageId, id)).execute();
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
    await this.recomputeImageSummary(imageId);
    return result[0];
  }

  async removeEquipmentFromImage(imageId: number, equipmentId: number): Promise<boolean> {
    await db.delete(schema.imageEquipment).where(and(eq((schema.imageEquipment).imageId, imageId), eq((schema.imageEquipment).equipmentId, equipmentId))).execute();
    await this.recomputeImageSummary(imageId);
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

  async acknowledgeAllNotifications(): Promise<void> {
    await db.update(schema.notifications).set({ acknowledged: true }).where(eq((schema.notifications).acknowledged, false)).execute();
  }

  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await db.delete(schema.notifications).where(and(eq(schema.notifications.acknowledged, true), lte(schema.notifications.createdAt, cutoffDate))).execute();
  }

  // Locations
  async getLocations(): Promise<Location[]> {
    return await db.select().from(schema.locations).execute();
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const result = await db.select().from(schema.locations).where(eq(schema.locations.id, id)).execute();
    return result[0] || undefined;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await db.insert(schema.locations).values(location).returning().execute();
    if (!result[0]) {
      throw new Error('Failed to create location');
    }
    return result[0];
  }

  async updateLocation(id: number, updates: Partial<InsertLocation>): Promise<Location | undefined> {
    const values = {
      ...updates,
      updatedAt: new Date(),
    };
    const result = await db.update(schema.locations).set(values).where(eq(schema.locations.id, id)).returning().execute();
    return result[0] || undefined;
  }

  async deleteLocation(id: number): Promise<boolean> {
    await db.delete(schema.locations).where(eq(schema.locations.id, id)).execute();
    return true;
  }

  // Image Acquisition entries
  async getImageAcquisitions(imageId: number): Promise<ImageAcquisitionRow[]> {
    return await db.select().from(schema.imageAcquisition).where(eq(schema.imageAcquisition.imageId, imageId)).execute();
  }

  async createImageAcquisition(data: InsertImageAcquisitionRow): Promise<ImageAcquisitionRow> {
    const result = await db.insert(schema.imageAcquisition).values(data).returning().execute();
    if (!result[0]) {
      throw new Error('Failed to create acquisition entry');
    }
    await this.recomputeImageSummary(data.imageId);
    return result[0];
  }

  async updateImageAcquisition(id: number, updates: Partial<InsertImageAcquisitionRow>): Promise<ImageAcquisitionRow | undefined> {
    const result = await db.update(schema.imageAcquisition).set(updates).where(eq(schema.imageAcquisition.id, id)).returning().execute();
    if (result[0]) {
      await this.recomputeImageSummary(result[0].imageId);
    }
    return result[0] || undefined;
  }

  async deleteImageAcquisition(id: number): Promise<boolean> {
    const existing = await db.select().from(schema.imageAcquisition).where(eq(schema.imageAcquisition.id, id)).execute();
    if (!existing[0]) return false;

    await db.delete(schema.imageAcquisition).where(eq(schema.imageAcquisition.id, id)).execute();
    await this.recomputeImageSummary(existing[0].imageId);
    return true;
  }

  // Recompute flat summary fields from acquisition data + linked equipment
  async recomputeImageSummary(imageId: number): Promise<void> {
    const acquisitions = await this.getImageAcquisitions(imageId);
    const linkedEquipment = await this.getEquipmentForImage(imageId);

    const updates: Partial<InsertAstroImage> = {};

    // Compute from acquisitions
    if (acquisitions.length > 0) {
      const totalFrames = acquisitions.reduce((sum, a) => sum + a.frameCount, 0);
      const totalSeconds = acquisitions.reduce((sum, a) => sum + (a.frameCount * a.exposureTime), 0);
      const filterNames = [...new Set(
        acquisitions.map(a => a.filterName).filter(Boolean) as string[]
      )];

      updates.frameCount = totalFrames;
      updates.totalIntegration = Math.round((totalSeconds / 3600) * 1000) / 1000;
      updates.filters = filterNames.join(', ') || null;

      const exposureTimes = [...new Set(acquisitions.map(a => a.exposureTime))];
      if (exposureTimes.length === 1) {
        updates.exposureTime = `${exposureTimes[0]}s`;
      } else {
        const min = Math.min(...exposureTimes);
        const max = Math.max(...exposureTimes);
        updates.exposureTime = `${min}s - ${max}s`;
      }
    }

    // Compute from linked telescope equipment
    const telescope = linkedEquipment.find(e => e.type === 'telescope');
    if (telescope && telescope.specifications) {
      const specs = telescope.specifications as Record<string, unknown>;
      if (specs.focalLength) updates.focalLength = Number(specs.focalLength);
      if (specs.focalRatio) updates.aperture = String(specs.focalRatio);
    }

    if (Object.keys(updates).length > 0) {
      await this.updateAstroImage(imageId, updates);
    }
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
      
      // Count unique targets (distinct non-empty image titles)
      const uniqueTitles = new Set(images.map(img => img.title).filter(Boolean));

      return {
        totalImages: images.length,
        plateSolved: plateSolvedImages,
        totalHours: Math.round(totalIntegrationHours * 100) / 100,
        uniqueTargets: uniqueTitles.size,
        totalEquipment: equipment.length,
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
