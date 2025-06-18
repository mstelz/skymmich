import { astrophotographyImages, equipment, plateSolvingJobs, type AstroImage, type InsertAstroImage, type Equipment, type InsertEquipment, type PlateSolvingJob, type InsertPlateSolvingJob } from "@shared/schema";

export interface IStorage {
  // Astrophotography images
  getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean }): Promise<AstroImage[]>;
  getAstroImage(id: number): Promise<AstroImage | undefined>;
  getAstroImageByImmichId(immichId: string): Promise<AstroImage | undefined>;
  createAstroImage(image: InsertAstroImage): Promise<AstroImage>;
  updateAstroImage(id: number, updates: Partial<InsertAstroImage>): Promise<AstroImage | undefined>;
  deleteAstroImage(id: number): Promise<boolean>;
  
  // Equipment
  getEquipment(): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  
  // Plate solving
  getPlateSolvingJobs(): Promise<PlateSolvingJob[]>;
  getPlateSolvingJob(id: number): Promise<PlateSolvingJob | undefined>;
  getPlateSolvingJobByAstrometryId(astrometryJobId: string): Promise<PlateSolvingJob | undefined>;
  createPlateSolvingJob(job: InsertPlateSolvingJob): Promise<PlateSolvingJob>;
  updatePlateSolvingJob(id: number, updates: Partial<InsertPlateSolvingJob>): Promise<PlateSolvingJob | undefined>;
  
  // Stats
  getStats(): Promise<{
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  }>;
}

export class MemStorage implements IStorage {
  private astroImages: Map<number, AstroImage> = new Map();
  private equipment: Map<number, Equipment> = new Map();
  private plateSolvingJobs: Map<number, PlateSolvingJob> = new Map();
  private currentAstroImageId = 1;
  private currentEquipmentId = 1;
  private currentJobId = 1;

  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean }): Promise<AstroImage[]> {
    let images = Array.from(this.astroImages.values());
    
    if (filters?.objectType) {
      images = images.filter(img => img.objectType === filters.objectType);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      images = images.filter(img => 
        img.tags && filters.tags!.some(tag => img.tags!.includes(tag))
      );
    }
    
    if (filters?.plateSolved !== undefined) {
      images = images.filter(img => img.plateSolved === filters.plateSolved);
    }
    
    return images.sort((a, b) => 
      new Date(b.captureDate || 0).getTime() - new Date(a.captureDate || 0).getTime()
    );
  }

  async getAstroImage(id: number): Promise<AstroImage | undefined> {
    return this.astroImages.get(id);
  }

  async getAstroImageByImmichId(immichId: string): Promise<AstroImage | undefined> {
    return Array.from(this.astroImages.values()).find(img => img.immichId === immichId);
  }

  async createAstroImage(image: InsertAstroImage): Promise<AstroImage> {
    const id = this.currentAstroImageId++;
    const now = new Date();
    const astroImage: AstroImage = {
      ...image,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.astroImages.set(id, astroImage);
    return astroImage;
  }

  async updateAstroImage(id: number, updates: Partial<InsertAstroImage>): Promise<AstroImage | undefined> {
    const existing = this.astroImages.get(id);
    if (!existing) return undefined;
    
    const updated: AstroImage = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.astroImages.set(id, updated);
    return updated;
  }

  async deleteAstroImage(id: number): Promise<boolean> {
    return this.astroImages.delete(id);
  }

  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }

  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const id = this.currentEquipmentId++;
    const equipmentItem: Equipment = { ...equipment, id };
    this.equipment.set(id, equipmentItem);
    return equipmentItem;
  }

  async getPlateSolvingJobs(): Promise<PlateSolvingJob[]> {
    return Array.from(this.plateSolvingJobs.values())
      .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());
  }

  async getPlateSolvingJob(id: number): Promise<PlateSolvingJob | undefined> {
    return this.plateSolvingJobs.get(id);
  }

  async getPlateSolvingJobByAstrometryId(astrometryJobId: string): Promise<PlateSolvingJob | undefined> {
    return Array.from(this.plateSolvingJobs.values()).find(job => job.astrometryJobId === astrometryJobId);
  }

  async createPlateSolvingJob(job: InsertPlateSolvingJob): Promise<PlateSolvingJob> {
    const id = this.currentJobId++;
    const plateSolvingJob: PlateSolvingJob = {
      ...job,
      id,
      submittedAt: new Date(),
      completedAt: null,
    };
    this.plateSolvingJobs.set(id, plateSolvingJob);
    return plateSolvingJob;
  }

  async updatePlateSolvingJob(id: number, updates: Partial<InsertPlateSolvingJob>): Promise<PlateSolvingJob | undefined> {
    const existing = this.plateSolvingJobs.get(id);
    if (!existing) return undefined;
    
    const updated: PlateSolvingJob = {
      ...existing,
      ...updates,
      ...(updates.status && updates.status !== 'pending' && updates.status !== 'processing' 
        ? { completedAt: new Date() } 
        : {}),
    };
    this.plateSolvingJobs.set(id, updated);
    return updated;
  }

  async getStats(): Promise<{
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  }> {
    const images = Array.from(this.astroImages.values());
    const totalImages = images.length;
    const plateSolved = images.filter(img => img.plateSolved).length;
    const totalHours = images.reduce((sum, img) => sum + (img.totalIntegration || 0), 0);
    const uniqueTargets = new Set(images.map(img => img.title)).size;
    
    return {
      totalImages,
      plateSolved,
      totalHours: Math.round(totalHours * 10) / 10,
      uniqueTargets,
    };
  }
}

export const storage = new MemStorage();
