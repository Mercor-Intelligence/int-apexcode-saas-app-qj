/**
 * Backend API Verifier: Analytics
 * Tests analytics endpoints directly without browser
 */

import { config } from '../../config.js';

const API_URL = config.backendUrl + '/api';

// Test results collector
const results = {
  suite: 'Analytics API',
  tests: [],
  passed: 0,
  failed: 0,
  total: 0
};

function addResult(name, passed, details = {}) {
  results.tests.push({ name, passed, ...details });
  results.total++;
  if (passed) results.passed++;
  else results.failed++;
  console.log(`  ${passed ? '✓' : '✗'} ${name}`);
  if (details.error) console.log(`    Error: ${details.error}`);
}

// Create a test user and return token + handle
async function createTestUser() {
  const handle = `analyticstest${Date.now()}`;
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `analytics-api-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      handle: handle
    })
  });

  const data = await response.json();
  return { token: data.token, handle };
}

// Create a link for click tracking tests
async function createTestLink(token) {
  const response = await fetch(`${API_URL}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Analytics Test Link',
      url: 'https://example.com'
    })
  });

  const data = await response.json();
  return data.id;
}

async function testTrackPageView(handle) {
  try {
    const response = await fetch(`${API_URL}/analytics/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: handle,
        referrer: 'https://twitter.com',
        device: 'desktop',
        countryCode: 'US'
      })
    });

    addResult('Track page view works', response.ok);
    return response.ok;
  } catch (error) {
    addResult('Track page view works', false, { error: error.message });
    return false;
  }
}

async function testTrackLinkClick(linkId) {
  try {
    const response = await fetch(`${API_URL}/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkId: linkId,
        referrer: 'https://instagram.com',
        device: 'mobile'
      })
    });

    addResult('Track link click works', response.ok);
    return response.ok;
  } catch (error) {
    addResult('Track link click works', false, { error: error.message });
    return false;
  }
}

async function testGetAnalyticsSummary(token) {
  try {
    // Try /analytics/summary first
    let response = await fetch(`${API_URL}/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Fallback to /analytics
    if (!response.ok) {
      response = await fetch(`${API_URL}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }

    const data = await response.json();

    // Check for expected fields
    const hasViews = 'totalViews' in data || 'views' in data;
    const hasClicks = 'totalClicks' in data || 'clicks' in data;

    addResult('Get analytics summary works', response.ok && (hasViews || hasClicks));
    return data;
  } catch (error) {
    addResult('Get analytics summary works', false, { error: error.message });
    return null;
  }
}

async function testGetLinkAnalytics(token) {
  try {
    const response = await fetch(`${API_URL}/analytics/links`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    addResult('Get per-link analytics works', response.ok && Array.isArray(data));
    return data;
  } catch (error) {
    addResult('Get per-link analytics works', false, { error: error.message });
    return [];
  }
}

async function testGetDailyStats(token) {
  try {
    const response = await fetch(`${API_URL}/analytics/daily?days=7`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    addResult('Get daily stats works', response.ok && Array.isArray(data));
  } catch (error) {
    addResult('Get daily stats works', false, { error: error.message });
  }
}

async function testAnalyticsPeriodFilter(token) {
  try {
    const response = await fetch(`${API_URL}/analytics/summary?period=7d`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    addResult('Analytics period filter works', response.ok);
  } catch (error) {
    addResult('Analytics period filter works', false, { error: error.message });
  }
}

async function testAnalyticsRequiresAuth() {
  try {
    const response = await fetch(`${API_URL}/analytics/summary`);

    addResult('Analytics summary requires auth', response.status === 401 || response.status === 403);
  } catch (error) {
    addResult('Analytics summary requires auth', false, { error: error.message });
  }
}

async function testTrackViewInvalidHandle() {
  try {
    const response = await fetch(`${API_URL}/analytics/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: 'nonexistent-handle-12345',
        referrer: 'https://google.com'
      })
    });

    addResult('Track view invalid handle returns 404', response.status === 404);
  } catch (error) {
    addResult('Track view invalid handle returns 404', false, { error: error.message });
  }
}

async function testTrackClickInvalidLink() {
  try {
    const response = await fetch(`${API_URL}/analytics/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkId: 'nonexistent-link-12345'
      })
    });

    addResult('Track click invalid link returns 404', response.status === 404);
  } catch (error) {
    addResult('Track click invalid link returns 404', false, { error: error.message });
  }
}

async function testReferrerCategorization(token) {
  try {
    const response = await fetch(`${API_URL}/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    // Check if referrer data is included
    const hasReferrers = 'topReferrers' in data || 'referrers' in data;

    addResult('Analytics includes referrer categorization', hasReferrers);
  } catch (error) {
    addResult('Analytics includes referrer categorization', false, { error: error.message });
  }
}

async function testDeviceTracking(token) {
  try {
    const response = await fetch(`${API_URL}/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    // Check if device data is included
    const hasDevices = 'devices' in data || 'deviceBreakdown' in data;

    addResult('Analytics includes device tracking', hasDevices);
  } catch (error) {
    addResult('Analytics includes device tracking', false, { error: error.message });
  }
}

async function testCTRCalculation(token) {
  try {
    const response = await fetch(`${API_URL}/analytics/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    // Check if CTR is calculated
    const hasCTR = 'ctr' in data || 'clickThroughRate' in data;

    addResult('Analytics calculates CTR', hasCTR);
  } catch (error) {
    addResult('Analytics calculates CTR', false, { error: error.message });
  }
}

export async function verifyAnalyticsAPI() {
  console.log('\n  Analytics API Tests');
  console.log('  ' + '─'.repeat(40));

  // Test auth requirements first
  await testAnalyticsRequiresAuth();

  // Create test user
  const { token, handle } = await createTestUser();
  if (!token) {
    addResult('Setup: Create test user', false, { error: 'Failed to create test user' });
    results.overallPassed = false;
    return results;
  }
  addResult('Setup: Create test user', true);

  // Create test link
  const linkId = await createTestLink(token);
  if (!linkId) {
    addResult('Setup: Create test link', false, { error: 'Failed to create test link' });
  } else {
    addResult('Setup: Create test link', true);
  }

  // Test tracking (public endpoints)
  await testTrackPageView(handle);
  await testTrackPageView(handle); // Track multiple views
  
  if (linkId) {
    await testTrackLinkClick(linkId);
    await testTrackLinkClick(linkId); // Track multiple clicks
  }

  // Small delay to ensure data is persisted
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test analytics retrieval (authenticated endpoints)
  await testGetAnalyticsSummary(token);
  await testGetLinkAnalytics(token);
  await testGetDailyStats(token);
  await testAnalyticsPeriodFilter(token);

  // Test advanced features
  await testReferrerCategorization(token);
  await testDeviceTracking(token);
  await testCTRCalculation(token);

  // Test error cases
  await testTrackViewInvalidHandle();
  await testTrackClickInvalidLink();

  results.overallPassed = results.failed === 0;
  return results;
}

export default verifyAnalyticsAPI;


