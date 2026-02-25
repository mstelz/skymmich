
import { Router } from 'express';
import { configService } from '../services/config';
import { storage } from '../services/storage';
import axios from 'axios';

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

    // Sync by album logic
    let albumsToSync: any[] = [];
    const albumsResponse = await axios.get(`${config.host}/api/albums`, {
      headers: { 'X-API-Key': config.apiKey },
    });
    if (config.syncByAlbum) {
      if (!Array.isArray(config.selectedAlbumIds) || config.selectedAlbumIds.length === 0) {
        return res.status(400).json({ message: 'Sync by album is enabled, but no albums are selected.' });
      }
      albumsToSync = albumsResponse.data.filter((a: any) => config.selectedAlbumIds.includes(a.id));
    } else {
      albumsToSync = albumsResponse.data;
    }

    let allAssets: any[] = [];
    for (const album of albumsToSync) {
      if (album.id && album.assetCount > 0) {
        try {
          console.log(`Fetching assets from album: ${album.albumName} (${album.assetCount} assets)`);
          const albumResponse = await axios.get(`${config.host}/api/albums/${album.id}`, {
            headers: { 'X-API-Key': config.apiKey },
          });
          if (albumResponse.data && albumResponse.data.assets && Array.isArray(albumResponse.data.assets)) {
            allAssets.push(...albumResponse.data.assets);
            console.log(`Added ${albumResponse.data.assets.length} assets from album ${album.albumName}`);
          }
        } catch (albumError: any) {
          console.warn(
            `Failed to get assets from album ${album.albumName} (${album.id}):`,
            albumError.response?.data || albumError.message,
          );
        }
      }
    }
    console.log(`Found ${allAssets.length} total assets in Immich`);

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
      const existing = await storage.getAstroImageByImmichId(asset.id);
      if (existing) {
        console.log(`Asset ${asset.originalFileName} already exists, skipping`);
        continue;
      }

      // Extract EXIF data and create astrophotography image
      const astroImage = {
        immichId: String(asset.id),
        title: String(asset.originalFileName || asset.id),
        filename: String(asset.originalFileName || ''),
        thumbnailUrl: `/api/assets/${asset.id}/thumbnail`,
        fullUrl: `/api/assets/${asset.id}/thumbnail?size=preview`,
        captureDate: asset.fileCreatedAt ? new Date(asset.fileCreatedAt) : null,
        focalLength: asset.exifInfo?.focalLength ? Number(asset.exifInfo.focalLength) : null,
        aperture: asset.exifInfo?.fNumber ? `f/${asset.exifInfo.fNumber}` : null,
        iso: asset.exifInfo?.iso ? Number(asset.exifInfo.iso) : null,
        exposureTime: asset.exifInfo?.exposureTime ? String(asset.exifInfo.exposureTime) : null,
        frameCount: 1,
        totalIntegration: asset.exifInfo?.exposureTime ? parseFloat(asset.exifInfo.exposureTime) / 3600 : null,
        telescope: asset.exifInfo?.lensModel ? String(asset.exifInfo.lensModel) : '',
        camera: asset.exifInfo?.make && asset.exifInfo?.model ? `${asset.exifInfo.make} ${asset.exifInfo.model}` : null,
        mount: '',
        filters: '',
        latitude: asset.exifInfo?.latitude ? Number(asset.exifInfo.latitude) : null,
        longitude: asset.exifInfo?.longitude ? Number(asset.exifInfo.longitude) : null,
        altitude: asset.exifInfo?.altitude ? Number(asset.exifInfo.altitude) : null,
        plateSolved: false,
        tags: ['astrophotography'],
        objectType: 'Deep Sky', // Default classification
        description: String(asset.exifInfo?.description || ''),
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
  } catch (error: any) {
    console.error('Immich sync error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to sync with Immich',
      error: error.response?.data?.message || error.message,
    });
  }
});

// Test Immich connection
router.post('/test-immich-connection', async (req, res) => {
  try {
    const { host, apiKey } = req.body;

    if (!host || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Host and API key are required',
      });
    }

    // Basic SSRF protection - validate URL format and protocol
    try {
      const url = new URL(host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({
          success: false,
          message: 'Only HTTP and HTTPS protocols are allowed',
        });
      }
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format',
      });
    }

    // Test the connection by trying to get albums (same endpoint as working sync)
    const response = await axios.get(`${host}/api/albums`, {
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      params: {
        take: 1, // Just get 1 album to test the connection
      },
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => true, // Don't throw on any status code
    });

    // Check if response is JSON
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      console.error('Immich returned non-JSON response:', {
        status: response.status,
        contentType,
        data: response.data?.toString().substring(0, 200), // First 200 chars for debugging
      });
      return res.status(500).json({
        success: false,
        message: `Server returned non-JSON response (${contentType}). Please check the host URL.`,
      });
    }

    if (response.status === 200) {
      res.json({
        success: true,
        message: 'Connection successful!',
      });
    } else {
      res.json({
        success: false,
        message: `Connection failed with status: ${response.status}`,
      });
    }
  } catch (error: any) {
    console.error('Immich connection test error:', error.response?.data || error.message);

    // Provide more specific error messages
    let errorMessage = 'Connection failed';
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Immich server. Please check the host URL.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found. Please check the host URL.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check your API key.';
    } else if (error.response?.status === 404) {
      errorMessage = 'API endpoint not found. Please check the host URL.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
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

    // Basic SSRF protection - validate URL format and protocol
    try {
      const url = new URL(host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({ message: 'Only HTTP and HTTPS protocols are allowed' });
      }
    } catch (urlError) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }
    const response = await axios.get(`${host}/api/albums`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (Array.isArray(response.data)) {
      // Only return id and albumName for dropdown
      const albums = response.data.map((a: any) => ({ id: a.id, albumName: a.albumName }));
      res.json(albums);
    } else {
      res.status(500).json({ message: 'Unexpected response from Immich' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.response?.data?.message || error.message });
  }
});

export default router;
