
import { Router } from 'express';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const router = Router();

// Get plate-solved images as sky map markers
router.get('/markers', async (_req, res) => {
  try {
    const images = await storage.getAstroImages({ plateSolved: true });

    const markers = images
      .filter((img) => img.ra && img.dec)
      .map((img) => ({
        id: img.id,
        title: img.title,
        ra: img.ra,
        dec: img.dec,
        thumbnailUrl: img.thumbnailUrl,
        objectType: img.objectType,
        constellation: img.constellation,
        fieldOfView: img.fieldOfView,
      }));

    res.json(markers);
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch sky map markers');
  }
});

export default router;
