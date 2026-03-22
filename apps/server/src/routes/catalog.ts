import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import fs from 'fs/promises';
import { catalogService, normalizeObjectName } from '../services/catalog';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

const THUMBNAIL_CACHE_DIR = process.env.THUMBNAIL_CACHE_DIR
  || (process.env.NODE_ENV === 'production' ? '/app/cache/thumbnails' : './data/thumbnails');

// Ensure cache dir exists at startup
fs.mkdir(THUMBNAIL_CACHE_DIR, { recursive: true }).catch(err => {
  console.warn('Failed to create thumbnail cache dir:', err);
});

// Serve cached thumbnails as static files — Hono/node-server handles path safety.
// Rewrite the request path to the sanitized filename before static lookup.
app.use('/thumbnail/*', serveStatic({
  root: THUMBNAIL_CACHE_DIR,
  rewriteRequestPath: (p) => {
    const name = decodeURIComponent(p.replace(/^\/thumbnail\//, ''));
    return '/' + name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.jpg';
  },
}));

// Browse catalog with pagination and filtering
app.get('/browse', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '') || 1;
    const limit = parseInt(c.req.query('limit') || '') || 50;
    const q = c.req.query('q');
    const type = c.req.query('type');
    const constellation = c.req.query('constellation');
    const maxMag = c.req.query('maxMag') ? parseFloat(c.req.query('maxMag')!) : undefined;
    const minMag = c.req.query('minMag') ? parseFloat(c.req.query('minMag')!) : undefined;
    const minSize = c.req.query('minSize') ? parseFloat(c.req.query('minSize')!) : undefined;
    const messierOnly = c.req.query('messierOnly') === 'true';
    const sortBy = c.req.query('sortBy');
    const sortOrder = c.req.query('sortOrder');
    const latitude = c.req.query('latitude') ? parseFloat(c.req.query('latitude')!) : undefined;
    const hideBelow = c.req.query('hideBelow') === 'true';
    const names = c.req.query('names') ? c.req.query('names')!.split(',') : undefined;

    const result = await catalogService.browseCatalog({
      page, limit, q, type, constellation, maxMag, minMag, minSize, messierOnly,
      sortBy: sortBy as 'name' | 'vMag' | 'majorAxis' | 'bestNow' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
      latitude, hideBelow, names,
    });
    return c.json(result);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to browse catalog');
  }
});

// Search catalog objects (autocomplete)
app.get('/search', async (c) => {
  try {
    const q = c.req.query('q');
    if (!q || q.length < 1) {
      return c.json([]);
    }
    const results = await catalogService.searchCatalog(q, 20);
    return c.json(results);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to search catalog');
  }
});

// Get catalog status
app.get('/status', async (c) => {
  try {
    const status = await catalogService.getStatus();
    return c.json(status);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to get catalog status');
  }
});

// Concurrency limiter for external survey image fetches (cache hits bypass this via static middleware)
const MAX_CONCURRENT_FETCHES = 25;
let activeFetches = 0;
const fetchWaiters: (() => void)[] = [];

async function acquireFetchSlot(): Promise<void> {
  if (activeFetches < MAX_CONCURRENT_FETCHES) {
    activeFetches++;
    return;
  }
  await new Promise<void>(resolve => fetchWaiters.push(resolve));
  activeFetches++;
}

function releaseFetchSlot(): void {
  activeFetches--;
  const next = fetchWaiters.shift();
  if (next) next();
}

// Fetch and cache a survey thumbnail (only reached on cache miss — static middleware handles hits)
app.get('/thumbnail/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const safeFilename = name.replace(/[^a-zA-Z0-9_-]/g, '_') + '.jpg';

    // Look up catalog object for coordinates
    const obj = await catalogService.getCatalogObject(name);
    if (!obj || obj.raDeg == null || obj.decDeg == null) {
      return c.json({ message: 'Object not found or has no coordinates' }, 404);
    }

    // Compute field of view from major axis (arcmin -> degrees), with padding
    const fov = obj.majorAxis ? Math.max((obj.majorAxis / 60) * 1.5, 0.05) : 0.25;

    const url = `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&ra=${obj.raDeg}&dec=${obj.decDeg}&fov=${fov.toFixed(3)}&width=300&height=200&format=jpg`;

    await acquireFetchSlot();
    let buffer: Buffer;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return c.json({ message: 'Failed to fetch survey image' }, 502);
      }
      buffer = Buffer.from(await response.arrayBuffer());
    } finally {
      releaseFetchSlot();
    }

    // Save to cache dir — next request will be served by static middleware
    // lgtm[js/path-injection] - safeFilename is sanitized to [a-zA-Z0-9_-] only, no path traversal possible
    await fs.writeFile(path.join(THUMBNAIL_CACHE_DIR, safeFilename), buffer);

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to get thumbnail');
  }
});

// Get a single catalog object by name
app.get('/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const obj = await catalogService.getCatalogObject(name);
    if (!obj) {
      return c.json({ message: 'Catalog object not found' }, 404);
    }
    return c.json(obj);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to get catalog object');
  }
});

// Load/reload catalog from GitHub
app.post('/load', async (c) => {
  try {
    const result = await catalogService.loadCatalog();
    return c.json({ message: `Loaded ${result.count} catalog objects`, count: result.count });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to load catalog');
  }
});

// Check for catalog updates
app.post('/check-updates', async (c) => {
  try {
    const result = await catalogService.checkForUpdates();
    return c.json(result);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to check for updates');
  }
});

// Backfill targets: re-match all plate-solved images that have tags but no targetName
app.post('/backfill-targets', async (c) => {
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
        await storage.updateAstroImage(image.id, { targetName: matches[0].name });
        matched++;
      }
    }

    return c.json({
      message: `Backfill complete: ${matched} images matched, ${skipped} already had targets`,
      matched,
      skipped,
      total: images.length,
    });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to backfill targets');
  }
});

export default app;
