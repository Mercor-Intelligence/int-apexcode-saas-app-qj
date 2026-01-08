const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get public profile by handle
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { handle: handle.toLowerCase() },
      select: {
        id: true,
        handle: true,
        avatarUrl: true,
        bioTitle: true,
        bioDescription: true,
        theme: true,
        backgroundColor: true,
        buttonStyle: true,
        fontFamily: true,
        metaTitle: true,
        metaDescription: true,
        links: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            url: true,
            title: true,
            thumbnailUrl: true,
            type: true,
            settings: true,
          },
        },
        socialIcons: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            platform: true,
            url: true,
          },
        },
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Parse link settings
    const links = user.links.map(link => ({
      ...link,
      settings: JSON.parse(link.settings || '{}'),
    }));
    
    res.json({ ...user, links });
  } catch (error) {
    console.error('Public profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Track page view
router.post('/:handle/view', async (req, res) => {
  try {
    const { handle } = req.params;
    const { referrer, device } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { handle: handle.toLowerCase() },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: 'PAGE_VIEW',
        referrer: referrer || 'Direct',
        device: device || 'desktop',
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Track link click
router.post('/click/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { referrer, device } = req.body;
    
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      include: { user: true },
    });
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Increment click count
    await prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    });
    
    // Record analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: link.userId,
        linkId,
        eventType: 'LINK_CLICK',
        referrer: referrer || 'Direct',
        device: device || 'desktop',
      },
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

