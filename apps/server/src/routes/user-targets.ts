import { Router } from 'express';
import { storage } from '../services/storage';

const router = Router();

// Get all user target annotations
router.get('/', async (req, res) => {
  try {
    const targets = await storage.getUserTargets();
    res.json(targets);
  } catch (error) {
    console.error('Failed to fetch user targets:', error);
    res.status(500).json({ message: 'Failed to fetch user targets' });
  }
});

// Get a single user target annotation
router.get('/:catalogName', async (req, res) => {
  try {
    const catalogName = decodeURIComponent(req.params.catalogName);
    const target = await storage.getUserTarget(catalogName);
    if (!target) {
      return res.status(404).json({ message: 'User target not found' });
    }
    res.json(target);
  } catch (error) {
    console.error('Failed to fetch user target:', error);
    res.status(500).json({ message: 'Failed to fetch user target' });
  }
});

// Upsert a user target annotation
router.put('/:catalogName', async (req, res) => {
  try {
    const catalogName = decodeURIComponent(req.params.catalogName);
    const { notes, tags } = req.body;
    const target = await storage.upsertUserTarget(catalogName, { notes, tags });
    res.json(target);
  } catch (error) {
    console.error('Failed to upsert user target:', error);
    res.status(500).json({ message: 'Failed to upsert user target' });
  }
});

// Delete a user target annotation
router.delete('/:catalogName', async (req, res) => {
  try {
    const catalogName = decodeURIComponent(req.params.catalogName);
    await storage.deleteUserTarget(catalogName);
    res.json({ message: 'User target deleted' });
  } catch (error) {
    console.error('Failed to delete user target:', error);
    res.status(500).json({ message: 'Failed to delete user target' });
  }
});

export default router;
