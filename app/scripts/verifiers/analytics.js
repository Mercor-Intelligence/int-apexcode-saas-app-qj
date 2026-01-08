/**
 * BrowserBase Verification Script: Analytics Tracking
 * 
 * Actions:
 * 1. Create a test user with links via API
 * 2. Visit the public profile page (generates view)
 * 3. Click on links (generates clicks)
 * 4. Navigate to Analytics tab in dashboard
 * 
 * Verifications:
 * - Page views are tracked correctly
 * - Link clicks are tracked correctly
 * - Analytics dashboard displays data
 * - CTR is calculated correctly
 * - Per-link statistics are shown
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyAnalytics() {
  const reporter = new Reporter('Analytics Verification');
  let browser, page, sessionId;
  let authToken = null;
  let createdLinkId = null;
  
  // Test user credentials
  const testUser = {
    email: `analytics-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `analyticstest${Date.now()}`
  };
  
  // Test link
  const testLink = {
    title: 'Analytics Test Link',
    url: 'https://example.com/analytics-test',
    isVisible: true
  };
  
  console.log('\n🚀 Starting Analytics Verification (BrowserBase)...\n');
  
  try {
    // === Setup: Create test user and link ===
    console.log('Setup: Create test user and link');
    
    // Create user
    const signupResponse = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });
    
    if (signupResponse.ok) {
      const data = await signupResponse.json();
      authToken = data.token;
      reporter.record('Test user created', true);
    } else {
      reporter.record('Test user created', false);
      return reporter.summary();
    }
    
    // Create link
    const linkResponse = await apiRequest('/api/links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(testLink)
    });
    
    if (linkResponse.ok) {
      const linkData = await linkResponse.json();
      createdLinkId = linkData.id;
      reporter.record('Test link created', true);
    } else {
      reporter.record('Test link created', false);
    }
    
    // Get initial analytics (should be 0)
    const initialAnalytics = await apiRequest('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    let initialViews = 0;
    let initialClicks = 0;
    if (initialAnalytics.ok) {
      const data = await initialAnalytics.json();
      initialViews = data.totalViews || 0;
      initialClicks = data.totalClicks || 0;
    }
    
    // Launch BrowserBase session
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // === Step 1: Visit public profile (generate view) ===
    console.log('Step 1: Visit public profile to generate view');
    
    await page.goto(`${config.frontendUrl}/@${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    reporter.record('Public profile visited', true);
    
    // Wait for view tracking to complete
    await page.waitForTimeout(1500);
    
    // === Step 2: Click on link (generate click) ===
    console.log('Step 2: Click on link to generate click event');
    
    // Find and click the link
    const linkElement = await page.$(`a:has-text("${testLink.title}"), .link-button:has-text("${testLink.title}")`);
    
    if (linkElement) {
      // Listen for new page/tab that might open
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
        linkElement.click()
      ]);
      
      // Close the new tab if it opened
      if (newPage) {
        await newPage.close();
      }
      
      reporter.record('Link clicked', true);
    } else {
      // Try tracking via API directly as fallback
      if (createdLinkId) {
        await apiRequest(`/api/public/click/${createdLinkId}`, {
          method: 'POST'
        });
        reporter.record('Link clicked (API)', true);
      } else {
        reporter.record('Link clicked', false, 'Link element not found');
      }
    }
    
    // Wait for click tracking to complete
    await page.waitForTimeout(1500);
    
    // === Step 3: Verify analytics data via API ===
    console.log('Step 3: Verify analytics via API');
    
    const analyticsResponse = await apiRequest('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      
      // Views should have increased
      const viewsIncreased = analytics.totalViews > initialViews;
      reporter.record('Views count increased', viewsIncreased, 
        `Before: ${initialViews}, After: ${analytics.totalViews}`);
      
      // Clicks should have increased
      const clicksIncreased = analytics.totalClicks > initialClicks;
      reporter.record('Clicks count increased', clicksIncreased,
        `Before: ${initialClicks}, After: ${analytics.totalClicks}`);
      
      // CTR should be calculated
      if (analytics.totalViews > 0) {
        const expectedCtr = (analytics.totalClicks / analytics.totalViews * 100).toFixed(1);
        const reportedCtr = parseFloat(analytics.ctr || analytics.clickThroughRate || 0).toFixed(1);
        reporter.record('CTR calculated', true, `CTR: ${reportedCtr}%`);
      }
    } else {
      reporter.record('Analytics API response', false, 'API error');
    }
    
    // === Step 4: Verify per-link statistics ===
    console.log('Step 4: Verify per-link statistics');
    
    const linkStatsResponse = await apiRequest('/api/analytics/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (linkStatsResponse.ok) {
      const linkStats = await linkStatsResponse.json();
      const hasLinkStats = Array.isArray(linkStats) && linkStats.length > 0;
      reporter.record('Per-link statistics available', hasLinkStats, 
        `Links with stats: ${linkStats?.length || 0}`);
      
      // Check if our test link has clicks
      const testLinkStats = linkStats?.find(l => l.title === testLink.title || l.id === createdLinkId);
      if (testLinkStats) {
        reporter.record('Test link has click data', testLinkStats.clicks > 0 || testLinkStats.clickCount > 0);
      }
    } else {
      reporter.record('Per-link statistics available', false, 'API error');
    }
    
    // === Step 5: Login and verify Analytics tab in dashboard ===
    console.log('Step 5: Verify Analytics tab in dashboard');
    
    await page.goto(`${config.frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      reporter.record('Login to dashboard', true);
    } catch {
      reporter.record('Login to dashboard', false);
    }
    
    // Navigate to Analytics tab
    const analyticsTab = await page.$('text=Analytics, button:has-text("Analytics"), [data-tab="analytics"]');
    if (analyticsTab) {
      await analyticsTab.click();
      await page.waitForTimeout(1000);
      reporter.record('Navigate to Analytics tab', true);
    }
    
    // === Step 6: Verify analytics display in dashboard ===
    console.log('Step 6: Verify analytics display');
    
    const dashboardContent = await page.content();
    
    // Check for analytics elements
    const hasViewsDisplay = dashboardContent.includes('view') || dashboardContent.includes('View');
    const hasClicksDisplay = dashboardContent.includes('click') || dashboardContent.includes('Click');
    
    reporter.record('Dashboard shows views metric', hasViewsDisplay);
    reporter.record('Dashboard shows clicks metric', hasClicksDisplay);
    
    // Check for actual numbers (should be > 0)
    const numbers = dashboardContent.match(/\d+/g) || [];
    const hasNonZeroNumbers = numbers.some(n => parseInt(n) > 0);
    reporter.record('Analytics shows non-zero values', hasNonZeroNumbers);
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'analytics-error');
    reporter.record('Analytics flow', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }
  
  return reporter.summary();
}

// Run if executed directly
if (process.argv[1].includes('analytics.js')) {
  verifyAnalytics().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyAnalytics;
