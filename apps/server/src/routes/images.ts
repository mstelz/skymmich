
import { Router } from 'express';
import { readFileSync } from 'fs';
import { storage } from '../services/storage';
import { xmpSidecarService } from '../services/xmp-sidecar';
import { configService } from '../services/config';
import { handleRouteError } from './route-utils';

import axios from 'axios';

const router = Router();

// Helper to update Immich asset metadata
async function updateImmichAssetMetadata(immichId: string, metadata: { latitude?: number; longitude?: number }) {
  try {
    const config = await configService.getImmichConfig();
    if (!config.host || !config.apiKey) {
      console.warn('Immich config missing, skipping metadata sync');
      return;
    }

    // Immich PUT /assets expects an array of ids and the changes
    await axios.put(
      `${config.host}/api/assets`,
      {
        ids: [immichId],
        latitude: metadata.latitude,
        longitude: metadata.longitude,
      },
      {
        headers: { 'X-API-Key': config.apiKey },
      }
    );
    console.log(`Synced metadata to Immich for asset ${immichId}`);
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: unknown } };
    console.error(`Failed to sync metadata to Immich for asset ${immichId}:`, err.response?.data || err.message);
  }
}

// Get all astrophotography images with optional filters
router.get('/', async (req, res) => {
  try {
    const { objectType, tags, plateSolved, constellation, equipmentId } = req.query;
    const filters: { objectType?: string; tags?: string[]; plateSolved?: boolean; constellation?: string; equipmentId?: number } = {};

    if (objectType) filters.objectType = objectType as string;
    if (tags) filters.tags = Array.isArray(tags) ? (tags as string[]) : [tags as string];
    if (plateSolved !== undefined) filters.plateSolved = plateSolved === 'true';
    if (constellation) filters.constellation = constellation as string;
    if (equipmentId) filters.equipmentId = parseInt(equipmentId as string);

    const images = await storage.getAstroImages(filters);
    res.json(images);
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch images');
  }
});

// Get a specific image
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const image = await storage.getAstroImage(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.json(image);
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch image');
  }
});

// Update a specific image
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const updatedImage = await storage.updateAstroImage(id, updates);
    if (!updatedImage) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Sync to Immich if coordinates were updated
    if (updatedImage.immichId && (updates.latitude !== undefined || updates.longitude !== undefined)) {
      await updateImmichAssetMetadata(updatedImage.immichId, {
        latitude: updatedImage.latitude || undefined,
        longitude: updatedImage.longitude || undefined,
      });
    }

    res.json(updatedImage);
  } catch (error) {
    handleRouteError(res, error, 'Failed to update image');
  }
});

// Get plate solving job data for an image
router.get('/:id/plate-solving-job', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const image = await storage.getAstroImage(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Find the successful plate solving job for this image directly
    const job = await storage.getLatestPlateSolvingJob(imageId, 'success');

    if (!image.plateSolved || !job) {
      return res.status(400).json({ message: 'Image has not been successfully plate solved' });
    }

    res.json({
      jobId: job.id,
      submissionId: job.astrometrySubmissionId,
      astrometryJobId: job.astrometryJobId,
      status: job.status,
      submittedAt: job.submittedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch plate solving job data');
  }
});

// Get image annotations from stored plate solving data
router.get('/:id/annotations', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const image = await storage.getAstroImage(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Find the successful plate solving job for this image directly
    const job = await storage.getLatestPlateSolvingJob(imageId, 'success');

    if (!image.plateSolved || !job) {
      return res.status(400).json({ message: 'Image has not been plate solved' });
    }

    if (!job.result) {
      return res.status(400).json({ message: 'No successful plate solving data found' });
    }

    const result = job.result as Record<string, unknown>;
    const annotations = (result.annotations as unknown[]) || [];
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
      },
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch image annotations');
  }
});

// Get equipment for a specific image
router.get('/:id/equipment', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const image = await storage.getAstroImage(imageId);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const equipment = await storage.getEquipmentForImage(imageId);
    const imageEquipment = await storage.getImageEquipment(imageId);

    // Combine equipment with their relationship data
    const equipmentWithDetails = equipment.map((eq) => {
      const relationship = imageEquipment.find((ie) => ie.equipmentId === eq.id);
      return {
        ...eq,
        settings: relationship?.settings || null,
        notes: relationship?.notes || null,
      };
    });

    res.json(equipmentWithDetails);
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch image equipment');
  }
});

// Add equipment to an image
router.post('/:id/equipment', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const { equipmentId, settings, notes } = req.body;

    const image = await storage.getAstroImage(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const equipment = await storage.getEquipment();
    const targetEquipment = equipment.find((eq) => eq.id === equipmentId);
    if (!targetEquipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const imageEquipment = await storage.addEquipmentToImage(imageId, equipmentId, settings, notes);
    res.json(imageEquipment);
  } catch (error) {
    handleRouteError(res, error, 'Failed to add equipment to image');
  }
});

// Remove equipment from an image
router.delete('/:imageId/equipment/:equipmentId', async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const equipmentId = parseInt(req.params.equipmentId);

    const success = await storage.removeEquipmentFromImage(imageId, equipmentId);
    if (!success) {
      return res.status(404).json({ message: 'Equipment relationship not found' });
    }

    res.json({ message: 'Equipment removed from image' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to remove equipment from image');
  }
});

// Update equipment settings for an image
router.put('/:imageId/equipment/:equipmentId', async (req, res) => {
  try {
    const imageId = parseInt(req.params.imageId);
    const equipmentId = parseInt(req.params.equipmentId);
    const { settings, notes } = req.body;

    const imageEquipment = await storage.updateImageEquipment(imageId, equipmentId, { settings, notes });
    if (!imageEquipment) {
      return res.status(404).json({ message: 'Equipment relationship not found' });
    }

    res.json(imageEquipment);
  } catch (error) {
    handleRouteError(res, error, 'Failed to update equipment settings');
  }
});

// --- Image Acquisition Routes ---

// Get acquisition entries for an image
router.get('/:id/acquisitions', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const acquisitions = await storage.getImageAcquisitions(imageId);
    res.json(acquisitions);
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch acquisition entries');
  }
});

// Add acquisition entry to an image
router.post('/:id/acquisitions', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const { filterId, filterName, frameCount, exposureTime, gain, offset, binning, sensorTemp, date, notes } = req.body;

    if (!frameCount || !exposureTime) {
      return res.status(400).json({ message: 'frameCount and exposureTime are required' });
    }

    const acquisition = await storage.createImageAcquisition({
      imageId,
      filterId: filterId || null,
      filterName: filterName || null,
      frameCount,
      exposureTime,
      gain: gain ?? null,
      offset: offset ?? null,
      binning: binning || null,
      sensorTemp: sensorTemp ?? null,
      date: date ? new Date(date) : null,
      notes: notes || null,
    });
    res.json(acquisition);
  } catch (error) {
    handleRouteError(res, error, 'Failed to create acquisition entry');
  }
});

// Update an acquisition entry
router.put('/:imageId/acquisitions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { filterId, filterName, frameCount, exposureTime, gain, offset, binning, sensorTemp, date, notes } = req.body;

    const acquisition = await storage.updateImageAcquisition(id, {
      filterId, filterName, frameCount, exposureTime,
      gain, offset, binning, sensorTemp,
      date: date ? new Date(date) : null,
      notes,
    });

    if (!acquisition) {
      return res.status(404).json({ message: 'Acquisition entry not found' });
    }
    res.json(acquisition);
  } catch (error) {
    handleRouteError(res, error, 'Failed to update acquisition entry');
  }
});

// Delete an acquisition entry
router.delete('/:imageId/acquisitions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteImageAcquisition(id);
    if (!success) {
      return res.status(404).json({ message: 'Acquisition entry not found' });
    }
    res.json({ message: 'Acquisition entry deleted' });
  } catch (error) {
    handleRouteError(res, error, 'Failed to delete acquisition entry');
  }
});

// Get XMP sidecar for an image
router.get('/:id/sidecar', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const image = await storage.getAstroImage(id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const sidecarConfig = await configService.getSidecarConfig();
    const sidecarPath = await xmpSidecarService.resolveSidecarPath(image, sidecarConfig);

    if (!sidecarPath) {
      return res.status(404).json({ message: 'No XMP sidecar found for this image' });
    }

    const content = readFileSync(sidecarPath, 'utf8');
    const isDownload = req.query.download === 'true';

    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename="${image.filename}.xmp"`);
    }

    res.setHeader('Content-Type', 'application/xml');
    res.send(content);
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch sidecar');
  }
});

export default router;
