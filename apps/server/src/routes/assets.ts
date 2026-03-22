import { Hono } from 'hono';
import { configService } from '../services/config';

const app = new Hono();

// Allowed asset type values for Immich API
const ALLOWED_ASSET_TYPES = ['thumbnail', 'original', 'fullsize'];

// Proxy Immich image requests
app.get('/:assetId/:type', async (c) => {
  try {
    const assetId = c.req.param('assetId');
    const type = c.req.param('type');

    // Validate assetId format (UUID or alphanumeric with hyphens)
    if (!/^[a-zA-Z0-9-]+$/.test(assetId)) {
      return c.json({ message: 'Invalid asset ID format' }, 400);
    }

    // Validate type is an expected value
    if (!ALLOWED_ASSET_TYPES.includes(type)) {
      return c.json({ message: 'Invalid asset type' }, 400);
    }

    const config = await configService.getImmichConfig();
    const immichUrl = config.host;
    const immichApiKey = config.apiKey;
    if (!immichUrl || !immichApiKey) {
      return c.json({ message: 'Immich configuration missing' }, 503);
    }

    // Validate Immich URL protocol to prevent SSRF
    try {
      const parsedUrl = new URL(immichUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return c.json({ message: 'Invalid Immich URL protocol' }, 400);
      }
    } catch {
      return c.json({ message: 'Invalid Immich URL format' }, 400);
    }

    // Forward query parameters (e.g., ?size=preview)
    const rawUrl = c.req.url;
    const queryIdx = rawUrl.indexOf('?');
    const query = queryIdx !== -1 ? rawUrl.slice(queryIdx) : '';
    const url = `${immichUrl}/api/assets/${encodeURIComponent(assetId)}/${encodeURIComponent(type)}${query}`;

    const response = await fetch(url, {
      headers: { 'X-API-Key': immichApiKey },
    });

    if (!response.ok) {
      return c.json({ message: response.statusText }, response.status as 400);
    }

    return new Response(response.body, {
      headers: {
        'content-type': response.headers.get('content-type') || '',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return c.json({ message: err.message }, 500);
  }
});

export default app;
