
import { Router } from 'express';
import { storage } from '../services/storage';
import { astrometryService } from '../services/astrometry';
import { configService } from '../services/config';
import { Server as SocketIOServer } from 'socket.io';

export default (io?: SocketIOServer) => {
  const router = Router();

  // Submit image for plate solving
  router.post('/images/:id/plate-solve', async (req, res) => {
    try {
      // Check if plate solving is enabled and API key is configured
      const astrometryConfig = await configService.getAstrometryConfig();
      if (!astrometryConfig.enabled || !astrometryConfig.apiKey) {
        return res.status(400).json({
          message: 'Plate solving is not configured. Please enable it and provide an API key in the admin settings.',
        });
      }

      const imageId = parseInt(req.params.id);
      const image = await storage.getAstroImage(imageId);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Use the shared service to complete the full plate solving workflow
      // This will submit, poll for completion, and update the job/image with all results
      const result = await astrometryService.completePlateSolvingWorkflow(image);

      res.json({
        message: 'Image plate solving completed successfully',
        result: {
          calibration: result.calibration,
          annotations: result.annotations,
          machineTags: result.machineTags,
        },
      });
    } catch (error: any) {
      console.error('Plate solving error:', error.response?.data || error.message);
      res.status(500).json({
        message: 'Failed to complete plate solving',
        error: error.response?.data?.message || error.message,
      });
    }
  });

  // Check plate solving status and update results
  router.get('/jobs', async (req, res) => {
    try {
      const jobs = await storage.getPlateSolvingJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch plate solving jobs' });
    }
  });

  // Bulk submit images for plate solving
  router.post('/bulk', async (req, res) => {
    try {
      const { imageIds } = req.body;

      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        return res.status(400).json({ message: 'imageIds array is required' });
      }

      // Check if plate solving is enabled and API key is configured
      const astrometryConfig = await configService.getAstrometryConfig();
      if (!astrometryConfig.enabled || !astrometryConfig.apiKey) {
        return res.status(400).json({
          message: 'Plate solving is not configured. Please enable it and provide an API key in the admin settings.',
        });
      }

      const results = [];

      for (const imageId of imageIds) {
        try {
          const image = await storage.getAstroImage(imageId);
          if (!image) {
            results.push({ imageId, success: false, error: 'Image not found' });
            continue;
          }

          if (image.plateSolved) {
            results.push({ imageId, success: false, error: 'Image already plate solved' });
            continue;
          }

          // Submit for plate solving (just submit, don\'t wait for completion)
          const { submissionId, jobId } = await astrometryService.submitImageForPlateSolving(image);

          results.push({
            imageId,
            success: true,
            submissionId,
            jobId,
            message: 'Submitted for plate solving',
          });
        } catch (error: any) {
          results.push({
            imageId,
            success: false,
            error: error.response?.data?.message || error.message,
          });
        }
      }

      res.json({
        message: 'Bulk plate solving submission completed',
        results,
      });
    } catch (error: any) {
      console.error('Bulk plate solving error:', error);
      res.status(500).json({
        message: 'Failed to submit images for plate solving',
        error: error.message,
      });
    }
  });

  // Update plate solving job status
  // Note: This endpoint is mainly for debugging. The worker process automatically checks and updates job status.
  router.post('/update/:jobId', async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { status, result } = await astrometryService.checkJobStatus(jobId);

      // Emit real-time update via Socket.io if available
      if (io) {
        io.emit('plate-solving-update', { jobId, status, result });
      }

      res.json({ status, result });
    } catch (error: any) {
      console.error('Status update error:', error.response?.data || error.message);
      res.status(500).json({
        message: 'Failed to update plate solving status',
        error: error.response?.data?.message || error.message,
      });
    }
  });

  return router;
};
