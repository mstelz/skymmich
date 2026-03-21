import { Hono } from 'hono';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

// Get equipment
app.get('/', async (c) => {
  try {
    const equipment = await storage.getEquipment();
    return c.json(equipment);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch equipment');
  }
});

// Create new equipment
app.post('/', async (c) => {
  try {
    const { name, type, specifications, description, cost, acquisitionDate } = await c.req.json();
    if (!name || !type) {
      return c.json({ message: 'Name and type are required' }, 400);
    }
    const equipment = await storage.createEquipment({
      name,
      type,
      specifications: specifications || {},
      description: description || '',
      cost: cost ?? null,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
    });
    return c.json(equipment);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to create equipment');
  }
});

// Update equipment
app.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { name, type, specifications, description, cost, acquisitionDate } = await c.req.json();

    if (!name || !type) {
      return c.json({ message: 'Name and type are required' }, 400);
    }

    const equipment = await storage.updateEquipment(id, {
      name,
      type,
      specifications: specifications || {},
      description: description || '',
      cost: cost ?? null,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
    });

    if (!equipment) {
      return c.json({ message: 'Equipment not found' }, 404);
    }

    return c.json(equipment);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to update equipment');
  }
});

// Delete equipment
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const success = await storage.deleteEquipment(id);

    if (!success) {
      return c.json({ message: 'Equipment not found' }, 404);
    }

    return c.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to delete equipment');
  }
});

export default app;
