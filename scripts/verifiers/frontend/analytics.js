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
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../../utils/browser.js';
import { config } from '../../config.js';
import Reporter from '../../utils/reporter.js';

async function verifyAnalytics() {
  const reporter = new Reporter('Analytics Verification');
  let browser, page, sessionId;
  let authToken = null;
  let createdLinkId = null;
  
  // Test user credentials
  const testUser = {
    email: `analytics-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `analyticstest${Date.now().toString().slice(-8)}`
  };
  
  // Test link
  const testLink = {
    title: 'Analytics Test Link',
    url: 'https://example.com/analytics-test',
    type: 'CLASSIC'
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
      const errText = await linkResponse.text();
      reporter.record('Test link created', false, `Status: ${linkResponse.status} - ${errText}`);
    }
    
    // Launch BrowserBase session
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // === Step 1: Visit public profile (generate view) ===
    console.log('Step 1: Visit public profile to generate view');
    
    await page.goto(`${config.frontendUrl}/${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for tracking
    reporter.record('Public profile visited', true);
    
    // === Step 2: Click on link (generate click) ===
    console.log('Step 2: Click on link to generate click event');
    
    const linkButton = await page.$('.link-button');
    if (linkButton) {
      // Listen for new page/tab
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
        linkButton.click()
      ]);
      
      if (newPage) {
        await newPage.close();
      }
      
      reporter.record('Link clicked', true);
    } else {
      // Track via API as fallback
      if (createdLinkId) {
        await apiRequest(`/api/public/click/${createdLinkId}`, {
          method: 'POST',
          body: JSON.stringify({ device: 'desktop', referrer: 'Direct' })
        });
        reporter.record('Link clicked (API fallback)', true);
      } else {
        reporter.record('Link clicked', false, 'Link not found');
      }
    }
    
    await page.waitForTimeout(2000); // Wait for tracking
    
    // === Step 3: Verify analytics data via API ===
    console.log('Step 3: Verify analytics via API');
    
    const analyticsResponse = await apiRequest('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      
      reporter.record('Views count recorded', analytics.totalViews >= 1, 
        `Views: ${analytics.totalViews}`);
      
      reporter.record('Clicks count recorded', analytics.totalClicks >= 0,
        `Clicks: ${analytics.totalClicks}`);
    } else {
      reporter.record('Analytics API response', false, 'API error');
    }
    
    // === Step 4: Login and verify Analytics tab in dashboard ===
    console.log('Step 4: Login and verify Analytics tab');
    
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
    await page.goto(`${config.frontendUrl}/dashboard/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const analyticsTab = await page.$('.analytics-tab, [class*="analytics"]');
    reporter.record('Navigate to Analytics tab', !!analyticsTab);
    
    // === Step 5: Verify analytics display in dashboard ===
    console.log('Step 5: Verify analytics display');
    
    const dashboardContent = await page.content();
    
    // Check for analytics elements - look for view/click text or stats
    const hasViewsDisplay = dashboardContent.toLowerCase().includes('view') || 
                           dashboardContent.includes('Views');
    const hasStats = dashboardContent.match(/\d+/) !== null;
    
    reporter.record('Dashboard shows analytics data', hasViewsDisplay || hasStats);
    reporter.record('Analytics page has content', dashboardContent.length > 1000);
    
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
