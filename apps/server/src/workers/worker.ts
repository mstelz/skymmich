import { storage } from "../services/storage";
import { AstrometryService } from "../services/astrometry";
import { configService } from "../services/config";
import { io } from "socket.io-client";

class PlateSolvingWorker {
  private isRunning = false;
  private checkInterval = 30000; // Will be updated from config
  private maxConcurrent: number = 3; // Will be updated from config
  private astrometryService: AstrometryService;
  private socket: any = null;

  constructor() {
    // Create AstrometryService that uses config service (to access admin settings)
    this.astrometryService = new AstrometryService(true);
    
    // Connect to the main server via Socket.io for real-time updates
    this.connectToServer();
  }

  private connectToServer() {
    try {
      this.socket = io('http://localhost:5000');
      
      this.socket.on('connect', () => {
        console.log('Worker connected to server via Socket.io');
      });
      
      this.socket.on('disconnect', () => {
        console.log('Worker disconnected from server');
      });
      
      this.socket.on('connect_error', (error: any) => {
        console.error('Worker Socket.io connection error:', error);
      });
    } catch (error) {
      console.error('Failed to connect worker to server:', error);
    }
  }

  private emitUpdate(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log("Worker is already running");
      return;
    }

    // Load configuration
    const astrometryConfig = await configService.getAstrometryConfig();
    this.checkInterval = astrometryConfig.checkInterval * 1000; // Convert to milliseconds
    this.maxConcurrent = astrometryConfig.maxConcurrent;

    this.isRunning = true;
    console.log(`Starting plate solving worker with max ${this.maxConcurrent} concurrent jobs, check interval: ${astrometryConfig.checkInterval}s`);

    while (this.isRunning) {
      try {
        // Reload config in case it changed
        const currentConfig = await configService.getAstrometryConfig();
        this.checkInterval = currentConfig.checkInterval * 1000;
        this.maxConcurrent = currentConfig.maxConcurrent;

        await this.createAndSubmitJobsForUnsolvedImages();
        await this.checkProcessingJobs();
        await this.sleep(this.checkInterval);
      } catch (error) {
        console.error("Worker error:", error);
        await this.sleep(5000); // Shorter delay on error
      }
    }
  }

  async createAndSubmitJobsForUnsolvedImages() {
    // Check if plate solving is enabled in admin settings
    const astrometryConfig = await configService.getAstrometryConfig();
    if (!astrometryConfig.enabled) {
      return; // Don't submit jobs if plate solving is disabled
    }

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
      
      // Check if image has a job that's not failed (unless auto-resubmit is enabled)
      const existingJob = jobs.find(job => job.imageId === image.id);
      if (existingJob) {
        if (existingJob.status === "failed" && !astrometryConfig.autoResubmit) {
          // Skip failed jobs unless auto-resubmit is enabled
          continue;
        }
        if (["pending", "processing", "success"].includes(existingJob.status)) {
          // Skip if job is already in progress or completed
          continue;
        }
      }
      
      if (image.fullUrl) {
        try {
          console.log(`Auto-submitting image ${image.id} (${image.title}) for plate solving`);
          await this.astrometryService.submitImageForPlateSolving(image);
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
        const result = await this.astrometryService.checkJobStatus(job.id);
        
        // Emit real-time update via Socket.io
        if (result.status !== "processing") {
          this.emitUpdate('plate-solving-update', {
            jobId: job.id,
            status: result.status,
            result: result.result
          });
        }
      } catch (error) {
        console.error(`Failed to update job ${job.id}:`, error);
        
        // Emit error update via Socket.io
        this.emitUpdate('plate-solving-update', {
          jobId: job.id,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log("Stopping plate solving worker");
  }
}

export { PlateSolvingWorker };

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