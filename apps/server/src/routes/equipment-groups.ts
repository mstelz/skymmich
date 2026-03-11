import { Router } from 'express';
import { storage } from '../services/storage';

const router = Router();

// List all groups with members
router.get('/', async (req, res) => {
  try {
    const groups = await storage.getEquipmentGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch equipment groups' });
  }
});

// Get a single group
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const group = await storage.getEquipmentGroup(id);
    if (!group) {
      return res.status(404).json({ message: 'Equipment group not found' });
    }
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch equipment group' });
  }
});

// Create a group
router.post('/', async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    const group = await storage.createEquipmentGroup({ name, description, memberIds });
    // Return the full group with members
    const full = await storage.getEquipmentGroup(group.id);
    res.json(full);
  } catch (error) {
    console.error('Failed to create equipment group:', error);
    res.status(500).json({ message: 'Failed to create equipment group' });
  }
});

// Update group name/description
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    const group = await storage.updateEquipmentGroup(id, { name, description });
    if (!group) {
      return res.status(404).json({ message: 'Equipment group not found' });
    }
    const full = await storage.getEquipmentGroup(id);
    res.json(full);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update equipment group' });
  }
});

// Delete a group
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteEquipmentGroup(id);
    res.json({ message: 'Equipment group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete equipment group' });
  }
});

// Replace group membership
router.put('/:id/members', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { memberIds } = req.body;
    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'memberIds must be an array' });
    }
    await storage.setEquipmentGroupMembers(id, memberIds);
    const full = await storage.getEquipmentGroup(id);
    res.json(full);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update group members' });
  }
});

// Apply group to an image
router.post('/:id/apply/:imageId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const imageId = parseInt(req.params.imageId);
    const added = await storage.applyEquipmentGroupToImage(groupId, imageId);
    res.json({ added, message: `${added.length} equipment item(s) assigned` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply equipment group' });
  }
});

export default router;
