
import { Router } from 'express';
import { storage } from '../services/storage';

const router = Router();

// Get equipment
router.get('/', async (req, res) => {
  try {
    const equipment = await storage.getEquipment();
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch equipment' });
  }
});

// Create new equipment
router.post('/', async (req, res) => {
  try {
    const { name, type, specifications, description } = req.body;
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }
    const equipment = await storage.createEquipment({
      name,
      type,
      specifications: specifications || {},
      description: description || '',
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create equipment' });
  }
});

// Update equipment
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type, specifications, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const equipment = await storage.updateEquipment(id, {
      name,
      type,
      specifications: specifications || {},
      description: description || '',
    });

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update equipment' });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await storage.deleteEquipment(id);

    if (!success) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete equipment' });
  }
});

export default router;
