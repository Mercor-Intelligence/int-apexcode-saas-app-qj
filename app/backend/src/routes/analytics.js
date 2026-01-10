const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: startDate },
      },
    });
    
    const totalViews = events.filter(e => e.eventType === 'PAGE_VIEW').length;
    const totalClicks = events.filter(e => e.eventType === 'LINK_CLICK').length;
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0;
    
    // Top referrers
    const referrerCounts = {};
    events.forEach(e => {
      const ref = e.referrer || 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Top countries
    const countryCounts = {};
    events.forEach(e => {
      const country = e.countryCode || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Device breakdown
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
    events.forEach(e => {
      const device = e.device || 'desktop';
      if (deviceCounts[device] !== undefined) {
        deviceCounts[device]++;
      }
    });
    
    // Daily views for chart
    const dailyViews = {};
    events.filter(e => e.eventType === 'PAGE_VIEW').forEach(e => {
      const day = e.createdAt.toISOString().split('T')[0];
      dailyViews[day] = (dailyViews[day] || 0) + 1;
    });
    
    res.json({
      totalViews,
      totalClicks,
      ctr: parseFloat(ctr),
      topReferrers,
      topCountries,
      devices: deviceCounts,
      dailyViews: Object.entries(dailyViews)
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get link-specific analytics
router.get('/links', authenticateToken, async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      where: { userId: req.user.id },
      orderBy: { clickCount: 'desc' },
      select: {
        id: true,
        title: true,
        url: true,
        clickCount: true,
      },
    });
    
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

