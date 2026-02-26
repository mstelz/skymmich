
import { Router } from 'express';
import { readFileSync } from 'fs';
import { storage } from '../services/storage';
import { xmpSidecarService } from '../services/xmp-sidecar';
import { configService } from '../services/config';

const router = Router();

// Get all astrophotography images with optional filters
router.get('/', async (req, res) => {
  try {
    const { objectType, tags, plateSolved, constellation } = req.query;
    const filters: any = {};

    if (objectType) filters.objectType = objectType as string;
    if (tags) filters.tags = Array.isArray(tags) ? (tags as string[]) : [tags as string];
    if (plateSolved !== undefined) filters.plateSolved = plateSolved === 'true';
    if (constellation) filters.constellation = constellation as string;

    const images = await storage.getAstroImages(filters);
    res.json(images);
  } catch (error) {
    console.error('Failed to fetch images:', error);
    res.status(500).json({ message: 'Failed to fetch images' });
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
    res.status(500).json({ message: 'Failed to fetch image' });
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

    res.json(updatedImage);
  } catch (error) {
    console.error('Failed to update image:', error);
    res.status(500).json({ message: 'Failed to update image' });
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

    // Find the plate solving job for this image
    const jobs = await storage.getPlateSolvingJobs();
    const job = jobs.find((j) => j.imageId === imageId && j.status === 'success');

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
    const err = error as any;
    console.error('Plate solving job fetch error:', err.response?.data || err.message);
    res.status(500).json({
      message: 'Failed to fetch plate solving job data',
      error: err.response?.data?.message || err.message,
    });
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

    // Find the plate solving job for this image
    const jobs = await storage.getPlateSolvingJobs();
    const job = jobs.find((j) => j.imageId === imageId && j.status === 'success');

    if (!image.plateSolved || !job) {
      return res.status(400).json({ message: 'Image has not been plate solved' });
    }

    if (!job || !job.result) {
      return res.status(400).json({ message: 'No successful plate solving data found' });
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
      },
    });
  } catch (error) {
    const err = error as any;
    console.error('Annotation fetch error:', err.response?.data || err.message);
    res.status(500).json({
      message: 'Failed to fetch image annotations',
      error: err.response?.data?.message || err.message,
    });
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
    res.status(500).json({ message: 'Failed to fetch image equipment' });
  }
});

// Add equipment to an image
router.post('/:id/equipment', async (req, res) => {
  try {
    console.log('POST /api/images/:id/equipment called');
    console.log('params:', req.params);
    console.log('body:', req.body);

    const imageId = parseInt(req.params.id);
    const { equipmentId, settings, notes } = req.body;

    console.log('Parsed values:', { imageId, equipmentId, settings, notes });

    const image = await storage.getAstroImage(imageId);
    if (!image) {
      console.log('Image not found for ID:', imageId);
      return res.status(404).json({ message: 'Image not found' });
    }

    const equipment = await storage.getEquipment();
    const targetEquipment = equipment.find((eq) => eq.id === equipmentId);
    if (!targetEquipment) {
      console.log('Equipment not found for ID:', equipmentId);
      return res.status(404).json({ message: 'Equipment not found' });
    }

    console.log('Adding equipment to image:', { imageId, equipmentId, settings, notes });
    const imageEquipment = await storage.addEquipmentToImage(imageId, equipmentId, settings, notes);
    console.log('Equipment added successfully:', imageEquipment);
    res.json(imageEquipment);
  } catch (error) {
    console.error('Error adding equipment to image:', error);
    res.status(500).json({ message: 'Failed to add equipment to image' });
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
    res.status(500).json({ message: 'Failed to remove equipment from image' });
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
    res.status(500).json({ message: 'Failed to update equipment settings' });
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
    const sidecarPath = xmpSidecarService.resolveSidecarPath(image, sidecarConfig);

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
    console.error('Failed to fetch sidecar:', error);
    res.status(500).json({ message: 'Failed to fetch sidecar' });
  }
});

export default router;
