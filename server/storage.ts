import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { AstroImage, InsertAstroImage, Equipment, InsertEquipment, PlateSolvingJob, InsertPlateSolvingJob } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface StorageData {
  astroImages: AstroImage[];
  equipment: Equipment[];
  plateSolvingJobs: PlateSolvingJob[];
  nextImageId: number;
  nextEquipmentId: number;
  nextJobId: number;
}

class FileStorage {
  private filePath: string;

  constructor() {
    this.filePath = join(__dirname, "../data/storage.json");
  }

  private loadData(): StorageData {
    if (!existsSync(this.filePath)) {
      return {
        astroImages: [],
        equipment: [],
        plateSolvingJobs: [],
        nextImageId: 1,
        nextEquipmentId: 1,
        nextJobId: 1
      };
    }

    try {
      const fileContent = readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(fileContent);
      
      // Ensure all required fields exist
      return {
        astroImages: data.astroImages || [],
        equipment: data.equipment || [],
        plateSolvingJobs: data.plateSolvingJobs || [],
        nextImageId: data.nextImageId || 1,
        nextEquipmentId: data.nextEquipmentId || 1,
        nextJobId: data.nextJobId || 1
      };
    } catch (error) {
      console.error("Error loading storage data:", error);
      return {
        astroImages: [],
        equipment: [],
        plateSolvingJobs: [],
        nextImageId: 1,
        nextEquipmentId: 1,
        nextJobId: 1
      };
    }
  }

  private saveData(data: StorageData): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error saving storage data:", error);
    }
  }

  // Astrophotography images
  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean }): Promise<AstroImage[]> {
    const data = this.loadData();
    let images = [...data.astroImages];

    if (filters?.objectType) {
      images = images.filter(img => img.objectType === filters.objectType);
    }

    if (filters?.plateSolved !== undefined) {
      images = images.filter(img => img.plateSolved === filters.plateSolved);
    }

    if (filters?.tags && filters.tags.length > 0) {
      images = images.filter(img => 
        img.tags && filters.tags!.some(tag => img.tags!.includes(tag))
      );
    }

    return images.sort((a, b) => new Date(a.captureDate || 0).getTime() - new Date(b.captureDate || 0).getTime());
  }

  async getAstroImage(id: number): Promise<AstroImage | undefined> {
    const data = this.loadData();
    return data.astroImages.find(img => img.id === id);
  }

  async getAstroImageByImmichId(immichId: string): Promise<AstroImage | undefined> {
    const data = this.loadData();
    return data.astroImages.find(img => img.immichId === immichId);
  }

  async createAstroImage(image: InsertAstroImage): Promise<AstroImage> {
    const data = this.loadData();
    const newImage: AstroImage = {
      ...image,
      id: data.nextImageId++,
      createdAt: new Date(),
      updatedAt: new Date(),
      immichId: image.immichId || null,
      thumbnailUrl: image.thumbnailUrl || null,
      fullUrl: image.fullUrl || null,
      captureDate: image.captureDate || null,
      focalLength: image.focalLength || null,
      aperture: image.aperture || null,
      iso: image.iso || null,
      exposureTime: image.exposureTime || null,
      frameCount: image.frameCount || null,
      totalIntegration: image.totalIntegration || null,
      telescope: image.telescope || null,
      camera: image.camera || null,
      mount: image.mount || null,
      filters: image.filters || null,
      plateSolved: image.plateSolved || false,
      ra: image.ra || null,
      dec: image.dec || null,
      pixelScale: image.pixelScale || null,
      fieldOfView: image.fieldOfView || null,
      rotation: image.rotation || null,
      astrometryJobId: image.astrometryJobId || null,
      tags: image.tags || [],
      objectType: image.objectType || null,
      description: image.description || null
    };

    data.astroImages.push(newImage);
    this.saveData(data);
    return newImage;
  }

  async updateAstroImage(id: number, updates: Partial<InsertAstroImage>): Promise<AstroImage | undefined> {
    const data = this.loadData();
    const index = data.astroImages.findIndex(img => img.id === id);
    if (index === -1) return undefined;

    data.astroImages[index] = {
      ...data.astroImages[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveData(data);
    return data.astroImages[index];
  }

  async deleteAstroImage(id: number): Promise<boolean> {
    const data = this.loadData();
    const index = data.astroImages.findIndex(img => img.id === id);
    if (index === -1) return false;

    data.astroImages.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    const data = this.loadData();
    return [...data.equipment];
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const data = this.loadData();
    const newEquipment: Equipment = {
      ...equipmentData,
      id: data.nextEquipmentId++,
      description: equipmentData.description || null,
      specifications: equipmentData.specifications || null,
      imageUrl: equipmentData.imageUrl || null
    };

    data.equipment.push(newEquipment);
    this.saveData(data);
    return newEquipment;
  }

  // Plate solving
  async getPlateSolvingJobs(): Promise<PlateSolvingJob[]> {
    const data = this.loadData();
    return [...data.plateSolvingJobs].sort((a, b) => 
      new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime()
    );
  }

  async getPlateSolvingJob(id: number): Promise<PlateSolvingJob | undefined> {
    const data = this.loadData();
    return data.plateSolvingJobs.find(job => job.id === id);
  }

  async getPlateSolvingJobByAstrometryId(astrometryJobId: string): Promise<PlateSolvingJob | undefined> {
    const data = this.loadData();
    return data.plateSolvingJobs.find(job => job.astrometryJobId === astrometryJobId);
  }

  async createPlateSolvingJob(job: InsertPlateSolvingJob): Promise<PlateSolvingJob> {
    const data = this.loadData();
    const newJob: PlateSolvingJob = {
      ...job,
      id: data.nextJobId++,
      submittedAt: new Date(),
      completedAt: null,
      astrometrySubmissionId: job.astrometrySubmissionId || null,
      astrometryJobId: job.astrometryJobId || null,
      imageId: job.imageId || null,
      status: job.status || 'pending',
      result: job.result || null
    };

    data.plateSolvingJobs.push(newJob);
    this.saveData(data);
    return newJob;
  }

  async updatePlateSolvingJob(id: number, updates: Partial<InsertPlateSolvingJob>): Promise<PlateSolvingJob | undefined> {
    const data = this.loadData();
    const index = data.plateSolvingJobs.findIndex(job => job.id === id);
    if (index === -1) return undefined;

    const updateData: any = { ...updates };
    
    // Set completedAt if status is changing to completed
    if (updates.status && updates.status !== 'pending' && updates.status !== 'processing') {
      updateData.completedAt = new Date();
    }

    data.plateSolvingJobs[index] = {
      ...data.plateSolvingJobs[index],
      ...updateData
    };

    this.saveData(data);
    return data.plateSolvingJobs[index];
  }

  // Stats
  async getStats(): Promise<{
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  }> {
    const data = this.loadData();
    const images = data.astroImages;
    
    const totalImages = images.length;
    const plateSolved = images.filter(img => img.plateSolved).length;
    const totalHours = images.reduce((sum, img) => sum + (img.totalIntegration || 0), 0);
    const uniqueTargets = new Set(images.map(img => img.objectType).filter(Boolean)).size;
    
    return {
      totalImages,
      plateSolved,
      totalHours,
      uniqueTargets
    };
  }
}

export const storage = new FileStorage();