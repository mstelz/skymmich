import axios from 'axios';
import FormData from 'form-data';
import { storage } from './storage';
import { xmpSidecarService } from './xmp-sidecar';
import { configService } from './config';
import { getConstellationFromCoordinates } from './constellation-utils';

// Import io from the main server file
let io: any = null;

// Function to set io instance (called from server/index.ts)
export function setSocketIO(socketIO: any) {
  io = socketIO;
}

export interface AstrometryCalibration {
  ra: number;
  dec: number;
  pixscale: number;
  radius: number;
  orientation: number;
  width_arcsec?: number;
  height_arcsec?: number;
  parity?: number;
}

export interface AstrometryAnnotation {
  type: string;
  names: string[];
  pixelx: number;
  pixely: number;
  radius?: number;
  ra?: number;
  dec?: number;
  vmag?: number;
  pixelX?: number;
  pixelY?: number;
}

export interface PlateSolvingResult {
  calibration: AstrometryCalibration;
  annotations: AstrometryAnnotation[];
  machineTags: string[];
}

export class AstrometryService {
  private astrometryApiKey: string;
  private immichApiKey: string;
  private immichHost: string;
  private useConfigService: boolean;

  constructor(useConfigService: boolean = true) {
    this.useConfigService = useConfigService;
    
    // For worker processes, we might want to use env vars directly
    if (!useConfigService) {
      this.astrometryApiKey = process.env.ASTROMETRY_API_KEY || process.env.ASTROMETRY_KEY || "";
      this.immichApiKey = process.env.IMMICH_API_KEY || process.env.IMMICH_KEY || "";
      this.immichHost = process.env.IMMICH_HOST || "";
    } else {
      // Initialize with empty values, will be loaded from config service when needed
      this.astrometryApiKey = "";
      this.immichApiKey = "";
      this.immichHost = "";
    }
  }

  private async ensureConfigLoaded() {
    if (this.useConfigService && (!this.astrometryApiKey || !this.immichApiKey || !this.immichHost)) {
      const config = await configService.getConfig();
      this.astrometryApiKey = config.astrometry.apiKey;
      this.immichApiKey = config.immich.apiKey;
      this.immichHost = config.immich.host;
    }
  }

  private async login(): Promise<string> {
    await this.ensureConfigLoaded();
    
    if (!this.astrometryApiKey) {
      throw new Error("Astrometry.net API key not configured");
    }

    const loginData = new URLSearchParams();
    loginData.append('request-json', JSON.stringify({ apikey: this.astrometryApiKey }));
    
    const loginResponse = await axios.post("http://nova.astrometry.net/api/login", loginData, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)'
      }
    });

    if (loginResponse.data.status !== "success") {
      throw new Error("Failed to authenticate with Astrometry.net");
    }

    return loginResponse.data.session;
  }

  async submitImageForPlateSolving(image: any): Promise<{ submissionId: string; jobId: number }> {
    await this.ensureConfigLoaded();
    
    if (!image.fullUrl) {
      throw new Error("Image does not have a fullUrl");
    }

    if (!this.immichHost) {
      throw new Error("Immich host not configured");
    }

    if (!this.immichApiKey) {
      throw new Error("Immich API key not configured");
    }

    const sessionKey = await this.login();

    // Construct full URL to Immich server
    let fullImageUrl: string;
    if (image.fullUrl.startsWith('http')) {
      fullImageUrl = image.fullUrl;
    } else {
      // Ensure the immichHost doesn't end with a slash and the fullUrl starts with one
      const cleanHost = this.immichHost.endsWith('/') ? this.immichHost.slice(0, -1) : this.immichHost;
      const cleanPath = image.fullUrl.startsWith('/') ? image.fullUrl : `/${image.fullUrl}`;
      fullImageUrl = `${cleanHost}${cleanPath}`;
    }

    // Download image from Immich
    const imageResponse = await axios.get(fullImageUrl, {
      responseType: "arraybuffer",
      headers: { 'X-API-Key': this.immichApiKey },
      timeout: 30000, // 30 second timeout
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Submit image to Astrometry.net via file upload
    const form = new FormData();
    form.append('request-json', JSON.stringify({ session: sessionKey, apikey: this.astrometryApiKey }));
    form.append('file', imageBuffer, {
      filename: image.filename || `image_${image.id}.jpg`,
      contentType: imageResponse.headers['content-type'] || 'image/jpeg',
    });

    const uploadResponse = await axios.post(
      'http://nova.astrometry.net/api/upload',
      form,
      { 
        headers: form.getHeaders(),
        timeout: 60000 // 60 second timeout
      }
    );

    if (uploadResponse.data.status !== "success") {
      throw new Error("Failed to submit image to Astrometry.net");
    }

    const submissionId = uploadResponse.data.subid.toString();

    // Create plate solving job record
    const job = await storage.createPlateSolvingJob({
      imageId: image.id,
      astrometrySubmissionId: submissionId,
      astrometryJobId: null,
      status: "processing",
      result: null,
    });

    // Emit real-time update via Socket.io
    if (io) {
      io.emit('plate-solving-update', {
        jobId: job.id,
        status: "processing",
        imageId: image.id,
        message: "Job submitted for plate solving"
      });
    }

    return { submissionId, jobId: job.id };
  }

  async pollForPlateSolvingResult(submissionId: string, maxWaitTime: number = 300000): Promise<PlateSolvingResult | null> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const statusResponse = await axios.get(
          `https://nova.astrometry.net/api/submissions/${submissionId}`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)' }
          }
        );

        const astrometryStatus = statusResponse.data;

        console.log(`Polling submission ${submissionId} - jobs:`, astrometryStatus.jobs, 'calibrations:', astrometryStatus.job_calibrations);

        if (astrometryStatus.job_calibrations && astrometryStatus.job_calibrations.length > 0) {
          // Job completed successfully
          const jobId = astrometryStatus.jobs?.[0]?.toString();
          if (!jobId) {
            throw new Error("No job ID found in successful submission");
          }

          return await this.fetchCompleteResult(jobId);
        } else if (astrometryStatus.jobs && astrometryStatus.jobs.length > 0) {
          const jobStatus = astrometryStatus.jobs[0];
          if (jobStatus === null) {
            // Job failed
            return null;
          }
          // If job exists but is not null, it's still processing
          // Continue polling
        } else {
          // No jobs array yet - submission is still being processed
          // This is normal for newly submitted images, continue polling
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Job expired or not found
          return null;
        }
        console.error("Error polling for plate solving result:", error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error("Timeout waiting for plate solving to complete");
  }

  async fetchCompleteResult(jobId: string): Promise<PlateSolvingResult> {
    // Get calibration details
    const calibrationResponse = await axios.get(
      `https://nova.astrometry.net/api/jobs/${jobId}/calibration`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)' }
      }
    );
    const calibration: AstrometryCalibration = calibrationResponse.data;

    // Fetch annotations
    let annotations: AstrometryAnnotation[] = [];
    try {
      const annotationsResponse = await axios.get(
        `https://nova.astrometry.net/api/jobs/${jobId}/annotations`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)' }
        }
      );
      
      let annotationsData = annotationsResponse.data;
      
      // Ensure annotations is always an array
      if (!Array.isArray(annotationsData)) {
        const arr = Object.values(annotationsData).find(v => Array.isArray(v));
        annotationsData = arr || [];
      }
      
      // Process annotations to include pixel coordinates if available
      annotations = (annotationsData as any[]).map((annotation: any) => ({
        ...annotation,
        ra: annotation.ra ? parseFloat(annotation.ra) : null,
        dec: annotation.dec ? parseFloat(annotation.dec) : null,
        pixelX: annotation.pixel_x || null,
        pixelY: annotation.pixel_y || null,
      }));
    } catch (error) {
      console.error(`Failed to fetch annotations for job ${jobId}:`, error);
    }

    // Fetch machine tags
    let machineTags: string[] = [];
    try {
      const tagsResponse = await axios.get(
        `http://nova.astrometry.net/api/jobs/${jobId}/machine_tags/`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)' }
        }
      );
      if (Array.isArray(tagsResponse.data)) {
        machineTags = tagsResponse.data;
      } else if (typeof tagsResponse.data === 'string') {
        machineTags = tagsResponse.data.split(',').map((t: string) => t.trim());
      } else if (tagsResponse.data && Array.isArray(tagsResponse.data.tags)) {
        machineTags = tagsResponse.data.tags;
      }
    } catch (error) {
      console.error(`Failed to fetch machine tags for job ${jobId}:`, error);
    }

    return {
      calibration,
      annotations,
      machineTags
    };
  }

  async updateJobAndImage(jobId: number, result: PlateSolvingResult): Promise<void> {
    const job = await storage.getPlateSolvingJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Update job with result and annotations
    await storage.updatePlateSolvingJob(job.id, { 
      status: "success", 
      result: {
        ...result.calibration,
        annotations: result.annotations
      }
    });

    // Update the original image with plate solving results
    if (job.imageId) {
      const image = await storage.getAstroImage(job.imageId);
      if (image) {
        const existingTags: string[] = image.tags || [];
        // Merge and deduplicate tags
        const allTags = Array.from(new Set([...existingTags, ...result.machineTags])).filter(Boolean);
        
        // Determine constellation from RA/Dec coordinates
        let constellation = null;
        if (result.calibration.ra && result.calibration.dec) {
          constellation = getConstellationFromCoordinates(result.calibration.ra, result.calibration.dec);
        }
        
        await storage.updateAstroImage(job.imageId, {
          plateSolved: true,
          ra: result.calibration.ra ? result.calibration.ra.toString() : null,
          dec: result.calibration.dec ? result.calibration.dec.toString() : null,
          pixelScale: result.calibration.pixscale || null,
          fieldOfView: result.calibration.radius ? `${(result.calibration.radius * 2).toFixed(1)}'` : null,
          rotation: result.calibration.orientation || null,
          astrometryJobId: job.astrometryJobId,
          constellation: constellation,
          tags: allTags,
        });

        // Write XMP sidecar file with equipment information
        try {
          if (job.astrometryJobId) {
            // Fetch equipment used for this image
            const equipment = await storage.getEquipmentForImage(job.imageId);
            await xmpSidecarService.writeSidecar(image, result, job.astrometryJobId, equipment);
          }
        } catch (error) {
          console.error(`Failed to write XMP sidecar for image ${image.id}:`, error);
          // Don't fail the entire operation if sidecar writing fails
        }

        // Emit real-time update via Socket.io
        if (io) {
          io.emit('plate-solving-update', {
            jobId: job.id,
            status: "success",
            imageId: job.imageId,
            result: {
              ...result.calibration,
              annotations: result.annotations
            }
          });
        }
      }
    }
  }

  async completePlateSolvingWorkflow(image: any, maxWaitTime: number = 300000): Promise<PlateSolvingResult> {
    // Submit image
    const { submissionId, jobId } = await this.submitImageForPlateSolving(image);
    
    // Poll for completion
    const result = await this.pollForPlateSolvingResult(submissionId, maxWaitTime);
    if (!result) {
      throw new Error("Plate solving failed");
    }

    // Update job and image with results
    await this.updateJobAndImage(jobId, result);
    
    return result;
  }

  async checkJobStatus(jobId: number): Promise<{ status: string; result?: PlateSolvingResult }> {
    const job = await storage.getPlateSolvingJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      const statusResponse = await axios.get(
        `https://nova.astrometry.net/api/submissions/${job.astrometrySubmissionId}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)' }
        }
      );

      const astrometryStatus = statusResponse.data;

      console.log(`Job ${job.id} status check - submission: ${job.astrometrySubmissionId}, jobs:`, astrometryStatus.jobs);

      // If jobId is not set, set it from the jobs array
      if ((!job.astrometryJobId || job.astrometryJobId === "null") && astrometryStatus.jobs && astrometryStatus.jobs.length > 0) {
        const newJobId = astrometryStatus.jobs[0]?.toString();
        if (newJobId) {
          await storage.updatePlateSolvingJob(job.id, { astrometryJobId: newJobId });
          job.astrometryJobId = newJobId;
          console.log(`Updated job ${job.id} with astrometry job ID: ${newJobId}`);
        }
      }

      // Check individual job status if we have a job ID
      if (job.astrometryJobId) {
        try {
          const jobStatusResponse = await axios.get(
            `https://nova.astrometry.net/api/jobs/${job.astrometryJobId}`,
            {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Astrorep/1.0)' }
            }
          );
          
          const jobStatus = jobStatusResponse.data;
          if (jobStatus.status === "failure") {
            await storage.updatePlateSolvingJob(job.id, { 
              status: "failed", 
              result: { error: "Job failed on Astrometry.net" }
            });
            
            // Emit real-time update via Socket.io
            if (io) {
              io.emit('plate-solving-update', { 
                jobId: job.id, 
                status: "failed", 
                result: { error: "Job failed on Astrometry.net" }
              });
            }
            
            return { status: "failed" };
          }
        } catch (jobError: any) {
          if (jobError.response?.status === 404) {
            await storage.updatePlateSolvingJob(job.id, {
              status: "failed",
              result: { error: "Job not found on Astrometry.net" }
            });
            
            // Emit real-time update via Socket.io
            if (io) {
              io.emit('plate-solving-update', { 
                jobId: job.id, 
                status: "failed", 
                result: { error: "Job not found on Astrometry.net" }
              });
            }
            
            return { status: "failed" };
          }
          // If we can't check individual job status, continue with submission status check
        }
      }

      if (astrometryStatus.job_calibrations && astrometryStatus.job_calibrations.length > 0) {
        // Job completed successfully
        const calibration = astrometryStatus.job_calibrations[0];
        const result = await this.fetchCompleteResult(job.astrometryJobId!);
        
        // Update job and image
        await this.updateJobAndImage(job.id, result);
        
        // Emit real-time update via Socket.io
        if (io) {
          io.emit('plate-solving-update', { 
            jobId: job.id, 
            status: "success", 
            result: {
              ...result.calibration,
              annotations: result.annotations
            }
          });
        }
        
        return { status: "success", result };
      } else if (astrometryStatus.jobs && astrometryStatus.jobs.length > 0) {
        const jobStatus = astrometryStatus.jobs[0];
        if (jobStatus === null) {
          await storage.updatePlateSolvingJob(job.id, { 
            status: "failed", 
            result: { error: "Job failed on Astrometry.net" }
          });
          
          // Emit real-time update via Socket.io
          if (io) {
            io.emit('plate-solving-update', { 
              jobId: job.id, 
              status: "failed", 
              result: { error: "Job failed on Astrometry.net" }
            });
          }
          
          return { status: "failed" };
        }
        // If job exists but is not null, it's still processing
        return { status: "processing" };
      } else {
        // No jobs array yet - submission is still being processed
        // This is normal for newly submitted images
        return { status: "processing" };
      }
    } catch (error: any) {
      console.error("Error checking job status:", error);
      throw error;
    }
  }
}

export const astrometryService = new AstrometryService(); 