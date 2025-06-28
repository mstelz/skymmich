import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { AstroImage, InsertAstroImage, Equipment, InsertEquipment, ImageEquipment, InsertImageEquipment, PlateSolvingJob, InsertPlateSolvingJob } from "@shared/schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface StorageData {
  astroImages: AstroImage[];
  equipment: Equipment[];
  imageEquipment: ImageEquipment[];
  plateSolvingJobs: PlateSolvingJob[];
  adminSettings: any;
  notifications: any[];
  nextImageId: number;
  nextEquipmentId: number;
  nextImageEquipmentId: number;
  nextJobId: number;
  nextNotificationId: number;
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
        imageEquipment: [],
        plateSolvingJobs: [],
        adminSettings: {},
        notifications: [],
        nextImageId: 1,
        nextEquipmentId: 1,
        nextImageEquipmentId: 1,
        nextJobId: 1,
        nextNotificationId: 1
      };
    }

    try {
      const fileContent = readFileSync(this.filePath, "utf-8");
      const data = JSON.parse(fileContent);
      
      // Ensure all required fields exist
      // Parse createdAt and updatedAt as Date objects for astroImages
      if (Array.isArray(data.astroImages)) {
        data.astroImages = data.astroImages.map((img: any) => ({
          ...img,
          createdAt: img.createdAt ? new Date(img.createdAt) : null,
          updatedAt: img.updatedAt ? new Date(img.updatedAt) : null,
        }));
      }
      return {
        astroImages: data.astroImages || [],
        equipment: data.equipment || [],
        imageEquipment: data.imageEquipment || [],
        plateSolvingJobs: data.plateSolvingJobs || [],
        adminSettings: data.adminSettings || {},
        notifications: data.notifications || [],
        nextImageId: data.nextImageId || 1,
        nextEquipmentId: data.nextEquipmentId || 1,
        nextImageEquipmentId: data.nextImageEquipmentId || 1,
        nextJobId: data.nextJobId || 1,
        nextNotificationId: data.nextNotificationId || 1
      };
    } catch (error) {
      console.error("Error loading storage data:", error);
      return {
        astroImages: [],
        equipment: [],
        imageEquipment: [],
        plateSolvingJobs: [],
        adminSettings: {},
        notifications: [],
        nextImageId: 1,
        nextEquipmentId: 1,
        nextImageEquipmentId: 1,
        nextJobId: 1,
        nextNotificationId: 1
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
  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean; constellation?: string }): Promise<AstroImage[]> {
    const data = this.loadData();
    let images = [...data.astroImages];

    if (filters) {
      if (filters.objectType) {
        images = images.filter(img => img.objectType === filters.objectType);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        images = images.filter(img => 
          img.tags && filters.tags!.some(tag => img.tags!.includes(tag))
        );
      }
      
      if (filters.plateSolved !== undefined) {
        images = images.filter(img => img.plateSolved === filters.plateSolved);
      }
      
      if (filters.constellation && filters.constellation.trim() !== "") {
        images = images.filter(img => img.constellation === filters.constellation);
      }
    }

    return images.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });
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
      constellation: image.constellation || null,
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

    const image = data.astroImages[index];

    // Delete XMP sidecar file if it exists
    if (image) {
      const sidecarDir = join(__dirname, '../sidecars');
      // Try by filename, then by immichId
      const possibleNames = [];
      if (image.filename) possibleNames.push(`${image.filename}.xmp`);
      if (image.immichId) possibleNames.push(`${image.immichId}.xmp`);
      for (const fname of possibleNames) {
        const fpath = join(sidecarDir, fname);
        if (existsSync(fpath)) {
          try { unlinkSync(fpath); } catch (e) { /* ignore */ }
        }
      }
    }

    // Remove related plate solving jobs
    if (image) {
      data.plateSolvingJobs = data.plateSolvingJobs.filter(job => job.imageId !== image.id);
    }

    // Remove related imageEquipment records
    if (image) {
      data.imageEquipment = data.imageEquipment.filter(ie => ie.imageId !== image.id);
    }

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
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    data.equipment.push(newEquipment);
    this.saveData(data);
    return newEquipment;
  }

  async updateEquipment(id: number, updates: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const data = this.loadData();
    const index = data.equipment.findIndex(eq => eq.id === id);
    if (index === -1) return undefined;

    data.equipment[index] = {
      ...data.equipment[index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveData(data);
    return data.equipment[index];
  }

  async deleteEquipment(id: number): Promise<boolean> {
    const data = this.loadData();
    const index = data.equipment.findIndex(eq => eq.id === id);
    if (index === -1) return false;

    // Remove all image-equipment relationships for this equipment
    data.imageEquipment = data.imageEquipment.filter(ie => ie.equipmentId !== id);
    
    // Remove the equipment
    data.equipment.splice(index, 1);
    this.saveData(data);
    return true;
  }

  // Image Equipment relationships
  async getImageEquipment(imageId: number): Promise<ImageEquipment[]> {
    const data = this.loadData();
    return data.imageEquipment.filter(ie => ie.imageId === imageId);
  }

  async getEquipmentForImage(imageId: number): Promise<Equipment[]> {
    const data = this.loadData();
    const imageEquipment = data.imageEquipment.filter(ie => ie.imageId === imageId);
    const equipmentIds = imageEquipment.map(ie => ie.equipmentId);
    return data.equipment.filter(eq => equipmentIds.includes(eq.id));
  }

  async addEquipmentToImage(imageId: number, equipmentId: number, settings?: any, notes?: string): Promise<ImageEquipment> {
    console.log('storage.addEquipmentToImage called with:', { imageId, equipmentId, settings, notes });
    
    const data = this.loadData();
    
    // Check if relationship already exists
    const existing = data.imageEquipment.find(ie => ie.imageId === imageId && ie.equipmentId === equipmentId);
    if (existing) {
      console.log('Relationship already exists:', existing);
      return existing;
    }

    const newImageEquipment: ImageEquipment = {
      id: data.nextImageEquipmentId++,
      imageId,
      equipmentId,
      settings: settings || null,
      notes: notes || null,
      createdAt: new Date()
    };

    console.log('Creating new image equipment relationship:', newImageEquipment);
    data.imageEquipment.push(newImageEquipment);
    this.saveData(data);
    console.log('Image equipment relationship saved successfully');
    return newImageEquipment;
  }

  async removeEquipmentFromImage(imageId: number, equipmentId: number): Promise<boolean> {
    const data = this.loadData();
    const index = data.imageEquipment.findIndex(ie => ie.imageId === imageId && ie.equipmentId === equipmentId);
    if (index === -1) return false;

    data.imageEquipment.splice(index, 1);
    this.saveData(data);
    return true;
  }

  async updateImageEquipment(imageId: number, equipmentId: number, updates: Partial<InsertImageEquipment>): Promise<ImageEquipment | undefined> {
    const data = this.loadData();
    const index = data.imageEquipment.findIndex(ie => ie.imageId === imageId && ie.equipmentId === equipmentId);
    if (index === -1) return undefined;

    data.imageEquipment[index] = {
      ...data.imageEquipment[index],
      ...updates
    };

    this.saveData(data);
    return data.imageEquipment[index];
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
    const totalImages = data.astroImages.length;
    const plateSolved = data.astroImages.filter(img => img.plateSolved).length;
    
    // Calculate total integration time
    const totalHours = data.astroImages.reduce((sum, img) => {
      return sum + (img.totalIntegration || 0);
    }, 0);
    
    // Count unique targets (objects with different names)
    const uniqueTargets = new Set(
      data.astroImages
        .filter(img => img.plateSolved && img.tags && img.tags.length > 0)
        .map(img => {
          // Extract primary astronomical target from tags
          const primaryTargets = img.tags.filter(tag => 
            tag.startsWith('NGC ') || 
            tag.startsWith('IC ') || 
            tag.startsWith('M ') ||
            tag.includes('Nebula') ||
            tag.includes('Cluster')
          );
          
          if (primaryTargets.length > 0) {
            // Return the first primary target found
            return primaryTargets[0];
          }
          
          // Fallback to filename if no primary target found
          return img.filename;
        })
        .filter(Boolean)
    ).size;
    
    return {
      totalImages,
      plateSolved,
      totalHours,
      uniqueTargets
    };
  }

  // Admin settings
  async getAdminSettings(): Promise<any> {
    const data = this.loadData();
    return data.adminSettings;
  }

  async updateAdminSettings(settings: any): Promise<void> {
    const data = this.loadData();
    data.adminSettings = { ...data.adminSettings, ...settings };
    this.saveData(data);
  }

  // Notifications
  async getNotifications(): Promise<any[]> {
    const data = this.loadData();
    return data.notifications.filter(n => !n.acknowledged);
  }

  async createNotification(notification: {
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    details?: any;
    timestamp?: Date;
  }): Promise<any> {
    const data = this.loadData();
    const newNotification = {
      id: data.nextNotificationId++,
      ...notification,
      timestamp: notification.timestamp || new Date(),
      acknowledged: false,
    };
    
    data.notifications.push(newNotification);
    this.saveData(data);
    return newNotification;
  }

  async acknowledgeNotification(id: number): Promise<void> {
    const data = this.loadData();
    const notification = data.notifications.find(n => n.id === id);
    if (notification) {
      notification.acknowledged = true;
      this.saveData(data);
    }
  }

  async clearOldNotifications(daysOld: number = 30): Promise<void> {
    const data = this.loadData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    data.notifications = data.notifications.filter(n => 
      n.timestamp > cutoffDate || !n.acknowledged
    );
    this.saveData(data);
  }
}

export const storage = new FileStorage();