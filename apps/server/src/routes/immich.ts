import { Hono } from 'hono';
import { configService } from '../services/config';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

// Sync images from Immich
app.post('/sync-immich', async (c) => {
  try {
    const config = await configService.getImmichConfig();

    if (!config.host || !config.apiKey) {
      return c.json({
        message: 'Immich configuration missing. Please configure in admin settings or set environment variables.',
      }, 400);
    }

    let allAssets: Record<string, unknown>[] = [];

    if (config.syncByAlbum) {
      if (!Array.isArray(config.selectedAlbumIds) || config.selectedAlbumIds.length === 0) {
        return c.json({ message: 'Sync by album is enabled, but no albums are selected.' }, 400);
      }

      const albumsRes = await fetch(`${config.host}/api/albums`, {
        headers: { 'X-API-Key': config.apiKey },
      });
      const albumsData = await albumsRes.json() as Record<string, unknown>[];
      const albumsToSync = albumsData.filter((a) => config.selectedAlbumIds.includes(a.id as string));

      for (const album of albumsToSync) {
        if (album.id && (album.assetCount as number) > 0) {
          try {
            console.log(`Fetching assets from album: ${album.albumName} (${album.assetCount} assets)`);
            const albumRes = await fetch(`${config.host}/api/albums/${album.id}`, {
              headers: { 'X-API-Key': config.apiKey },
            });
            const albumData = await albumRes.json() as Record<string, unknown>;
            if (albumData && albumData.assets && Array.isArray(albumData.assets)) {
              allAssets.push(...(albumData.assets as Record<string, unknown>[]));
              console.log(`Added ${(albumData.assets as unknown[]).length} assets from album ${album.albumName}`);
            }
          } catch (albumError: unknown) {
            const err = albumError as Error;
            console.warn(
              `Failed to get assets from album ${album.albumName} (${album.id}):`,
              err.message,
            );
          }
        }
      }
    } else {
      // Sync all assets from library using metadata search with pagination
      console.log('Fetching all assets from Immich library via metadata search...');
      let page = 1;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(`${config.host}/api/search/metadata`, {
          method: 'POST',
          headers: { 'X-API-Key': config.apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ size: pageSize, page, type: 'IMAGE' }),
        });
        const data = await response.json() as Record<string, unknown>;

        const assets = data?.assets as Record<string, unknown> | undefined;
        const items = (assets?.items || []) as Record<string, unknown>[];
        allAssets.push(...items);
        console.log(`Page ${page}: fetched ${items.length} assets (${allAssets.length} total)`);

        const nextPage = assets?.nextPage;
        if (nextPage != null && items.length > 0) {
          page = nextPage as number;
        } else {
          hasMore = false;
        }
      }

      console.log(`Fetched ${allAssets.length} total assets from Immich library`);
    }

    // De-duplicate assets by ID (important when assets are in multiple albums)
    const uniqueAssetsMap = new Map();
    for (const asset of allAssets) {
      uniqueAssetsMap.set(asset.id, asset);
    }
    allAssets = Array.from(uniqueAssetsMap.values());

    console.log(`Found ${allAssets.length} total unique assets in Immich`);

    // Remove images from our app that no longer exist in Immich
    const immichAssetIds = new Set(allAssets.map((asset) => asset.id));
    const allAppImages = await storage.getAstroImages();
    let removedCount = 0;
    for (const img of allAppImages) {
      if (img.immichId && !immichAssetIds.has(img.immichId)) {
        await storage.deleteAstroImage(img.id);
        removedCount++;
        console.log(`Removed image ${img.title || img.id} (immichId: ${img.immichId}) because it no longer exists in Immich`);
      }
    }
    if (removedCount > 0) {
      console.log(`Removed ${removedCount} images that no longer exist in Immich.`);
    }

    let syncedCount = 0;

    for (const asset of allAssets) {
      // Check if image already exists
      const existing = await storage.getAstroImageByImmichId(asset.id as string);
      if (existing) {
        continue;
      }

      const exifInfo = asset.exifInfo as Record<string, unknown> | undefined;

      // Extract EXIF data and create astrophotography image
      const astroImage = {
        immichId: String(asset.id),
        title: String(asset.originalFileName || asset.id),
        filename: String(asset.originalFileName || ''),
        thumbnailUrl: `/api/assets/${asset.id}/thumbnail`,
        fullUrl: `/api/assets/${asset.id}/thumbnail?size=preview`,
        originalPath: String(asset.originalPath || ''),
        captureDate: asset.fileCreatedAt ? new Date(asset.fileCreatedAt as string) : null,
        focalLength: exifInfo?.focalLength ? Number(exifInfo.focalLength) : null,
        aperture: exifInfo?.fNumber ? `f/${exifInfo.fNumber}` : null,
        iso: exifInfo?.iso ? Number(exifInfo.iso) : null,
        exposureTime: exifInfo?.exposureTime ? String(exifInfo.exposureTime) : null,
        frameCount: 1,
        totalIntegration: exifInfo?.exposureTime ? parseFloat(String(exifInfo.exposureTime)) / 3600 : null,
        telescope: exifInfo?.lensModel ? String(exifInfo.lensModel) : '',
        camera: exifInfo?.make && exifInfo?.model ? `${exifInfo.make} ${exifInfo.model}` : null,
        mount: '',
        filters: '',
        latitude: exifInfo?.latitude ? Number(exifInfo.latitude) : null,
        longitude: exifInfo?.longitude ? Number(exifInfo.longitude) : null,
        altitude: exifInfo?.altitude ? Number(exifInfo.altitude) : null,
        plateSolved: false,
        tags: ['astrophotography'],
        objectType: 'Deep Sky',
        description: String(exifInfo?.description || ''),
      };

      await storage.createAstroImage(astroImage);
      syncedCount++;
      console.log(`Synced asset: ${asset.originalFileName}`);
    }

    return c.json({
      message: `Successfully synced ${syncedCount} new images from Immich. Removed ${removedCount} images no longer in Immich.`,
      syncedCount,
      removedCount,
    });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to sync with Immich');
  }
});

// Test Immich connection
app.post('/test-immich-connection', async (c) => {
  try {
    const { host, apiKey } = await c.req.json();

    if (!host || !apiKey) {
      return c.json({ message: 'Host and API key are required' }, 400);
    }

    // Validate URL format and protocol
    try {
      const url = new URL(host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return c.json({ message: 'Only HTTP and HTTPS protocols are allowed' }, 400);
      }
    } catch {
      return c.json({ message: 'Invalid URL format' }, 400);
    }

    // Test the connection by trying to get albums
    const response = await fetch(`${host}/api/albums?take=1`, {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return c.json({
        message: `Server returned non-JSON response (${contentType}). Please check the host URL.`,
      }, 500);
    }

    if (response.ok) {
      return c.json({ message: 'Connection successful!' });
    } else {
      return c.json({ message: `Connection failed with status: ${response.status}` });
    }
  } catch (error: unknown) {
    const err = error as Error & { code?: string };

    let errorMessage = 'Connection failed';
    if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Immich server. Please check the host URL.';
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = 'Host not found. Please check the host URL.';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return c.json({ message: errorMessage }, 500);
  }
});

// Fetch albums from Immich
app.post('/albums', async (c) => {
  try {
    const { host, apiKey } = await c.req.json();
    if (!host || !apiKey) {
      return c.json({ message: 'Host and API key are required' }, 400);
    }

    // Validate URL format and protocol
    try {
      const url = new URL(host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return c.json({ message: 'Only HTTP and HTTPS protocols are allowed' }, 400);
      }
    } catch {
      return c.json({ message: 'Invalid URL format' }, 400);
    }

    const response = await fetch(`${host}/api/albums`, {
      headers: { 'X-API-Key': apiKey },
    });
    const data = await response.json();
    if (Array.isArray(data)) {
      const albums = data.map((a: Record<string, unknown>) => ({ id: a.id, albumName: a.albumName }));
      return c.json(albums);
    } else {
      return c.json({ message: 'Unexpected response from Immich' }, 500);
    }
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch albums');
  }
});

// Sync metadata for a single image to Immich
app.post('/sync-metadata/:imageId', async (c) => {
  try {
    const { immichSyncService } = await import('../services/immich-sync');
    const imageId = parseInt(c.req.param('imageId'));
    if (isNaN(imageId)) {
      return c.json({ message: 'Invalid image ID' }, 400);
    }
    const result = await immichSyncService.syncImageMetadata(imageId);
    if (result.success) {
      return c.json({ message: 'Metadata synced to Immich' });
    } else {
      return c.json({ message: result.error }, 400);
    }
  } catch (error) {
    return handleRouteError(c, error, 'Failed to sync metadata');
  }
});

// Sync metadata for all images to Immich
app.post('/sync-metadata-all', async (c) => {
  try {
    const { immichSyncService } = await import('../services/immich-sync');
    const result = await immichSyncService.syncAllImages();
    return c.json({
      message: `Synced ${result.synced} images, ${result.failed} failed`,
      ...result,
    });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to sync all metadata');
  }
});

export default app;
