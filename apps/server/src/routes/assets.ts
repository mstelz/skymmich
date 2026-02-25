import { Router } from 'express';
import { configService } from '../services/config';
import axios from 'axios';

const router = Router();

// Allowed asset type values for Immich API
const ALLOWED_ASSET_TYPES = ['thumbnail', 'original', 'fullsize'];

// Proxy Immich image requests
router.get('/:assetId/:type', async (req, res) => {
  try {
    const { assetId, type } = req.params;

    // Validate assetId format (UUID or alphanumeric with hyphens)
    if (!/^[a-zA-Z0-9-]+$/.test(assetId)) {
      return res.status(400).json({ message: 'Invalid asset ID format' });
    }

    // Validate type is an expected value
    if (!ALLOWED_ASSET_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid asset type' });
    }

    const config = await configService.getImmichConfig();
    const immichUrl = config.host;
    const immichApiKey = config.apiKey;
    if (!immichUrl || !immichApiKey) {
      return res.status(500).json({ message: 'Immich configuration missing' });
    }

    // Validate Immich URL protocol to prevent SSRF
    try {
      const parsedUrl = new URL(immichUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(500).json({ message: 'Invalid Immich URL protocol' });
      }
    } catch {
      return res.status(500).json({ message: 'Invalid Immich URL format' });
    }

    // Forward query parameters (e.g., ?size=preview)
    const query = req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '';
    const url = `${immichUrl}/api/assets/${encodeURIComponent(assetId)}/${encodeURIComponent(type)}${query}`;
    const response = await axios.get(url, {
      headers: { 'X-API-Key': immichApiKey },
      responseType: 'stream',
    });
    res.set(response.headers);
    response.data.pipe(res);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json({ message: error.response.statusText });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

export default router;