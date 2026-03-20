import { Router } from 'express';
import { storage } from '../services/storage';

const router = Router();

// List target summaries with optional filtering
router.get('/', async (req, res) => {
  try {
    const { search, type, constellation } = req.query;
    let targets = await storage.getTargets();

    if (search) {
      const q = (search as string).toLowerCase();
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

    res.json(targets);
  } catch (error) {
    console.error('Failed to fetch targets:', error);
    res.status(500).json({ message: 'Failed to fetch targets' });
  }
});

// Get a single target detail with image list
router.get('/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const targets = await storage.getTargets();
    const target = targets.find(t => t.targetName === name);

    if (!target) {
      return res.status(404).json({ message: 'Target not found' });
    }

    res.json(target);
  } catch (error) {
    console.error('Failed to fetch target:', error);
    res.status(500).json({ message: 'Failed to fetch target' });
  }
});

export default router;
