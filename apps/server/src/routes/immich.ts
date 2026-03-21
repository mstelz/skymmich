
import { Router } from 'express';
import { configService } from '../services/config';
import { storage } from '../services/storage';
import axios from 'axios';
import { handleRouteError } from './route-utils';

const router = Router();

// Sync images from Immich
router.post('/sync-immich', async (req, res) => {
  try {
    const config = await configService.getImmichConfig();

    if (!config.host || !config.apiKey) {
      return res.status(400).json({
        message: 'Immich configuration missing. Please configure in admin settings or set environment variables.',
      });
    }

    let allAssets: Record<string, unknown>[] = [];

    if (config.syncByAlbum) {
      if (!Array.isArray(config.selectedAlbumIds) || config.selectedAlbumIds.length === 0) {
        return res.status(400).json({ message: 'Sync by album is enabled, but no albums are selected.' });
      }

      const albumsResponse = await axios.get(`${config.host}/api/albums`, {
        headers: { 'X-API-Key': config.apiKey },
      });
      const albumsToSync = albumsResponse.data.filter((a: Record<string, unknown>) => config.selectedAlbumIds.includes(a.id as string));

      for (const album of albumsToSync) {
        if (album.id && (album.assetCount as number) > 0) {
          try {
            console.log(`Fetching assets from album: ${album.albumName} (${album.assetCount} assets)`);
            const albumResponse = await axios.get(`${config.host}/api/albums/${album.id}`, {
              headers: { 'X-API-Key': config.apiKey },
            });
            if (albumResponse.data && albumResponse.data.assets && Array.isArray(albumResponse.data.assets)) {
              allAssets.push(...albumResponse.data.assets);
              console.log(`Added ${albumResponse.data.assets.length} assets from album ${album.albumName}`);
            }
          } catch (albumError: unknown) {
            const err = albumError as Error & { response?: { data?: unknown } };
            console.warn(
              `Failed to get assets from album ${album.albumName} (${album.id}):`,
              err.response?.data || err.message,
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
        const response = await axios.post(`${config.host}/api/search/metadata`,
          { size: pageSize, page, type: 'IMAGE' },
          { headers: { 'X-API-Key': config.apiKey } }
        );

        const items = response.data?.assets?.items || [];
        allAssets.push(...items);
        console.log(`Page ${page}: fetched ${items.length} assets (${allAssets.length} total)`);

        const nextPage = response.data?.assets?.nextPage;
        if (nextPage != null && items.length > 0) {
          page = nextPage;
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

    res.json({
      message: `Successfully synced ${syncedCount} new images from Immich. Removed ${removedCount} images no longer in Immich.`,
      syncedCount,
      removedCount,
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to sync with Immich');
  }
});

// Test Immich connection
router.post('/test-immich-connection', async (req, res) => {
  try {
    const { host, apiKey } = req.body;

    if (!host || !apiKey) {
      return res.status(400).json({
        message: 'Host and API key are required',
      });
    }

    // Validate URL format and protocol
    try {
      const url = new URL(host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({
          message: 'Only HTTP and HTTPS protocols are allowed',
        });
      }
    } catch {
      return res.status(400).json({
        message: 'Invalid URL format',
      });
    }

    // Test the connection by trying to get albums
    const response = await axios.get(`${host}/api/albums`, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      params: {
        take: 1,
      },
      timeout: 10000,
      validateStatus: (status) => true,
    });

    // Check if response is JSON
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(500).json({
        message: `Server returned non-JSON response (${contentType}). Please check the host URL.`,
      });
    }

    if (response.status === 200) {
      res.json({
        message: 'Connection successful!',
      });
    } else {
      res.json({
        message: `Connection failed with status: ${response.status}`,
      });
    }
  } catch (error: unknown) {
    const err = error as Error & { response?: { data?: { message?: string }; status?: number }; code?: string };

    let errorMessage = 'Connection failed';
    if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Immich server. Please check the host URL.';
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = 'Host not found. Please check the host URL.';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check your API key.';
    } else if (err.response?.status === 404) {
      errorMessage = 'API endpoint not found. Please check the host URL.';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }

    res.status(500).json({
      message: errorMessage,
    });
  }
});


// Fetch albums from Immich
router.post('/albums', async (req, res) => {
  try {
    const { host, apiKey } = req.body;
    if (!host || !apiKey) {
      return res.status(400).json({ message: 'Host and API key are required' });
    }

    // Validate URL format and protocol
    try {
      const url = new URL(host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({ message: 'Only HTTP and HTTPS protocols are allowed' });
      }
    } catch {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    const response = await axios.get(`${host}/api/albums`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (Array.isArray(response.data)) {
      const albums = response.data.map((a: Record<string, unknown>) => ({ id: a.id, albumName: a.albumName }));
      res.json(albums);
    } else {
      res.status(500).json({ message: 'Unexpected response from Immich' });
    }
  } catch (error) {
    handleRouteError(res, error, 'Failed to fetch albums');
  }
});

// Sync metadata for a single image to Immich
router.post('/sync-metadata/:imageId', async (req, res) => {
  try {
    const { immichSyncService } = await import('../services/immich-sync');
    const imageId = parseInt(req.params.imageId);
    if (isNaN(imageId)) {
      return res.status(400).json({ message: 'Invalid image ID' });
    }
    const result = await immichSyncService.syncImageMetadata(imageId);
    if (result.success) {
      res.json({ message: 'Metadata synced to Immich' });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    handleRouteError(res, error, 'Failed to sync metadata');
  }
});

// Sync metadata for all images to Immich
router.post('/sync-metadata-all', async (req, res) => {
  try {
    const { immichSyncService } = await import('../services/immich-sync');
    const result = await immichSyncService.syncAllImages();
    res.json({
      message: `Synced ${result.synced} images, ${result.failed} failed`,
      ...result,
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to sync all metadata');
  }
});

export default router;
