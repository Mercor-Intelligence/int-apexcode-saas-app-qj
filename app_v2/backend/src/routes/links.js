/**
 * Link Management Routes
 * CRUD operations for user links
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all links for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { 
        userId: req.user.id,
        isDeleted: false
      },
      orderBy: { position: 'asc' }
    });
    
    // Parse settings JSON
    const linksWithSettings = links.map(link => ({
      ...link,
      settings: link.settings ? JSON.parse(link.settings) : {}
    }));
    
    res.json(linksWithSettings);
  } catch (error) {
    console.error('Get links error:', error);
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
    
    // Validate URL if provided and not a header
    if (url && type !== 'HEADER') {
      try {
        new URL(url);
      } catch {
        // Allow invalid URLs but log warning (from knowledge base)
        console.warn(`Invalid URL format: ${url}`);
      }
    }
    
    // Get max position for ordering
    const maxPositionLink = await prisma.link.findFirst({
      where: { userId: req.user.id, isDeleted: false },
      orderBy: { position: 'desc' }
    });
    const position = (maxPositionLink?.position ?? -1) + 1;
    
    const link = await prisma.link.create({
      data: {
        userId: req.user.id,
        url: url || null,
        title,
        type,
        thumbnailUrl,
        position,
        isActive: true,
        settings: JSON.stringify(settings)
      }
    });
    
    res.status(201).json({
      ...link,
      settings: settings
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder links (POST) - MUST be before /:id routes
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { linkIds } = req.body;
    
    if (!Array.isArray(linkIds)) {
      return res.status(400).json({ error: 'linkIds must be an array' });
    }
    
    // Verify all links belong to user
    const links = await prisma.link.findMany({
      where: { 
        id: { in: linkIds },
        userId: req.user.id,
        isDeleted: false
      }
    });
    
    if (links.length !== linkIds.length) {
      return res.status(400).json({ error: 'Invalid link IDs' });
    }
    
    // Update positions
    await Promise.all(
      linkIds.map((id, index) =>
        prisma.link.update({
          where: { id },
          data: { position: index }
        })
      )
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder links error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder links (PUT - for compatibility) - MUST be before /:id routes
router.put('/reorder', authenticateToken, async (req, res) => {
  try {
    const { links } = req.body;
    
    if (!Array.isArray(links)) {
      return res.status(400).json({ error: 'links must be an array' });
    }
    
    // Update positions from array of {id, position} objects
    await Promise.all(
      links.map(({ id, position }) =>
        prisma.link.updateMany({
          where: { id, userId: req.user.id },
          data: { position }
        })
      )
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Reorder links error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a link
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, title, type, thumbnailUrl, isActive, settings } = req.body;
    
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.id, isDeleted: false }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const updateData = {};
    if (url !== undefined) updateData.url = url;
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);
    
    const link = await prisma.link.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      ...link,
      settings: link.settings ? JSON.parse(link.settings) : {}
    });
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a link (soft delete with 30-day recovery - from knowledge base)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.id, isDeleted: false }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Soft delete
    await prisma.link.update({
      where: { id },
      data: { 
        isDeleted: true,
        deletedAt: new Date()
      }
    });
    
    res.json({ success: true, message: 'Link deleted. Can be recovered within 30 days.' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle link visibility
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify ownership
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.id, isDeleted: false }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const link = await prisma.link.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });
    
    res.json({
      ...link,
      settings: link.settings ? JSON.parse(link.settings) : {}
    });
  } catch (error) {
    console.error('Toggle link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Restore deleted link
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.link.findFirst({
      where: { id, userId: req.user.id, isDeleted: true }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Deleted link not found' });
    }
    
    // Check if within 30-day window
    const deletedAt = new Date(existing.deletedAt);
    const now = new Date();
    const daysSinceDelete = (now - deletedAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceDelete > 30) {
      return res.status(400).json({ error: 'Recovery window has expired' });
    }
    
    const link = await prisma.link.update({
      where: { id },
      data: { 
        isDeleted: false,
        deletedAt: null
      }
    });
    
    res.json({
      ...link,
      settings: link.settings ? JSON.parse(link.settings) : {}
    });
  } catch (error) {
    console.error('Restore link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

