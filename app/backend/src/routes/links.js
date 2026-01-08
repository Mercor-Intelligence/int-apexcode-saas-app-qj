const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all links for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: req.user.id },
      orderBy: { position: 'asc' },
    });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new link
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { url, title, type = 'CLASSIC', thumbnailUrl, settings = {} } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Get max position
    const maxPositionLink = await prisma.link.findFirst({
      where: { userId: req.user.id },
      orderBy: { position: 'desc' },
    });
    const position = (maxPositionLink?.position ?? -1) + 1;
    
    const link = await prisma.link.create({
      data: {
        userId: req.user.id,
        url,
        title,
        type,
        thumbnailUrl,
        position,
        settings: JSON.stringify(settings),
      },
    });
    
    res.status(201).json(link);
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a link
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, title, thumbnailUrl, isActive, type, settings } = req.body;
    
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const updateData = {};
    if (url !== undefined) updateData.url = url;
    if (title !== undefined) updateData.title = title;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (type !== undefined) updateData.type = type;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);
    
    const link = await prisma.link.update({
      where: { id },
      data: updateData,
    });
    
    res.json(link);
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder links
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { linkIds } = req.body;
    
    if (!Array.isArray(linkIds)) {
      return res.status(400).json({ error: 'linkIds must be an array' });
    }
    
    // Update positions
    await Promise.all(
      linkIds.map((id, index) =>
        prisma.link.updateMany({
          where: { id, userId: req.user.id },
          data: { position: index },
        })
      )
    );
    
    const links = await prisma.link.findMany({
      where: { userId: req.user.id },
      orderBy: { position: 'asc' },
    });
    
    res.json(links);
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a link
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.id },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    await prisma.link.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

