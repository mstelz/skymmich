import { storage } from "./storage";
import axios from "axios";
import FormData from "form-data";

class PlateSolvingWorker {
  private isRunning = false;
  private checkInterval = 30000; // 30 seconds
  private maxConcurrent: number = parseInt(process.env.PLATE_SOLVE_MAX_CONCURRENT || "3", 10);

  async start() {
    this.isRunning = true;
    console.log("Plate solving worker started");

    while (this.isRunning) {
      try {
        // Automatically create jobs for unsolved images and submit up to maxConcurrent
        await this.createAndSubmitJobsForUnsolvedImages();
        console.log("Checking processing jobs");
        await this.checkProcessingJobs();
        await this.sleep(this.checkInterval);
      } catch (error) {
        console.error("Worker error:", error);
        await this.sleep(5000); // Shorter delay on error
      }
    }
  }

  async createAndSubmitJobsForUnsolvedImages() {
    const images = await storage.getAstroImages();
    const jobs = await storage.getPlateSolvingJobs();
    const unsolvedImages = images.filter(img => !img.plateSolved);
    const processingJobs = jobs.filter(job => ["pending", "processing"].includes(job.status));
    if (processingJobs.length >= this.maxConcurrent) {
      console.log(`Max concurrent plate solving jobs (${this.maxConcurrent}) reached.`);
      return;
    }
    const slotsAvailable = this.maxConcurrent - processingJobs.length;
    let submitted = 0;
    for (const image of unsolvedImages) {
      if (submitted >= slotsAvailable) break;
      const hasJob = jobs.some(job => job.imageId === image.id && ["pending", "processing", "success"].includes(job.status));
      if (!hasJob && image.fullUrl) {
        try {
          console.log(`Auto-submitting image ${image.id} (${image.title}) for plate solving`);
          const astrometryApiKey = process.env.ASTROMETRY_API_KEY || process.env.ASTROMETRY_KEY || "";
          if (!astrometryApiKey) {
            console.error("Astrometry.net API key not configured. Skipping.");
            continue;
          }
          // Login to Astrometry.net
          const loginData = new URLSearchParams();
          loginData.append('request-json', JSON.stringify({ apikey: astrometryApiKey }));
          const loginResponse = await axios.post("http://nova.astrometry.net/api/login", loginData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          if (loginResponse.data.status !== "success") {
            throw new Error("Failed to authenticate with Astrometry.net");
          }
          const sessionKey = loginResponse.data.session;
          // Download image from Immich
          const immichApiKey = process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "";
          const imageResponse = await axios.get(image.fullUrl, {
            responseType: "arraybuffer",
            headers: { 'X-API-Key': immichApiKey },
          });
          const imageBuffer = Buffer.from(imageResponse.data);
          // Submit image to Astrometry.net via file upload
          const form = new FormData();
          form.append('request-json', JSON.stringify({ session: sessionKey, apikey: astrometryApiKey }));
          form.append('file', imageBuffer, {
            filename: image.filename || `image_${image.id}.jpg`,
            contentType: imageResponse.headers['content-type'] || 'image/jpeg',
          });
          const uploadResponse = await axios.post(
            'http://nova.astrometry.net/api/upload',
            form,
            { headers: form.getHeaders() }
          );
          if (uploadResponse.data.status !== "success") {
            throw new Error("Failed to submit image to Astrometry.net");
          }
          const subId = uploadResponse.data.subid;
          // Create plate solving job record
          await storage.createPlateSolvingJob({
            imageId: image.id,
            astrometrySubmissionId: subId.toString(),
            astrometryJobId: null,
            status: "processing",
            result: null,
          });
          submitted++;
        } catch (err) {
          console.error(`Failed to auto-submit image ${image.id}:`, err);
        }
      }
    }
  }

  async checkProcessingJobs() {
    const jobs = await storage.getPlateSolvingJobs();
    const processingJobs = jobs.filter(job => job.status === "processing");

    if (processingJobs.length > 0) {
      console.log(`Checking ${processingJobs.length} processing jobs`);
    }

    for (const job of processingJobs) {
      try {
        await this.updateJobStatus(job.id);
      } catch (error) {
        console.error(`Failed to update job ${job.id}:`, error);
      }
    }
  }

  async updateJobStatus(jobId: number) {
    const job = await storage.getPlateSolvingJob(jobId);
    if (!job) {
      console.log(`Job ${jobId} not found, skipping`);
      return;
    }

    console.log(`Checking status for job ${jobId} (Astrometry ID: ${job.astrometryJobId})`);

    try {
      // Check status with Astrometry.net
      const statusResponse = await axios.get(
        `https://nova.astrometry.net/api/submissions/${job.astrometrySubmissionId}`
      );

      const astrometryStatus = statusResponse.data;
      let status = "processing";
      let result = null;

      // If jobId is not set, set it from the jobs array
      if ((!job.astrometryJobId || job.astrometryJobId === "null") && astrometryStatus.jobs && astrometryStatus.jobs.length > 0) {
        const newJobId = astrometryStatus.jobs[0]?.toString();
        if (newJobId) {
          await storage.updatePlateSolvingJob(job.id, { astrometryJobId: newJobId });
          job.astrometryJobId = newJobId;
        }
      }

      // Now use job.astrometryJobId for all job-based API calls
      if (job.astrometryJobId) {
        if (astrometryStatus.job_calibrations && astrometryStatus.job_calibrations.length > 0) {
          status = "success";
          const calibration = astrometryStatus.job_calibrations[0];

          console.log(`Job ${jobId} completed successfully, getting calibration details...`);

          // Get calibration details
          const calibrationResponse = await axios.get(
            `https://nova.astrometry.net/api/jobs/${job.astrometryJobId}/calibration`
          );
          
          result = calibrationResponse.data;
          console.log("CalibrationResult:", result);

          // Fetch annotations from Astrometry.net
          let annotations = [];
          try {
            const annotationsResponse = await axios.get(
              `https://nova.astrometry.net/api/jobs/${job.astrometryJobId}/annotations`
            );
            
            let annotationsData = annotationsResponse.data;
            
            // Ensure annotations is always an array
            if (!Array.isArray(annotationsData)) {
              // Try to find the first array property in the object
              const arr = Object.values(annotationsData).find(v => Array.isArray(v));
              annotationsData = arr || [];
            }
            
            // Process annotations to include pixel coordinates if available
            annotations = (annotationsData as any[]).map((annotation: any) => ({
              ...annotation,
              ra: parseFloat(annotation.ra),
              dec: parseFloat(annotation.dec),
              pixelX: annotation.pixel_x || null,
              pixelY: annotation.pixel_y || null,
            }));
            
            console.log(`Found ${annotations.length} annotations for job ${job.id}`);
          } catch (annotationError) {
            console.error(`Failed to fetch annotations for job ${job.id}:`, annotationError);
            // Continue without annotations - the plate solving is still successful
          }

          // Update the original image with plate solving results
          if (job.imageId) {
            await storage.updateAstroImage(job.imageId, {
              plateSolved: true,
              ra: result.ra ? result.ra.toString() : null,
              dec: result.dec ? result.dec.toString() : null,
              pixelScale: result.pixscale || null,
              fieldOfView: result.radius ? `${(result.radius * 2).toFixed(1)}'` : null,
              rotation: result.orientation || null,
              astrometryJobId: job.astrometryJobId,
            });
          }

          // Update job with result and annotations
          await storage.updatePlateSolvingJob(job.id, { 
            status, 
            result: {
              ...result,
              annotations
            }
          });

          console.log(`Job ${jobId} completed with status: ${status}`);
        } else if (astrometryStatus.jobs && astrometryStatus.jobs.length > 0) {
          const jobStatus = astrometryStatus.jobs[0];
          if (jobStatus === null) {
            status = "failed";
            console.log(`Job ${jobId} failed on Astrometry.net`);
            
            // Update job status for failed jobs
            await storage.updatePlateSolvingJob(jobId, { 
              status, 
              result: { error: "Job failed on Astrometry.net" }
            });
          }
        }

        // Only update status if we haven't already updated it above
        if (status === "processing") {
          await storage.updatePlateSolvingJob(jobId, { status, result });
        }
      }
    } catch (error: any) {
      console.error(`Error checking job ${jobId}:`, error.response?.data || error.message);

      // If the job returns 404, it has likely expired
      if (error.response?.status === 404) {
        console.log(`Job ${jobId} not found on Astrometry.net (likely expired), marking as failed`);
        await storage.updatePlateSolvingJob(jobId, {
          status: "failed",
          result: { error: "Job expired on Astrometry.net" }
        });
      }
      // If we can't reach Astrometry.net for other reasons, don't update the job status
      // It will be checked again on the next cycle
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log("Plate solving worker stopped");
  }
}

// Start the worker
const worker = new PlateSolvingWorker();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("Shutting down worker...");
  worker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log("Shutting down worker...");
  worker.stop();
  process.exit(0);
});

// Start the worker
worker.start().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
}); 