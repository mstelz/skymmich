import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { catalogService, normalizeObjectName } from '../services/catalog';
import { storage } from '../services/storage';

const router = Router();

const THUMBNAIL_CACHE_DIR = process.env.THUMBNAIL_CACHE_DIR
  || (process.env.NODE_ENV === 'production' ? '/app/cache/thumbnails' : './data/thumbnails');

// Ensure cache dir exists at startup
fs.mkdir(THUMBNAIL_CACHE_DIR, { recursive: true }).catch(() => {});

// Browse catalog with pagination and filtering
router.get('/browse', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const q = req.query.q as string | undefined;
    const type = req.query.type as string | undefined;
    const constellation = req.query.constellation as string | undefined;
    const maxMag = req.query.maxMag ? parseFloat(req.query.maxMag as string) : undefined;
    const minMag = req.query.minMag ? parseFloat(req.query.minMag as string) : undefined;
    const minSize = req.query.minSize ? parseFloat(req.query.minSize as string) : undefined;
    const messierOnly = req.query.messierOnly === 'true';
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as string | undefined;
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const hideBelow = req.query.hideBelow === 'true';
    const names = req.query.names ? (req.query.names as string).split(',') : undefined;

    const result = await catalogService.browseCatalog({
      page, limit, q, type, constellation, maxMag, minMag, minSize, messierOnly,
      sortBy: sortBy as 'name' | 'vMag' | 'majorAxis' | 'bestNow' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      latitude, hideBelow, names,
    });
    res.json(result);
  } catch (error) {
    console.error('Failed to browse catalog:', error);
    res.status(500).json({ message: 'Failed to browse catalog' });
  }
});

// Search catalog objects (autocomplete)
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 1) {
      return res.json([]);
    }
    const results = await catalogService.searchCatalog(q, 20);
    res.json(results);
  } catch (error) {
    console.error('Failed to search catalog:', error);
    res.status(500).json({ message: 'Failed to search catalog' });
  }
});

// Get catalog status
router.get('/status', async (req, res) => {
  try {
    const status = await catalogService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Failed to get catalog status:', error);
    res.status(500).json({ message: 'Failed to get catalog status' });
  }
});

// Get a cached survey thumbnail for a catalog object
router.get('/thumbnail/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const safeFilename = name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.jpg';
    const cachePath = path.join(THUMBNAIL_CACHE_DIR, safeFilename);

    // Serve from cache if available
    if (existsSync(cachePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      const data = await fs.readFile(cachePath);
      return res.send(data);
    }

    // Look up catalog object for coordinates
    const obj = await catalogService.getCatalogObject(name);
    if (!obj || obj.raDeg == null || obj.decDeg == null) {
      return res.status(404).json({ message: 'Object not found or has no coordinates' });
    }

    // Compute field of view from major axis (arcmin → degrees), with padding
    const fov = obj.majorAxis ? Math.max((obj.majorAxis / 60) * 1.5, 0.05) : 0.25;

    const url = `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&ra=${obj.raDeg}&dec=${obj.decDeg}&fov=${fov.toFixed(3)}&width=300&height=200&format=jpg`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: 'Failed to fetch survey image' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Cache to disk
    await fs.writeFile(cachePath, buffer);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (error) {
    console.error('Failed to get thumbnail:', error);
    res.status(500).json({ message: 'Failed to get thumbnail' });
  }
});

// Get a single catalog object by name
router.get('/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const obj = await catalogService.getCatalogObject(name);
    if (!obj) {
      return res.status(404).json({ message: 'Catalog object not found' });
    }
    res.json(obj);
  } catch (error) {
    console.error('Failed to get catalog object:', error);
    res.status(500).json({ message: 'Failed to get catalog object' });
  }
});

// Load/reload catalog from GitHub
router.post('/load', async (req, res) => {
  try {
    const result = await catalogService.loadCatalog();
    res.json({ message: `Loaded ${result.count} catalog objects`, count: result.count });
  } catch (error) {
    console.error('Failed to load catalog:', error);
    res.status(500).json({ message: 'Failed to load catalog' });
  }
});

// Check for catalog updates
router.post('/check-updates', async (req, res) => {
  try {
    const result = await catalogService.checkForUpdates();
    res.json(result);
  } catch (error) {
    console.error('Failed to check for updates:', error);
    res.status(500).json({ message: 'Failed to check for updates' });
  }
});

// Backfill targets: re-match all plate-solved images that have tags but no targetName
router.post('/backfill-targets', async (req, res) => {
  try {
    const images = await storage.getAstroImages();
    let matched = 0;
    let skipped = 0;

    for (const image of images) {
      // Skip images that already have a target name
      if (image.targetName) {
        skipped++;
        continue;
      }

      const tags = image.tags as string[] | null;
      if (!tags || tags.length === 0) continue;

      const matches = await catalogService.matchTargetFromTags(tags);
      if (matches.length > 0) {
        await storage.updateAstroImage(image.id, { targetName: matches[0].name } as any);
        matched++;
      }
    }

    res.json({
      message: `Backfill complete: ${matched} images matched, ${skipped} already had targets`,
      matched,
      skipped,
      total: images.length,
    });
  } catch (error) {
    console.error('Failed to backfill targets:', error);
    res.status(500).json({ message: 'Failed to backfill targets' });
  }
});

export default router;
