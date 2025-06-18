import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAstroImageSchema, insertPlateSolvingJobSchema } from "@shared/schema";
import axios from "axios";

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
      const immichUrl = process.env.IMMICH_URL || process.env.IMMICH_API_URL || "";
      const immichApiKey = process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "";
      
      if (!immichUrl || !immichApiKey) {
        return res.status(400).json({ 
          message: "Immich configuration missing. Please set IMMICH_URL and IMMICH_API_KEY environment variables." 
        });
      }

      // Fetch assets from Immich API
      const response = await axios.get(`${immichUrl}/api/assets`, {
        headers: {
          'X-API-Key': immichApiKey,
        },
        params: {
          take: 100, // Limit to prevent overwhelming
        }
      });

      const assets = response.data;
      let syncedCount = 0;

      for (const asset of assets) {
        // Check if image already exists
        const existing = await storage.getAstroImageByImmichId(asset.id);
        if (existing) continue;

        // Extract EXIF data and create astrophotography image
        const astroImage = {
          immichId: asset.id,
          title: asset.originalFileName || asset.id,
          filename: asset.originalFileName || "",
          thumbnailUrl: `${immichUrl}/api/assets/${asset.id}/thumbnail`,
          fullUrl: `${immichUrl}/api/assets/${asset.id}/original`,
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
          description: "",
        };

        await storage.createAstroImage(astroImage);
        syncedCount++;
      }

      res.json({ 
        message: `Successfully synced ${syncedCount} new images from Immich`,
        syncedCount 
      });

    } catch (error: any) {
      console.error("Immich sync error:", error.response?.data || error.message);
      res.status(500).json({ 
        message: "Failed to sync with Immich", 
        error: error.response?.data?.message || error.message 
      });
    }
  });

  // Submit image for plate solving
  app.post("/api/images/:id/plate-solve", async (req, res) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.getAstroImage(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      if (!image.fullUrl) {
        return res.status(400).json({ message: "Image URL not available" });
      }

      const astrometryApiKey = process.env.ASTROMETRY_API_KEY || process.env.ASTROMETRY_KEY || "";
      
      if (!astrometryApiKey) {
        return res.status(400).json({ 
          message: "Astrometry.net API key not configured. Please set ASTROMETRY_API_KEY environment variable." 
        });
      }

      // Submit to Astrometry.net
      const loginData = new URLSearchParams();
      loginData.append('request-json', JSON.stringify({ apikey: astrometryApiKey }));
      
      const loginResponse = await axios.post("http://nova.astrometry.net/api/login", loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (loginResponse.data.status !== "success") {
        throw new Error("Failed to authenticate with Astrometry.net");
      }

      const sessionKey = loginResponse.data.session;

      // Submit image URL for solving
      const submitData = new URLSearchParams();
      submitData.append('request-json', JSON.stringify({
        session: sessionKey,
        url: image.fullUrl,
        scale_units: "arcminperpix",
        scale_type: "ul",
        scale_lower: 0.5,
        scale_upper: 60,
        center_ra: image.ra ? parseFloat(image.ra) : undefined,
        center_dec: image.dec ? parseFloat(image.dec) : undefined,
        radius: 2.0,
      }));
      
      const submitResponse = await axios.post("http://nova.astrometry.net/api/url_upload", submitData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (submitResponse.data.status !== "success") {
        throw new Error("Failed to submit image to Astrometry.net");
      }

      const subId = submitResponse.data.subid;

      // Create plate solving job record
      const job = await storage.createPlateSolvingJob({
        imageId,
        astrometryJobId: subId.toString(),
        status: "processing",
        result: null,
      });

      res.json({ 
        message: "Image submitted for plate solving",
        jobId: job.id,
        astrometryJobId: subId 
      });

    } catch (error: any) {
      console.error("Plate solving error:", error.response?.data || error.message);
      res.status(500).json({ 
        message: "Failed to submit image for plate solving",
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
  app.post("/api/plate-solving/update/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getPlateSolvingJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check status with Astrometry.net
      const statusResponse = await axios.get(
        `http://nova.astrometry.net/api/submissions/${job.astrometryJobId}`
      );

      const astrometryStatus = statusResponse.data;
      let status = "processing";
      let result = null;

      if (astrometryStatus.job_calibrations && astrometryStatus.job_calibrations.length > 0) {
        status = "success";
        const calibration = astrometryStatus.job_calibrations[0];
        
        // Get calibration details
        const calibrationResponse = await axios.get(
          `http://nova.astrometry.net/api/jobs/${calibration}/calibration/`
        );
        
        result = calibrationResponse.data;
        
        // Update the original image with plate solving results
        if (job.imageId) {
          await storage.updateAstroImage(job.imageId, {
            plateSolved: true,
            ra: result.ra ? result.ra.toString() : null,
            dec: result.dec ? result.dec.toString() : null,
            pixelScale: result.pixscale || null,
            fieldOfView: result.radius ? `${(result.radius * 2).toFixed(1)}'` : null,
            rotation: result.orientation || null,
          });
        }
      } else if (astrometryStatus.jobs && astrometryStatus.jobs.length > 0) {
        const jobStatus = astrometryStatus.jobs[0];
        if (jobStatus === null) {
          status = "failed";
        }
      }

      // Update job status
      await storage.updatePlateSolvingJob(jobId, { status, result });

      res.json({ status, result });

    } catch (error: any) {
      console.error("Status update error:", error.response?.data || error.message);
      res.status(500).json({ 
        message: "Failed to update plate solving status",
        error: error.response?.data?.message || error.message 
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

  const httpServer = createServer(app);
  return httpServer;
}