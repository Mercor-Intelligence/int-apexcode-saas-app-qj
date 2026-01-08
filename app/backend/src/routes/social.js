const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all social icons for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const icons = await prisma.socialIcon.findMany({
      where: { userId: req.user.id },
      orderBy: { position: 'asc' },
    });
    res.json(icons);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add social icon
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { platform, url } = req.body;
    
    if (!platform || !url) {
      return res.status(400).json({ error: 'Platform and URL are required' });
    }
    
    // Get max position
    const maxPositionIcon = await prisma.socialIcon.findFirst({
      where: { userId: req.user.id },
      orderBy: { position: 'desc' },
    });
    const position = (maxPositionIcon?.position ?? -1) + 1;
    
    const icon = await prisma.socialIcon.create({
      data: {
        userId: req.user.id,
        platform,
        url,
        position,
      },
    });
    
    res.status(201).json(icon);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update social icon
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, url } = req.body;
    
    const existing = await prisma.socialIcon.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Social icon not found' });
    }
    
    const icon = await prisma.socialIcon.update({
      where: { id },
      data: { platform, url },
    });
    
    res.json(icon);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete social icon
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.socialIcon.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Social icon not found' });
    }
    
    await prisma.socialIcon.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

