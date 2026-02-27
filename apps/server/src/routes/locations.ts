
import { Router } from 'express';
import { storage } from '../services/storage';

const router = Router();

// Get all locations
router.get('/', async (_req, res) => {
  try {
    const locations = await storage.getLocations();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
});

// Get a specific location
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const location = await storage.getLocation(id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch location' });
  }
});

// Create a new location
router.post('/', async (req, res) => {
  try {
    const locationData = req.body;
    const location = await storage.createLocation(locationData);
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create location' });
  }
});

// Update a location
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const location = await storage.updateLocation(id, updates);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Delete a location
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteLocation(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete location' });
  }
});

export default router;
