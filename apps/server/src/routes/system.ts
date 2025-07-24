
import { Router } from 'express';
import { storage } from '../services/storage';
import { configService } from '../services/config';
import { cronManager } from '../services/cron-manager';
import { workerManager } from '../services/worker-manager';
import { astrometryService } from '../services/astrometry';
import axios from 'axios';

const router = Router();

// Save admin settings
router.post('/admin/settings', async (req, res) => {
  try {
    const settings = req.body;
    await configService.updateConfig(settings);
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Failed to save admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save settings',
    });
  }
});

// Get admin settings
router.get('/admin/settings', async (req, res) => {
  try {
    const config = await configService.getConfig();
    res.json(config);
  } catch (error: any) {
    console.error('Failed to get admin settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings',
    });
  }
});

// Test Astrometry connection
router.post('/test-astrometry-connection', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required',
      });
    }

    // Test the connection by trying to login (same as working plate solve)
    const loginData = new URLSearchParams();
    loginData.append('request-json', JSON.stringify({ apikey: apiKey }));

    const response = await axios.post('http://nova.astrometry.net/api/login', loginData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => true, // Don't throw on any status code
    });

    if (response.status === 200 && response.data.status === 'success') {
      res.json({
        success: true,
        message: 'Connection successful!',
      });
    } else {
      res.json({
        success: false,
        message: `Connection failed: ${response.data.message || 'Unknown error'}`,
      });
    }
  } catch (error: any) {
    console.error('Astrometry connection test error:', error.response?.data || error.message);

    let errorMessage = 'Connection failed';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Astrometry.net server.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Astrometry.net server not found.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.json({
      success: false,
      message: errorMessage,
    });
  }
});

// Get stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await storage.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const images = await storage.getAstroImages();
    const tagCounts: Record<string, number> = {};

    images.forEach((image) => {
      if (Array.isArray(image.tags)) {
        image.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    res.json(popularTags);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
});

// Get constellations
router.get('/constellations', async (req, res) => {
  try {
    const images = await storage.getAstroImages();
    const constellations = Array.from(
      new Set(images.filter((img) => img.constellation).map((img) => img.constellation!)),
    ).sort();
    res.json(constellations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch constellations' });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await storage.getNotifications();
    res.json(notifications);
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
    });
  }
});

// Acknowledge notification
router.post('/notifications/:id/acknowledge', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.acknowledgeNotification(id);
    res.json({ success: true, message: 'Notification acknowledged' });
  } catch (error: any) {
    console.error('Failed to acknowledge notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge notification',
    });
  }
});

// Get cron job status
router.get('/admin/cron-jobs', async (req, res) => {
  try {
    const jobs = cronManager.getAllJobs();
    res.json(jobs);
  } catch (error: any) {
    console.error('Failed to get cron jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cron jobs',
    });
  }
});

// Health check endpoint for container monitoring
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    let databaseStatus = 'healthy';
    try {
      await storage.getStats(); // Simple database query
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      databaseStatus = 'unhealthy';
    }

    // Get worker status
    const workerStatus = workerManager.getStatus();

    const healthStatus = {
      status: databaseStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: databaseStatus,
      worker: {
        enabled: workerStatus.enabled,
        running: workerStatus.running,
        pid: workerStatus.pid,
        restartAttempts: workerStatus.restartAttempts,
      },
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version,
    };

    // Return 503 if database is unhealthy
    const statusCode = databaseStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;
