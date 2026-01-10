/**
 * Analytics Routes
 * Tracks and retrieves analytics data
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get view count
    const views = await prisma.analyticsEvent.count({
      where: {
        userId: req.user.id,
        eventType: 'PAGE_VIEW',
        createdAt: { gte: startDate }
      }
    });
    
    // Get click count
    const clicks = await prisma.analyticsEvent.count({
      where: {
        userId: req.user.id,
        eventType: 'LINK_CLICK',
        createdAt: { gte: startDate }
      }
    });
    
    // Calculate CTR
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : 0;
    
    // Get top referrers
    const referrerData = await prisma.analyticsEvent.groupBy({
      by: ['referrerCategory'],
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
        referrerCategory: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    const topReferrers = referrerData.map(r => ({
      source: r.referrerCategory || 'direct',
      count: r._count.id
    }));
    
    // Get top countries
    const countryData = await prisma.analyticsEvent.groupBy({
      by: ['countryCode'],
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
        countryCode: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    const topCountries = countryData.map(c => ({
      country: c.countryCode,
      count: c._count.id
    }));
    
    // Get device breakdown
    const deviceData = await prisma.analyticsEvent.groupBy({
      by: ['device'],
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
        device: { not: null }
      },
      _count: { id: true }
    });
    
    const devices = deviceData.reduce((acc, d) => {
      acc[d.device || 'unknown'] = d._count.id;
      return acc;
    }, {});
    
    res.json({
      period,
      totalViews: views,
      totalClicks: clicks,
      ctr: parseFloat(ctr),
      topReferrers,
      topCountries,
      devices
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get per-link analytics
router.get('/links', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get all user links with click counts
    const links = await prisma.link.findMany({
      where: { 
        userId: req.user.id,
        isDeleted: false
      },
      select: {
        id: true,
        title: true,
        url: true,
        clickCount: true,
        _count: {
          select: {
            analyticsEvents: {
              where: {
                eventType: 'LINK_CLICK',
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      orderBy: { position: 'asc' }
    });
    
    const linkStats = links.map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      totalClicks: link.clickCount,
      periodClicks: link._count.analyticsEvents,
      clicks: link.clickCount // alias for compatibility
    }));
    
    res.json(linkStats);
  } catch (error) {
    console.error('Link analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get daily stats (for charts)
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(now - days * 24 * 60 * 60 * 1000);
    
    // Get all events in period
    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate }
      },
      select: {
        eventType: true,
        createdAt: true
      }
    });
    
    // Group by day
    const dailyStats = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { views: 0, clicks: 0 };
    }
    
    events.forEach(event => {
      const dateStr = event.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        if (event.eventType === 'PAGE_VIEW') {
          dailyStats[dateStr].views++;
        } else if (event.eventType === 'LINK_CLICK') {
          dailyStats[dateStr].clicks++;
        }
      }
    });
    
    // Convert to array sorted by date
    const result = Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(result);
  } catch (error) {
    console.error('Daily analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to detect device type
function detectDevice(userAgent) {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
}

// Helper function to categorize referrer
function categorizeReferrer(referrer) {
  if (!referrer || referrer === '') return 'direct';
  const ref = referrer.toLowerCase();
  if (ref.includes('twitter') || ref.includes('instagram') || 
      ref.includes('tiktok') || ref.includes('facebook') ||
      ref.includes('linkedin') || ref.includes('youtube')) {
    return 'social';
  }
  if (ref.includes('google') || ref.includes('bing') || 
      ref.includes('yahoo') || ref.includes('duckduckgo')) {
    return 'search';
  }
  return 'other';
}

// Track page view (public endpoint)
router.post('/view', async (req, res) => {
  try {
    const { handle, referrer, device, countryCode, userAgent } = req.body;
    
    if (!handle) {
      return res.status(400).json({ error: 'Handle is required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { handleLower: handle.toLowerCase() }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Categorize referrer
    const referrerCategory = categorizeReferrer(referrer);
    
    // Detect device
    const detectedDevice = device || detectDevice(userAgent || req.headers['user-agent']);
    
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: 'PAGE_VIEW',
        referrer: referrer || null,
        referrerCategory,
        device: detectedDevice,
        countryCode: countryCode || null,
        userAgent: userAgent || req.headers['user-agent'] || null
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Track link click (public endpoint)
router.post('/click', async (req, res) => {
  try {
    const { linkId, referrer, device, countryCode, userAgent } = req.body;
    
    if (!linkId) {
      return res.status(400).json({ error: 'Link ID is required' });
    }
    
    const link = await prisma.link.findUnique({
      where: { id: linkId }
    });
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Increment click count
    await prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } }
    });
    
    // Categorize referrer and detect device
    const referrerCategory = categorizeReferrer(referrer);
    const detectedDevice = device || detectDevice(userAgent || req.headers['user-agent']);
    
    // Record analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: link.userId,
        linkId,
        eventType: 'LINK_CLICK',
        referrer: referrer || null,
        referrerCategory,
        device: detectedDevice,
        countryCode: countryCode || null,
        userAgent: userAgent || req.headers['user-agent'] || null
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get analytics (alias for summary - for compatibility)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    }
    
    const views = await prisma.analyticsEvent.count({
      where: {
        userId: req.user.id,
        eventType: 'PAGE_VIEW',
        createdAt: { gte: startDate }
      }
    });
    
    const clicks = await prisma.analyticsEvent.count({
      where: {
        userId: req.user.id,
        eventType: 'LINK_CLICK',
        createdAt: { gte: startDate }
      }
    });
    
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : 0;
    
    // Get referrer data
    const referrerData = await prisma.analyticsEvent.groupBy({
      by: ['referrerCategory'],
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
        referrerCategory: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    const topReferrers = referrerData.map(r => ({
      source: r.referrerCategory || 'direct',
      count: r._count.id
    }));
    
    // Get device data
    const deviceData = await prisma.analyticsEvent.groupBy({
      by: ['device'],
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
        device: { not: null }
      },
      _count: { id: true }
    });
    
    const devices = deviceData.reduce((acc, d) => {
      acc[d.device || 'unknown'] = d._count.id;
      return acc;
    }, {});
    
    // Get location data
    const countryData = await prisma.analyticsEvent.groupBy({
      by: ['countryCode'],
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
        countryCode: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    const topCountries = countryData.map(c => ({
      country: c.countryCode,
      count: c._count.id
    }));
    
    res.json({
      totalViews: views,
      totalClicks: clicks,
      ctr: parseFloat(ctr),
      views,
      clicks,
      topReferrers,
      devices,
      topCountries
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

