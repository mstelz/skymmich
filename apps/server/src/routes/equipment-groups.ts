import { Hono } from 'hono';
import { storage } from '../services/storage';
import { handleRouteError } from './route-utils';

const app = new Hono();

// List all groups with members
app.get('/', async (c) => {
  try {
    const groups = await storage.getEquipmentGroups();
    return c.json(groups);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch equipment groups');
  }
});

// Get a single group
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const group = await storage.getEquipmentGroup(id);
    if (!group) {
      return c.json({ message: 'Equipment group not found' }, 404);
    }
    return c.json(group);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to fetch equipment group');
  }
});

// Create a group
app.post('/', async (c) => {
  try {
    const { name, description, memberIds } = await c.req.json();
    if (!name) {
      return c.json({ message: 'Name is required' }, 400);
    }
    const group = await storage.createEquipmentGroup({ name, description, memberIds });
    // Return the full group with members
    const full = await storage.getEquipmentGroup(group.id);
    return c.json(full);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to create equipment group');
  }
});

// Update group name/description
app.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { name, description } = await c.req.json();
    const group = await storage.updateEquipmentGroup(id, { name, description });
    if (!group) {
      return c.json({ message: 'Equipment group not found' }, 404);
    }
    const full = await storage.getEquipmentGroup(id);
    return c.json(full);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to update equipment group');
  }
});

// Delete a group
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    await storage.deleteEquipmentGroup(id);
    return c.json({ message: 'Equipment group deleted successfully' });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to delete equipment group');
  }
});

// Replace group membership
app.put('/:id/members', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { memberIds } = await c.req.json();
    if (!Array.isArray(memberIds)) {
      return c.json({ message: 'memberIds must be an array' }, 400);
    }
    await storage.setEquipmentGroupMembers(id, memberIds);
    const full = await storage.getEquipmentGroup(id);
    return c.json(full);
  } catch (error) {
    return handleRouteError(c, error, 'Failed to update group members');
  }
});

// Apply group to an image
app.post('/:id/apply/:imageId', async (c) => {
  try {
    const groupId = parseInt(c.req.param('id'));
    const imageId = parseInt(c.req.param('imageId'));
    const added = await storage.applyEquipmentGroupToImage(groupId, imageId);
    return c.json({ added, message: `${added.length} equipment item(s) assigned` });
  } catch (error) {
    return handleRouteError(c, error, 'Failed to apply equipment group');
  }
});

export default app;
