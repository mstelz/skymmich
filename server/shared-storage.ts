import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AstroImage, InsertAstroImage, Equipment, InsertEquipment, ImageEquipment, InsertImageEquipment, PlateSolvingJob, InsertPlateSolvingJob } from "@shared/schema";

interface StorageData {
  astroImages: AstroImage[];
  equipment: Equipment[];
  imageEquipment: ImageEquipment[];
  plateSolvingJobs: PlateSolvingJob[];
  nextImageId: number;
  nextEquipmentId: number;
  nextImageEquipmentId: number;
  nextJobId: number;
}

function reviveDates<T extends Record<string, any>>(obj: T): T {
  // Recursively convert ISO date strings to Date objects for known date fields
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'string' && key.match(/date|createdAt|updatedAt|submittedAt|completedAt/i)) {
      const val = obj[key];
      if (val && typeof val === 'string' && !isNaN(Date.parse(val))) {
        obj[key] = new Date(val) as unknown as T[Extract<keyof T, string>];
      }
    } else if (obj[key] && typeof obj[key] === 'object') {
      obj[key] = reviveDates(obj[key]);
    }
  }
  return obj;
}

export class SharedStorage {
  private dataPath: string;
  private data: StorageData;

  constructor() {
    this.dataPath = join(process.cwd(), 'data', 'storage.json');
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    try {
      if (existsSync(this.dataPath)) {
        const fileContent = readFileSync(this.dataPath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Convert date strings to Date objects
        parsed.astroImages = parsed.astroImages.map((img: any) => reviveDates(img));
        parsed.equipment = parsed.equipment.map((eq: any) => reviveDates(eq));
        parsed.imageEquipment = parsed.imageEquipment?.map((ie: any) => reviveDates(ie)) || [];
        parsed.plateSolvingJobs = parsed.plateSolvingJobs.map((job: any) => reviveDates(job));
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load storage file, using default data:', error);
    }

    // Default data
    return {
      astroImages: [
        {
          id: 1,
          immichId: "demo-1",
          title: "Andromeda Galaxy (M31)",
          filename: "M31_andromeda.jpg",
          thumbnailUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=400",
          fullUrl: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200",
          captureDate: new Date("2024-01-15T22:30:00Z"),
          focalLength: 600,
          aperture: "f/6.3",
          iso: 800,
          exposureTime: "300s",
          frameCount: 45,
          totalIntegration: 3.75,
          telescope: "William Optics RedCat 51",
          camera: "ZWO ASI2600MC Pro",
          mount: "Sky-Watcher EQ6-R Pro",
          filters: "L-eXtreme",
          plateSolved: true,
          ra: "00h 42m 44s",
          dec: "+41° 16' 09\"",
          pixelScale: 2.15,
          fieldOfView: "3.2° x 2.1°",
          rotation: 45.2,
          astrometryJobId: null,
          tags: ["galaxy", "messier", "autumn", "wide-field"],
          objectType: "Galaxy",
          constellation: "Andromeda",
          description: "The Andromeda Galaxy captured during excellent seeing conditions.",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          immichId: "demo-2",
          title: "Orion Nebula (M42)",
          filename: "M42_orion.jpg",
          thumbnailUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400",
          fullUrl: "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200",
          captureDate: new Date("2024-02-10T21:15:00Z"),
          focalLength: 1000,
          aperture: "f/8",
          iso: 1600,
          exposureTime: "180s",
          frameCount: 60,
          totalIntegration: 3.0,
          telescope: "Celestron EdgeHD 8",
          camera: "Canon EOS Ra",
          mount: "Celestron CGX",
          filters: "Optolong L-Pro",
          plateSolved: true,
          ra: "05h 35m 17s",
          dec: "-05° 23' 13\"",
          pixelScale: 1.85,
          fieldOfView: "1.8° x 1.2°",
          rotation: -12.5,
          astrometryJobId: null,
          tags: ["nebula", "messier", "winter", "emission"],
          objectType: "Nebula",
          constellation: "Orion",
          description: "The Great Orion Nebula showcasing stellar formation regions.",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          immichId: "demo-3",
          title: "Horsehead Nebula (B33)",
          filename: "B33_horsehead.jpg",
          thumbnailUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400",
          fullUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200",
          captureDate: new Date("2024-01-28T23:45:00Z"),
          focalLength: 1200,
          aperture: "f/7",
          iso: 3200,
          exposureTime: "240s",
          frameCount: 80,
          totalIntegration: 5.33,
          telescope: "Takahashi FSQ-106ED",
          camera: "QHY268C",
          mount: "10Micron GM1000 HPS",
          filters: "Ha, OIII, SII",
          plateSolved: false,
          ra: null,
          dec: null,
          pixelScale: null,
          fieldOfView: null,
          rotation: null,
          astrometryJobId: null,
          tags: ["nebula", "dark-nebula", "winter", "narrowband"],
          objectType: "Nebula",
          constellation: "Orion",
          description: "The iconic Horsehead Nebula captured in narrowband filters.",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      equipment: [
        {
          id: 1,
          name: "William Optics RedCat 51",
          type: "telescope",
          specifications: { aperture: "51mm", focalLength: "250mm", focalRatio: "f/4.9" },
          imageUrl: null,
          description: "Compact apochromatic refractor ideal for wide-field imaging",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: "ZWO ASI2600MC Pro",
          type: "camera",
          specifications: { sensor: "APS-C", resolution: "26MP", cooling: "TEC" },
          imageUrl: null,
          description: "High-performance cooled color CMOS camera",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      imageEquipment: [
        {
          id: 1,
          imageId: 1,
          equipmentId: 1,
          settings: { focalLength: 250, aperture: "f/4.9" },
          notes: "Used with 0.8x reducer for wider field",
          createdAt: new Date()
        },
        {
          id: 2,
          imageId: 1,
          equipmentId: 2,
          settings: { gain: 100, offset: 50 },
          notes: "Cooled to -10°C for optimal performance",
          createdAt: new Date()
        }
      ],
      plateSolvingJobs: [],
      nextImageId: 4,
      nextEquipmentId: 3,
      nextImageEquipmentId: 3,
      nextJobId: 1
    };
  }

  private saveData() {
    try {
      // Ensure data directory exists
      const dataDir = join(process.cwd(), 'data');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      
      writeFileSync(this.dataPath, JSON.stringify(this.data, (key, value) => {
        // Convert Date objects to ISO strings for serialization
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }, 2));
    } catch (error) {
      console.error('Failed to save storage data:', error);
    }
  }

  // Astrophotography images
  async getAstroImages(filters?: { objectType?: string; tags?: string[]; plateSolved?: boolean }): Promise<AstroImage[]> {
    let images: AstroImage[] = this.data.astroImages;
    
    if (filters?.objectType) {
      images = images.filter((img: AstroImage) => img.objectType === filters.objectType);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      images = images.filter((img: AstroImage) => 
        img.tags && filters.tags!.some(tag => img.tags!.includes(tag))
      );
    }
    
    if (filters?.plateSolved !== undefined) {
      images = images.filter((img: AstroImage) => img.plateSolved === filters.plateSolved);
    }
    
    return images.sort((a: AstroImage, b: AstroImage) => 
      new Date(b.captureDate || 0).getTime() - new Date(a.captureDate || 0).getTime()
    );
  }

  async getAstroImage(id: number): Promise<AstroImage | undefined> {
    return this.data.astroImages.find((img: AstroImage) => img.id === id);
  }

  async getAstroImageByImmichId(immichId: string): Promise<AstroImage | undefined> {
    return this.data.astroImages.find((img: AstroImage) => img.immichId === immichId);
  }

  async createAstroImage(image: InsertAstroImage): Promise<AstroImage> {
    const id = this.data.nextImageId++;
    const now = new Date();
    const astroImage: AstroImage = {
      ...image,
      id,
      createdAt: now,
      updatedAt: now,
    } as AstroImage;
    
    this.data.astroImages.push(astroImage);
    this.saveData();
    return astroImage;
  }

  async updateAstroImage(id: number, updates: Partial<InsertAstroImage>): Promise<AstroImage | undefined> {
    const index = this.data.astroImages.findIndex((img: AstroImage) => img.id === id);
    if (index === -1) return undefined;
    
    this.data.astroImages[index] = {
      ...this.data.astroImages[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    this.saveData();
    return this.data.astroImages[index];
  }

  async deleteAstroImage(id: number): Promise<boolean> {
    const index = this.data.astroImages.findIndex((img: AstroImage) => img.id === id);
    if (index === -1) return false;
    
    this.data.astroImages.splice(index, 1);
    this.saveData();
    return true;
  }

  // Equipment
  async getEquipment(): Promise<Equipment[]> {
    return this.data.equipment;
  }

  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const id = this.data.nextEquipmentId++;
    const now = new Date();
    const equipmentItem: Equipment = { 
      ...equipment, 
      id,
      createdAt: now,
      updatedAt: now,
    } as Equipment;
    this.data.equipment.push(equipmentItem);
    this.saveData();
    return equipmentItem;
  }

  // Image Equipment relationships
  async getImageEquipment(imageId: number): Promise<ImageEquipment[]> {
    return this.data.imageEquipment.filter(ie => ie.imageId === imageId);
  }

  async getEquipmentForImage(imageId: number): Promise<Equipment[]> {
    const imageEquipment = this.data.imageEquipment.filter(ie => ie.imageId === imageId);
    const equipmentIds = imageEquipment.map(ie => ie.equipmentId);
    return this.data.equipment.filter(eq => equipmentIds.includes(eq.id));
  }

  async addEquipmentToImage(imageId: number, equipmentId: number, settings?: any, notes?: string): Promise<ImageEquipment> {
    console.log('shared-storage.addEquipmentToImage called with:', { imageId, equipmentId, settings, notes });
    
    // Check if relationship already exists
    const existing = this.data.imageEquipment.find(ie => ie.imageId === imageId && ie.equipmentId === equipmentId);
    if (existing) {
      console.log('Relationship already exists in shared storage:', existing);
      return existing;
    }

    const id = this.data.nextImageEquipmentId++;
    const now = new Date();
    const imageEquipment: ImageEquipment = {
      id,
      imageId,
      equipmentId,
      settings: settings || null,
      notes: notes || null,
      createdAt: now,
    } as ImageEquipment;

    console.log('Creating new image equipment relationship in shared storage:', imageEquipment);
    this.data.imageEquipment.push(imageEquipment);
    this.saveData();
    console.log('Image equipment relationship saved successfully in shared storage');
    return imageEquipment;
  }

  async removeEquipmentFromImage(imageId: number, equipmentId: number): Promise<boolean> {
    const index = this.data.imageEquipment.findIndex(ie => ie.imageId === imageId && ie.equipmentId === equipmentId);
    if (index === -1) return false;

    this.data.imageEquipment.splice(index, 1);
    this.saveData();
    return true;
  }

  async updateImageEquipment(imageId: number, equipmentId: number, updates: Partial<InsertImageEquipment>): Promise<ImageEquipment | undefined> {
    const index = this.data.imageEquipment.findIndex(ie => ie.imageId === imageId && ie.equipmentId === equipmentId);
    if (index === -1) return undefined;

    this.data.imageEquipment[index] = {
      ...this.data.imageEquipment[index],
      ...updates,
    };

    this.saveData();
    return this.data.imageEquipment[index];
  }

  // Plate solving
  async getPlateSolvingJobs(): Promise<PlateSolvingJob[]> {
    return this.data.plateSolvingJobs.sort((a: PlateSolvingJob, b: PlateSolvingJob) => 
      new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
    );
  }

  async getPlateSolvingJob(id: number): Promise<PlateSolvingJob | undefined> {
    return this.data.plateSolvingJobs.find((job: PlateSolvingJob) => job.id === id);
  }

  async getPlateSolvingJobByAstrometryId(astrometryJobId: string): Promise<PlateSolvingJob | undefined> {
    return this.data.plateSolvingJobs.find((job: PlateSolvingJob) => job.astrometryJobId === astrometryJobId);
  }

  async createPlateSolvingJob(job: InsertPlateSolvingJob): Promise<PlateSolvingJob> {
    const id = this.data.nextJobId++;
    const plateSolvingJob: PlateSolvingJob = {
      ...job,
      id,
      submittedAt: new Date(),
      completedAt: null,
    } as PlateSolvingJob;
    
    this.data.plateSolvingJobs.push(plateSolvingJob);
    this.saveData();
    return plateSolvingJob;
  }

  async updatePlateSolvingJob(id: number, updates: Partial<InsertPlateSolvingJob>): Promise<PlateSolvingJob | undefined> {
    const index = this.data.plateSolvingJobs.findIndex((job: PlateSolvingJob) => job.id === id);
    if (index === -1) return undefined;
    
    const updateData: any = { ...updates };
    
    // Set completedAt if status is changing to completed
    if (updates.status && updates.status !== 'pending' && updates.status !== 'processing') {
      updateData.completedAt = new Date();
    }
    
    this.data.plateSolvingJobs[index] = {
      ...this.data.plateSolvingJobs[index],
      ...updateData,
    };
    
    this.saveData();
    return this.data.plateSolvingJobs[index];
  }

  // Stats
  async getStats(): Promise<{
    totalImages: number;
    plateSolved: number;
    totalHours: number;
    uniqueTargets: number;
  }> {
    const totalImages = this.data.astroImages.length;
    const plateSolved = this.data.astroImages.filter((img: AstroImage) => img.plateSolved).length;
    const totalHours = this.data.astroImages.reduce((sum: number, img: AstroImage) => sum + (img.totalIntegration || 0), 0);
    const uniqueTargets = new Set(this.data.astroImages.map((img: AstroImage) => img.title)).size;
    
    return {
      totalImages,
      plateSolved,
      totalHours: Math.round(totalHours * 10) / 10,
      uniqueTargets,
    };
  }
} 