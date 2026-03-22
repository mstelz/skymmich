import { Hono } from 'hono';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

// Get all user target annotations
app.get('/', async (c) => {
  try {
    const targets = await storage.getUserTargets();
    return c.json(targets);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch user targets');
  }
});

// Get a single user target annotation
app.get('/:catalogName', async (c) => {
  try {
    const catalogName = decodeURIComponent(c.req.param('catalogName'));
    const target = await storage.getUserTarget(catalogName);
    if (!target) {
      return c.json({ message: 'User target not found' }, 404);
    }
    return c.json(target);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch user target');
  }
});

// Upsert a user target annotation
app.put('/:catalogName', async (c) => {
  try {
    const catalogName = decodeURIComponent(c.req.param('catalogName'));
    const { notes, tags } = await c.req.json();
    const target = await storage.upsertUserTarget(catalogName, { notes, tags });
    return c.json(target);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to upsert user target');
  }
});

// Delete a user target annotation
app.delete('/:catalogName', async (c) => {
  try {
    const catalogName = decodeURIComponent(c.req.param('catalogName'));
    await storage.deleteUserTarget(catalogName);
    return c.json({ message: 'User target deleted' });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to delete user target');
  }
});

export default app;
