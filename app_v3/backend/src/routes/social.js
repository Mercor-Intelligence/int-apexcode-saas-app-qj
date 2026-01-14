/**
 * Social Icons Routes
 * Manages social media icons on profiles
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Supported platforms
const PLATFORMS = [
  'instagram', 'twitter', 'x', 'tiktok', 'youtube', 'facebook', 
  'linkedin', 'github', 'twitch', 'discord', 'spotify', 'snapchat',
  'pinterest', 'reddit', 'telegram', 'whatsapp', 'email', 'website'
];

// Get all social icons
router.get('/', authenticateToken, async (req, res) => {
  try {
    const icons = await prisma.socialIcon.findMany({
      where: { userId: req.user.id },
      orderBy: { position: 'asc' }
    });
    
    res.json(icons);
  } catch (error) {
    console.error('Get social icons error:', error);
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
    
    if (!PLATFORMS.includes(platform.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid platform',
        validPlatforms: PLATFORMS
      });
    }
    
    // Check if platform already exists for user
    const existing = await prisma.socialIcon.findFirst({
      where: {
        userId: req.user.id,
        platform: platform.toLowerCase()
      }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Platform already added. Update instead.' });
    }
    
    // Get max position
    const maxPositionIcon = await prisma.socialIcon.findFirst({
      where: { userId: req.user.id },
      orderBy: { position: 'desc' }
    });
    const position = (maxPositionIcon?.position ?? -1) + 1;
    
    const icon = await prisma.socialIcon.create({
      data: {
        userId: req.user.id,
        platform: platform.toLowerCase(),
        url,
        position
      }
    });
    
    res.status(201).json(icon);
  } catch (error) {
    console.error('Add social icon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update social icon
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    
    // Verify ownership
    const existing = await prisma.socialIcon.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Social icon not found' });
    }
    
    const icon = await prisma.socialIcon.update({
      where: { id },
      data: { url }
    });
    
    res.json(icon);
  } catch (error) {
    console.error('Update social icon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete social icon
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const existing = await prisma.socialIcon.findFirst({
      where: { id, userId: req.user.id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Social icon not found' });
    }
    
    await prisma.socialIcon.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete social icon error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder social icons
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { iconIds } = req.body;
    
    if (!Array.isArray(iconIds)) {
      return res.status(400).json({ error: 'iconIds must be an array' });
    }
    
    // Verify all icons belong to user
    const icons = await prisma.socialIcon.findMany({
      where: {
        id: { in: iconIds },
        userId: req.user.id
      }
    });
    
    if (icons.length !== iconIds.length) {
      return res.status(400).json({ error: 'Invalid icon IDs' });
    }
    
    // Update positions
    await Promise.all(
      iconIds.map((id, index) =>
        prisma.socialIcon.update({
          where: { id },
          data: { position: index }
        })
      )
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder social icons error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available platforms
router.get('/platforms', (req, res) => {
  res.json(PLATFORMS);
});

export default router;

