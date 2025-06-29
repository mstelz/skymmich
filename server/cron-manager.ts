import cron, { ScheduledTask } from 'node-cron';
import axios from 'axios';
import { configService } from './config';
import { storage } from './storage';

// Import io from the main server file
let io: any = null;

// Function to set io instance (called from server/index.ts)
export function setSocketIO(socketIO: any) {
  io = socketIO;
}

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  task: ScheduledTask;
  lastRun?: Date;
  lastError?: string;
  enabled: boolean;
}

class CronManager {
  private jobs: Map<string, CronJob> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('[CRON] Initializing cron manager...');
    
    // Set up Immich sync job
    await this.setupImmichSync();
    
    // Clean up old notifications daily
    this.setupNotificationCleanup();
    
    this.isInitialized = true;
    console.log('[CRON] Cron manager initialized');
  }

  private async setupImmichSync() {
    const config = await configService.getConfig();
    const cronExpr = config.immich.syncFrequency || '0 */4 * * *';
    
    this.scheduleJob('immich-sync', 'Immich Sync', cronExpr, async () => {
      try {
        console.log('[CRON] Starting Immich sync...');
        const response = await axios.post('http://localhost:5000/api/sync-immich', {}, {
          timeout: 30000, // 30 second timeout
          validateStatus: (status) => true, // Don't throw on any status code
        });
        
        if (response.status === 200) {
          console.log(`[CRON] Immich sync completed: ${response.data.message}`);
          
          // Emit real-time update via Socket.io
          if (io) {
            io.emit('immich-sync-complete', {
              success: true,
              message: response.data.message,
              syncedCount: response.data.syncedCount,
              removedCount: response.data.removedCount
            });
          }
          
          // Update job status
          const job = this.jobs.get('immich-sync');
          if (job) {
            job.lastRun = new Date();
            delete job.lastError;
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`);
        }
        
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
        console.error('[CRON] Immich sync failed:', errorMessage);
        
        // Emit real-time update via Socket.io for failures
        if (io) {
          io.emit('immich-sync-complete', {
            success: false,
            message: errorMessage
          });
        }
        
        // Update job status
        const job = this.jobs.get('immich-sync');
        if (job) {
          job.lastRun = new Date();
          job.lastError = errorMessage;
        }
        
        // Create notification - wrap in try-catch to prevent notification creation from crashing
        try {
          await storage.createNotification({
            type: 'error',
            title: 'Immich Sync Failed',
            message: `Automatic sync with Immich failed: ${errorMessage}`,
            details: {
              jobId: 'immich-sync',
              timestamp: new Date().toISOString(),
              error: errorMessage
            }
          });
          console.log('[CRON] Error notification created successfully');
        } catch (notificationError) {
          console.error('[CRON] Failed to create error notification:', notificationError);
        }
      }
    });
  }

  private setupNotificationCleanup() {
    this.scheduleJob('notification-cleanup', 'Notification Cleanup', '0 2 * * *', async () => {
      try {
        await storage.clearOldNotifications(30);
        console.log('[CRON] Old notifications cleaned up');
      } catch (error: any) {
        console.error('[CRON] Failed to clean up notifications:', error.message);
        // Don't create a notification for cleanup failures to avoid infinite loops
      }
    });
  }

  private scheduleJob(id: string, name: string, schedule: string, task: () => Promise<void>) {
    // Stop existing job if it exists
    this.stopJob(id);
    
    try {
      // Wrap the task in a global error handler
      const safeTask = async () => {
        try {
          await task();
        } catch (error: any) {
          console.error(`[CRON] Unhandled error in job ${name}:`, error.message);
          
          // Try to create a notification for unhandled errors
          try {
            await storage.createNotification({
              type: 'error',
              title: 'Cron Job Error',
              message: `Unhandled error in ${name}: ${error.message}`,
              details: { jobId: id, error: error.message }
            });
          } catch (notificationError) {
            console.error('[CRON] Failed to create unhandled error notification:', notificationError);
          }
        }
      };
      
      const cronTask = cron.schedule(schedule, safeTask);
      
      const job: CronJob = {
        id,
        name,
        schedule,
        task: cronTask,
        enabled: true
      };
      
      this.jobs.set(id, job);
      console.log(`[CRON] Scheduled ${name} with cron: ${schedule}`);
      
    } catch (error: any) {
      console.error(`[CRON] Failed to schedule ${name}:`, error);
      
      // Create notification for scheduling failure - wrap in try-catch
      try {
        storage.createNotification({
          type: 'error',
          title: 'Cron Job Scheduling Failed',
          message: `Failed to schedule ${name} with cron expression: ${schedule}`,
          details: { jobId: id, schedule, error: error.message }
        });
      } catch (notificationError) {
        console.error('[CRON] Failed to create scheduling failure notification:', notificationError);
      }
    }
  }

  private stopJob(id: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.task.stop();
      job.task.destroy();
      this.jobs.delete(id);
    }
  }

  async rescheduleJob(id: string) {
    if (id === 'immich-sync') {
      await this.setupImmichSync();
    }
  }

  async rescheduleAll() {
    console.log('[CRON] Rescheduling all jobs...');
    await this.setupImmichSync();
  }

  getJobStatus(id: string) {
    return this.jobs.get(id);
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  async shutdown() {
    console.log('[CRON] Shutting down cron manager...');
    for (const job of Array.from(this.jobs.values())) {
      job.task.stop();
      job.task.destroy();
    }
    this.jobs.clear();
    this.isInitialized = false;
  }
}

export const cronManager = new CronManager(); 