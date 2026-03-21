
import { Router } from 'express';
import { storage } from '../services/storage';
import { astrometryService } from '../services/astrometry';
import { configService } from '../services/config';
import { Server as SocketIOServer } from 'socket.io';
import { handleRouteError } from './route-utils';

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
      const result = await astrometryService.completePlateSolvingWorkflow(image);

      res.json({
        message: 'Image plate solving completed successfully',
        result: {
          calibration: result.calibration,
          annotations: result.annotations,
          machineTags: result.machineTags,
        },
      });
    } catch (error) {
      handleRouteError(res, error, 'Failed to complete plate solving');
    }
  });

  // Check plate solving status and update results
  router.get('/jobs', async (req, res) => {
    try {
      const jobs = await storage.getPlateSolvingJobs();
      res.json(jobs);
    } catch (error) {
      handleRouteError(res, error, 'Failed to fetch plate solving jobs');
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

          // Submit for plate solving (just submit, don't wait for completion)
          const { submissionId, jobId } = await astrometryService.submitImageForPlateSolving(image);

          results.push({
            imageId,
            success: true,
            submissionId,
            jobId,
            message: 'Submitted for plate solving',
          });
        } catch (error: unknown) {
          const err = error as Error & { response?: { data?: { message?: string } } };
          results.push({
            imageId,
            success: false,
            error: err.response?.data?.message || err.message,
          });
        }
      }

      res.json({
        message: 'Bulk plate solving submission completed',
        results,
      });
    } catch (error) {
      handleRouteError(res, error, 'Failed to submit images for plate solving');
    }
  });

  // Update plate solving job status
  router.post('/update/:jobId', async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const { status, result } = await astrometryService.checkJobStatus(jobId);

      // Emit real-time update via Socket.io if available
      if (io) {
        io.emit('plate-solving-update', { jobId, status, result });
      }

      res.json({ status, result });
    } catch (error) {
      handleRouteError(res, error, 'Failed to update plate solving status');
    }
  });

  return router;
};
