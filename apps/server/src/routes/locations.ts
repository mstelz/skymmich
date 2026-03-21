import { Hono } from 'hono';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

// Get all locations
app.get('/', async (c) => {
  try {
    const locations = await storage.getLocations();
    return c.json(locations);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch locations');
  }
});

// Get a specific location
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const location = await storage.getLocation(id);
    if (!location) {
      return c.json({ message: 'Location not found' }, 404);
    }
    return c.json(location);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch location');
  }
});

// Create a new location
app.post('/', async (c) => {
  try {
    const locationData = await c.req.json();
    const location = await storage.createLocation(locationData);
    return c.json(location);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to create location');
  }
});

// Update a location
app.patch('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const updates = await c.req.json();
    const location = await storage.updateLocation(id, updates);
    if (!location) {
      return c.json({ message: 'Location not found' }, 404);
    }
    return c.json(location);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to update location');
  }
});

// Delete a location
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await storage.deleteLocation(id);
    return c.json({ message: 'Location deleted' });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to delete location');
  }
});

export default app;
