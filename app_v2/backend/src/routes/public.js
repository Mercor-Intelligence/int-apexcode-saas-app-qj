/**
 * Public Profile Routes
 * Handles public profile access and analytics tracking
 */

import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to categorize referrer
const categorizeReferrer = (referrer) => {
  if (!referrer) return 'direct';
  
  const socialDomains = ['instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 'facebook.com', 'linkedin.com', 'youtube.com'];
  const searchDomains = ['google.com', 'bing.com', 'duckduckgo.com', 'yahoo.com'];
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    if (socialDomains.some(d => hostname.includes(d))) return 'social';
    if (searchDomains.some(d => hostname.includes(d))) return 'search';
    return 'other';
  } catch {
    return 'other';
  }
};

// Helper to detect device type
const detectDevice = (userAgent) => {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  return 'desktop';
};

// Hash IP for privacy-compliant deduplication
const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip + 'biolink-salt').digest('hex').substring(0, 16);
};

// Get public profile by handle
router.get('/:handle', async (req, res) => {
  try {
    const { handle } = req.params;
    const handleLower = handle.toLowerCase();
    
    const user = await prisma.user.findUnique({
      where: { handleLower },
      select: {
        id: true,
        handle: true,
        displayName: true,
        bioTitle: true,
        bioDescription: true,
        avatarUrl: true,
        theme: true,
        buttonStyle: true,
        fontFamily: true,
        backgroundColor: true,
        backgroundType: true,
        planTier: true,
        links: {
          where: { 
            isActive: true,
            isDeleted: false,
            OR: [
              { scheduledStart: null },
              { scheduledStart: { lte: new Date() } }
            ],
            AND: [
              {
                OR: [
                  { scheduledEnd: null },
                  { scheduledEnd: { gte: new Date() } }
                ]
              }
            ]
          },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            url: true,
            title: true,
            type: true,
            thumbnailUrl: true,
            settings: true
          }
        },
        socialIcons: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            platform: true,
            url: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: 'Profile not found',
        handle,
        suggestion: `Want to claim @${handle}? Sign up now!`
      });
    }
    
    // Parse settings JSON for each link
    const linksWithSettings = user.links.map(link => ({
      ...link,
      settings: link.settings ? JSON.parse(link.settings) : {}
    }));
    
    res.json({
      ...user,
      links: linksWithSettings,
      showBadge: user.planTier === 'free' // From knowledge base
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Track page view
router.post('/:handle/view', async (req, res) => {
  try {
    const { handle } = req.params;
    const handleLower = handle.toLowerCase();
    const { referrer } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const user = await prisma.user.findUnique({
      where: { handleLower },
      select: { id: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Deduplicate views within 30 minutes (from knowledge base)
    const ipHash = hashIP(ip);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const recentView = await prisma.analyticsEvent.findFirst({
      where: {
        userId: user.id,
        eventType: 'PAGE_VIEW',
        ipHash,
        createdAt: { gte: thirtyMinutesAgo }
      }
    });
    
    if (!recentView) {
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          eventType: 'PAGE_VIEW',
          referrer,
          referrerCategory: categorizeReferrer(referrer),
          device: detectDevice(userAgent),
          userAgent,
          ipHash
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Track link click
router.post('/click/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;
    const { referrer } = req.body;
    const userAgent = req.headers['user-agent'];
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const link = await prisma.link.findUnique({
      where: { id: linkId },
      select: { id: true, userId: true, url: true }
    });
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Record click event
    await prisma.analyticsEvent.create({
      data: {
        userId: link.userId,
        linkId: link.id,
        eventType: 'LINK_CLICK',
        referrer,
        referrerCategory: categorizeReferrer(referrer),
        device: detectDevice(userAgent),
        userAgent,
        ipHash: hashIP(ip)
      }
    });
    
    // Increment click count on link
    await prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } }
    });
    
    res.json({ success: true, url: link.url });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;


