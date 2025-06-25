import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAstroImageSchema, insertPlateSolvingJobSchema } from "@shared/schema";
import axios from "axios";
import FormData from "form-data";

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
      // this should allow a comma-separated list of album IDs
      const immichAlbumId = process.env.IMMICH_ALBUM_IDS || "";

      
      if (!immichUrl || !immichApiKey) {
        return res.status(400).json({ 
          message: "Immich configuration missing. Please set IMMICH_URL and IMMICH_API_KEY environment variables." 
        });
      }

      // Fetch assets from Immich API
      const response = await axios.get(`${immichUrl}/api/albums/${immichAlbumId}`, {
        headers: {
          'X-API-Key': immichApiKey,
        },
        params: {
          take: 100, // Limit to prevent overwhelming
        }
      });

      const assets = response.data.assets;
      console.log(`Found ${assets.length} assets in Immich. Assets:`, assets);
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
        return res.status(400).json({ message: "Image does not have a fullUrl" });
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

      // Download image from Immich
      const immichApiKey = process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "";
      const imageResponse = await axios.get(image.fullUrl, {
        responseType: "arraybuffer",
        headers: {
          'X-API-Key': immichApiKey,
        },
      });
      const imageBuffer = Buffer.from(imageResponse.data);

      // Submit image to Astrometry.net via file upload
      const form = new FormData();
      form.append('request-json', JSON.stringify({ session: sessionKey, apikey: astrometryApiKey }));
      form.append('file', imageBuffer, {
        filename: image.filename || `image_${imageId}.jpg`,
        contentType: imageResponse.headers['content-type'] || 'image/jpeg',
      });

      const uploadResponse = await axios.post(
        'http://nova.astrometry.net/api/upload',
        form,
        {
          headers: form.getHeaders(),
        }
      );

      if (uploadResponse.data.status !== "success") {
        throw new Error("Failed to submit image to Astrometry.net");
      }

      const subId = uploadResponse.data.subid;

      // Create plate solving job record
      const job = await storage.createPlateSolvingJob({
        imageId,
        astrometrySubmissionId: subId.toString(),
        astrometryJobId: null,
        status: "processing",
        result: null,
      });

      res.json({
        message: "Image submitted for plate solving",
        jobId: job.id,
        astrometrySubmissionId: subId
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
  // Note: This endpoint is mainly for debugging. The worker process automatically checks and updates job status.
  app.post("/api/plate-solving/update/:jobId", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getPlateSolvingJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check status with Astrometry.net
      const statusResponse = await axios.get(
        `http://nova.astrometry.net/api/submissions/${job.astrometrySubmissionId}`
      );

      const astrometryStatus = statusResponse.data;
      let status = "processing";
      let result = null;

      if (astrometryStatus.job_calibrations && astrometryStatus.job_calibrations.length > 0) {
        status = "success";
        console.log("Job calibrations:", astrometryStatus.job_calibrations);
        const calibration = astrometryStatus.job_calibrations[0];
        
        // Get calibration details
        const calibrationResponse = await axios.get(
          `http://nova.astrometry.net/api/jobs/${calibration}/calibration/`
        );
        
        result = calibrationResponse.data;
        console.log("CalibrationResult:", result);

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
      const url = `${immichUrl}/api/assets/${assetId}/${type}`;
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

  const httpServer = createServer(app);
  return httpServer;
}