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

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo astrophotography images
    const demoImages: AstroImage[] = [
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
        description: "The iconic Horsehead Nebula captured in narrowband filters.",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Demo equipment
    const demoEquipment: Equipment[] = [
      {
        id: 1,
        name: "William Optics RedCat 51",
        type: "telescope",
        specifications: { aperture: "51mm", focalLength: "250mm", focalRatio: "f/4.9" },
        imageUrl: null,
        description: "Compact apochromatic refractor ideal for wide-field imaging"
      },
      {
        id: 2,
        name: "ZWO ASI2600MC Pro",
        type: "camera",
        specifications: { sensor: "APS-C", resolution: "26MP", cooling: "TEC" },
        imageUrl: null,
        description: "High-performance cooled color CMOS camera"
      }
    ];

    // Add demo data to maps
    demoImages.forEach(image => this.astroImages.set(image.id, image));
    demoEquipment.forEach(eq => this.equipment.set(eq.id, eq));
    
    this.currentAstroImageId = 4;
    this.currentEquipmentId = 3;
  }

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
    } as AstroImage;
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
    const equipmentItem: Equipment = { ...equipment, id } as Equipment;
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
    } as PlateSolvingJob;
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