import { storage } from "./storage";
import { astrometryService } from "./astrometry";

class PlateSolvingWorker {
  private isRunning = false;
  private checkInterval = 30000; // 30 seconds
  private maxConcurrent: number = parseInt(process.env.PLATE_SOLVE_MAX_CONCURRENT || "3", 10);

  async start() {
    if (this.isRunning) {
      console.log("Worker is already running");
      return;
    }

    this.isRunning = true;
    console.log(`Starting plate solving worker with max ${this.maxConcurrent} concurrent jobs`);

    while (this.isRunning) {
      try {
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
          await astrometryService.submitImageForPlateSolving(image);
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
        await astrometryService.checkJobStatus(job.id);
      } catch (error) {
        console.error(`Failed to update job ${job.id}:`, error);
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