import { Router } from 'express';
import { configService } from '../services/config';
import axios from 'axios';

const router = Router();

// Proxy Immich image requests
router.get('/:assetId/:type', async (req, res) => {
  try {
    const { assetId, type } = req.params;
    const config = await configService.getImmichConfig();
    const immichUrl = config.host;
    const immichApiKey = config.apiKey;
    if (!immichUrl || !immichApiKey) {
      return res.status(500).json({ message: 'Immich configuration missing' });
    }
    // Forward query parameters (e.g., ?size=preview)
    const query = req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '';
    const url = `${immichUrl}/api/assets/${assetId}/${type}${query}`;
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