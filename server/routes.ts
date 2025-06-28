import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAstroImageSchema, insertPlateSolvingJobSchema } from "@shared/schema";
import axios from "axios";
import { astrometryService } from './astrometry';
import { configService } from './config';
import { cronManager } from './cron-manager';

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all astrophotography images with optional filters
  app.get("/api/images", async (req, res) => {
    try {
      const { objectType, tags, plateSolved } = req.query;
      const filters: any = {};
      
      if (objectType) filters.objectType = objectType as string;
      if (tags) filters.tags = Array.isArray(tags) ? tags as string[] : [tags as string];
      if (plateSolved !== undefined) filters.plateSolved = plateSolved === 'true';
      
      const images = await storage.getAstroImages(filters);
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Get a specific image
  app.get("/api/images/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const image = await storage.getAstroImage(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch image" });
    }
  });

  // Sync images from Immich
  app.post("/api/sync-immich", async (req, res) => {
    try {
      const config = await configService.getImmichConfig();
      
      if (!config.host || !config.apiKey) {
        return res.status(400).json({ 
          message: "Immich configuration missing. Please configure in admin settings or set environment variables." 
        });
      }

      // Sync by album logic
      let albumsToSync: any[] = [];
      const albumsResponse = await axios.get(`${config.host}/api/albums`, {
        headers: { 'X-API-Key': config.apiKey }
      });
      if (config.syncByAlbum) {
        if (!Array.isArray(config.selectedAlbumIds) || config.selectedAlbumIds.length === 0) {
          return res.status(400).json({ message: "Sync by album is enabled, but no albums are selected." });
        }
        albumsToSync = albumsResponse.data.filter((a: any) => config.selectedAlbumIds.includes(a.id));
      } else {
        albumsToSync = albumsResponse.data;
      }

      let allAssets: any[] = [];
      for (const album of albumsToSync) {
        if (album.id && album.assetCount > 0) {
          try {
            console.log(`Fetching assets from album: ${album.albumName} (${album.assetCount} assets)`);
            const albumResponse = await axios.get(`${config.host}/api/albums/${album.id}`, {
              headers: { 'X-API-Key': config.apiKey }
            });
            if (albumResponse.data && albumResponse.data.assets && Array.isArray(albumResponse.data.assets)) {
              allAssets.push(...albumResponse.data.assets);
              console.log(`Added ${albumResponse.data.assets.length} assets from album ${album.albumName}`);
            }
          } catch (albumError: any) {
            console.warn(`Failed to get assets from album ${album.albumName} (${album.id}):`, albumError.response?.data || albumError.message);
          }
        }
      }
      console.log(`Found ${allAssets.length} total assets in Immich`);

      // Remove images from our app that no longer exist in Immich
      const immichAssetIds = new Set(allAssets.map(asset => asset.id));
      const allAppImages = await storage.getAstroImages();
      let removedCount = 0;
      for (const img of allAppImages) {
        if (img.immichId && !immichAssetIds.has(img.immichId)) {
          await storage.deleteAstroImage(img.id);
          removedCount++;
          console.log(`Removed image ${img.title || img.id} (immichId: ${img.immichId}) because it no longer exists in Immich`);
        }
      }
      if (removedCount > 0) {
        console.log(`Removed ${removedCount} images that no longer exist in Immich.`);
      }

      let syncedCount = 0;

      for (const asset of allAssets) {
        // Check if image already exists
        const existing = await storage.getAstroImageByImmichId(asset.id);
        if (existing) {
          console.log(`Asset ${asset.originalFileName} already exists, skipping`);
          continue;
        }

        // Extract EXIF data and create astrophotography image
        const astroImage = {
          immichId: asset.id,
          title: asset.originalFileName || asset.id,
          filename: asset.originalFileName || "",
          thumbnailUrl: `/api/assets/${asset.id}/thumbnail`,
          fullUrl: `/api/assets/${asset.id}/thumbnail?size=preview`,
          captureDate: asset.fileCreatedAt ? new Date(asset.fileCreatedAt) : null,
          focalLength: asset.exifInfo?.focalLength || null,
          aperture: asset.exifInfo?.fNumber ? `f/${asset.exifInfo.fNumber}` : null,
          iso: asset.exifInfo?.iso || null,
          exposureTime: asset.exifInfo?.exposureTime || null,
          frameCount: 1,
          totalIntegration: asset.exifInfo?.exposureTime ? parseFloat(asset.exifInfo.exposureTime) / 3600 : null,
          telescope: "",
          camera: asset.exifInfo?.make && asset.exifInfo?.model 
            ? `${asset.exifInfo.make} ${asset.exifInfo.model}` 
            : null,
          mount: "",
          filters: "",
          plateSolved: false,
          tags: ["astrophotography"],
          objectType: "Deep Sky", // Default classification
          description: asset.exifInfo?.description || "",
        };

        await storage.createAstroImage(astroImage);
        syncedCount++;
        console.log(`Synced asset: ${asset.originalFileName}`);
      }

      res.json({ 
        message: `Successfully synced ${syncedCount} new images from Immich. Removed ${removedCount} images no longer in Immich.`,
        syncedCount,
        removedCount
      });

    } catch (error: any) {
      console.error("Immich sync error:", error.response?.data || error.message);
      res.status(500).json({ 
        message: "Failed to sync with Immich", 
        error: error.response?.data?.message || error.message 
      });
    }
  });

  // Save admin settings
  app.post("/api/admin/settings", async (req, res) => {
    try {
      const settings = req.body;
      await configService.updateConfig(settings);
      res.json({ success: true, message: "Settings saved successfully" });
    } catch (error: any) {
      console.error("Failed to save admin settings:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to save settings" 
      });
    }
  });

  // Get admin settings
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const config = await configService.getConfig();
      res.json(config);
    } catch (error: any) {
      console.error("Failed to get admin settings:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get settings" 
      });
    }
  });

  // Test Immich connection
  app.post("/api/test-immich-connection", async (req, res) => {
    try {
      const { host, apiKey } = req.body;
      
      if (!host || !apiKey) {
        return res.status(400).json({ 
          success: false,
          message: "Host and API key are required" 
        });
      }

      // Test the connection by trying to get albums (same endpoint as working sync)
      const response = await axios.get(`${host}/api/albums`, {
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
        params: {
          take: 1, // Just get 1 album to test the connection
        },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => true, // Don't throw on any status code
      });

      // Check if response is JSON
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        console.error('Immich returned non-JSON response:', {
          status: response.status,
          contentType,
          data: response.data?.toString().substring(0, 200) // First 200 chars for debugging
        });
        return res.status(500).json({ 
          success: false,
          message: `Server returned non-JSON response (${contentType}). Please check the host URL.`
        });
      }

      if (response.status === 200) {
        res.json({ 
          success: true,
          message: "Connection successful!" 
        });
      } else {
        res.json({ 
          success: false,
          message: `Connection failed with status: ${response.status}` 
        });
      }

    } catch (error: any) {
      console.error("Immich connection test error:", error.response?.data || error.message);
      
      // Provide more specific error messages
      let errorMessage = "Connection failed";
      if (error.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to Immich server. Please check the host URL.";
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = "Host not found. Please check the host URL.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please check your API key.";
      } else if (error.response?.status === 404) {
        errorMessage = "API endpoint not found. Please check the host URL.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ 
        success: false,
        message: errorMessage
      });
    }
  });

  // Test Astrometry connection
  app.post("/api/test-astrometry-connection", async (req, res) => {
    try {
      const { apiKey } = req.body;
      
      if (!apiKey) {
        return res.status(400).json({ 
          success: false,
          message: "API key is required" 
        });
      }

      // Test the connection by trying to login (same as working plate solve)
      const loginData = new URLSearchParams();
      loginData.append('request-json', JSON.stringify({ apikey: apiKey }));
      
      const response = await axios.post("http://nova.astrometry.net/api/login", loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => true, // Don't throw on any status code
      });

      if (response.status === 200 && response.data.status === "success") {
        res.json({ 
          success: true,
          message: "Connection successful!" 
        });
      } else {
        res.json({ 
          success: false,
          message: `Connection failed: ${response.data.message || 'Unknown error'}` 
        });
      }

    } catch (error: any) {
      console.error("Astrometry connection test error:", error.response?.data || error.message);
      
      let errorMessage = "Connection failed";
      if (error.code === 'ECONNREFUSED') {
        errorMessage = "Cannot connect to Astrometry.net server.";
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = "Astrometry.net server not found.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({ 
        success: false,
        message: errorMessage
      });
    }
  });

  // Submit image for plate solving
  app.post("/api/images/:id/plate-solve", async (req, res) => {
    try {
      // Check if plate solving is enabled in admin settings
      const astrometryConfig = await configService.getAstrometryConfig();
      if (!astrometryConfig.enabled) {
        return res.status(400).json({ 
          message: "Plate solving is currently disabled. Please enable it in the admin settings." 
        });
      }

      const imageId = parseInt(req.params.id);
      const image = await storage.getAstroImage(imageId);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Use the shared service to complete the full plate solving workflow
      // This will submit, poll for completion, and update the job/image with all results
      const result = await astrometryService.completePlateSolvingWorkflow(image, 300000); // 5 minute timeout

      res.json({
        message: "Image plate solving completed successfully",
        result: {
          calibration: result.calibration,
          annotations: result.annotations,
          machineTags: result.machineTags
        }
      });
    } catch (error: any) {
      console.error("Plate solving error:", error.response?.data || error.message);
      res.status(500).json({
        message: "Failed to complete plate solving",
        error: error.response?.data?.message || error.message
      });
    }
  });

  // Check plate solving status and update results
  app.get("/api/plate-solving/jobs", async (req, res) => {
    try {
      const jobs = await storage.getPlateSolvingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plate solving jobs" });
    }
  });

  // Update plate solving job status
  // Note: This endpoint is mainly for debugging. The worker process automatically checks and updates job status.
  app.post("/api/plate-solving/update/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { status, result } = await astrometryService.checkJobStatus(jobId);

      res.json({ status, result });

    } catch (error: any) {
      console.error("Status update error:", error.response?.data || error.message);
      res.status(500).json({ 
        message: "Failed to update plate solving status",
        error: error.response?.data?.message || error.message 
      });
    }
  });

  // Get image annotations from stored plate solving data
  app.get("/api/images/:id/annotations", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAstroImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Find the plate solving job for this image
      const jobs = await storage.getPlateSolvingJobs();
      const job = jobs.find(j => j.imageId === imageId && j.status === 'success');
      
      if (!image.plateSolved || !job) {
        return res.status(400).json({ message: "Image has not been plate solved" });
      }

      if (!job || !job.result) {
        return res.status(400).json({ message: "No successful plate solving data found" });
      }

      const result = job.result as any;
      const annotations = result.annotations || [];
      const calibration = {
        ra: result.ra,
        dec: result.dec,
        pixscale: result.pixscale,
        radius: result.radius,
        orientation: result.orientation,
      };

      res.json({
        annotations: annotations,
        calibration: calibration,
        imageDimensions: {
          width: result.width || null,
          height: result.height || null,
        }
      });

    } catch (error) {
      const err = error as any;
      console.error("Annotation fetch error:", err.response?.data || err.message);
      res.status(500).json({ 
        message: "Failed to fetch image annotations",
        error: err.response?.data?.message || err.message 
      });
    }
  });

  // Get equipment
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await storage.getEquipment();
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  // Get equipment for a specific image
  app.get("/api/images/:id/equipment", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAstroImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const equipment = await storage.getEquipmentForImage(imageId);
      const imageEquipment = await storage.getImageEquipment(imageId);
      
      // Combine equipment with their relationship data
      const equipmentWithDetails = equipment.map(eq => {
        const relationship = imageEquipment.find(ie => ie.equipmentId === eq.id);
        return {
          ...eq,
          settings: relationship?.settings || null,
          notes: relationship?.notes || null
        };
      });

      res.json(equipmentWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch image equipment" });
    }
  });

  // Add equipment to an image
  app.post("/api/images/:id/equipment", async (req, res) => {
    try {
      console.log('POST /api/images/:id/equipment called');
      console.log('params:', req.params);
      console.log('body:', req.body);
      
      const imageId = parseInt(req.params.id);
      const { equipmentId, settings, notes } = req.body;

      console.log('Parsed values:', { imageId, equipmentId, settings, notes });

      const image = await storage.getAstroImage(imageId);
      if (!image) {
        console.log('Image not found for ID:', imageId);
        return res.status(404).json({ message: "Image not found" });
      }

      const equipment = await storage.getEquipment();
      const targetEquipment = equipment.find(eq => eq.id === equipmentId);
      if (!targetEquipment) {
        console.log('Equipment not found for ID:', equipmentId);
        return res.status(404).json({ message: "Equipment not found" });
      }

      console.log('Adding equipment to image:', { imageId, equipmentId, settings, notes });
      const imageEquipment = await storage.addEquipmentToImage(imageId, equipmentId, settings, notes);
      console.log('Equipment added successfully:', imageEquipment);
      res.json(imageEquipment);
    } catch (error) {
      console.error('Error adding equipment to image:', error);
      res.status(500).json({ message: "Failed to add equipment to image" });
    }
  });

  // Remove equipment from an image
  app.delete("/api/images/:imageId/equipment/:equipmentId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const equipmentId = parseInt(req.params.equipmentId);

      const success = await storage.removeEquipmentFromImage(imageId, equipmentId);
      if (!success) {
        return res.status(404).json({ message: "Equipment relationship not found" });
      }

      res.json({ message: "Equipment removed from image" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove equipment from image" });
    }
  });

  // Update equipment settings for an image
  app.put("/api/images/:imageId/equipment/:equipmentId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const equipmentId = parseInt(req.params.equipmentId);
      const { settings, notes } = req.body;

      const imageEquipment = await storage.updateImageEquipment(imageId, equipmentId, { settings, notes });
      if (!imageEquipment) {
        return res.status(404).json({ message: "Equipment relationship not found" });
      }

      res.json(imageEquipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment settings" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get popular tags
  app.get("/api/tags", async (req, res) => {
    try {
      const images = await storage.getAstroImages();
      const tagCounts: Record<string, number> = {};
      
      images.forEach(image => {
        if (image.tags) {
          image.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const popularTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));

      res.json(popularTags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Proxy Immich image requests
  app.get("/api/assets/:assetId/:type", async (req, res) => {
    try {
      const { assetId, type } = req.params;
      const immichUrl = process.env.IMMICH_URL || process.env.IMMICH_API_URL || "";
      const immichApiKey = process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "";
      if (!immichUrl || !immichApiKey) {
        return res.status(500).json({ message: "Immich configuration missing" });
      }
      // Forward query parameters (e.g., ?size=preview)
      const query = req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '';
      const url = `${immichUrl}/api/assets/${assetId}/${type}${query}`;
      const response = await axios.get(url, {
        headers: { "X-API-Key": immichApiKey },
        responseType: "stream",
      });
      res.set(response.headers);
      response.data.pipe(res);
    } catch (error: any) {
      if (error.response) {
        res.status(error.response.status).json({ message: error.response.statusText });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  });

  // Create new equipment
  app.post("/api/equipment", async (req, res) => {
    try {
      const { name, type, specifications, description } = req.body;
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }
      const equipment = await storage.createEquipment({
        name,
        type,
        specifications: specifications || {},
        description: description || "",
      });
      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  // Update equipment
  app.put("/api/equipment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, type, specifications, description } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }

      const equipment = await storage.updateEquipment(id, {
        name,
        type,
        specifications: specifications || {},
        description: description || "",
      });

      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      res.json(equipment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });

  // Delete equipment
  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEquipment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });

  // Get notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error: any) {
      console.error("Failed to get notifications:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get notifications" 
      });
    }
  });

  // Acknowledge notification
  app.post("/api/notifications/:id/acknowledge", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.acknowledgeNotification(id);
      res.json({ success: true, message: "Notification acknowledged" });
    } catch (error: any) {
      console.error("Failed to acknowledge notification:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to acknowledge notification" 
      });
    }
  });

  // Get cron job status
  app.get("/api/admin/cron-jobs", async (req, res) => {
    try {
      const jobs = cronManager.getAllJobs();
      res.json(jobs);
    } catch (error: any) {
      console.error("Failed to get cron jobs:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get cron jobs" 
      });
    }
  });

  // Fetch albums from Immich
  app.post("/api/immich/albums", async (req, res) => {
    try {
      const { host, apiKey } = req.body;
      if (!host || !apiKey) {
        return res.status(400).json({ message: "Host and API key are required" });
      }
      const response = await axios.get(`${host}/api/albums`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (Array.isArray(response.data)) {
        // Only return id and albumName for dropdown
        const albums = response.data.map((a: any) => ({ id: a.id, albumName: a.albumName }));
        res.json(albums);
      } else {
        res.status(500).json({ message: "Unexpected response from Immich" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.response?.data?.message || error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}