import { Hono } from 'hono';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

// List target summaries with optional filtering
app.get('/', async (c) => {
  try {
    const search = c.req.query('search');
    const type = c.req.query('type');
    const constellation = c.req.query('constellation');
    let targets = await storage.getTargets();

    if (search) {
      const q = search.toLowerCase();
      targets = targets.filter(t =>
        t.targetName.toLowerCase().includes(q) ||
        (t.commonNames && t.commonNames.toLowerCase().includes(q))
      );
    }

    if (type) {
      targets = targets.filter(t => t.objectType === type);
    }

    if (constellation) {
      targets = targets.filter(t => t.constellation === constellation);
    }

    return c.json(targets);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch targets');
  }
});

// Get a single target detail with image list
app.get('/:name', async (c) => {
  try {
    const name = decodeURIComponent(c.req.param('name'));
    const targets = await storage.getTargets();
    const target = targets.find(t => t.targetName === name);

    if (!target) {
      return c.json({ message: 'Target not found' }, 404);
    }

    return c.json(target);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch target');
  }
});

export default app;
