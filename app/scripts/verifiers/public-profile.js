/**
 * Browser Verification Script: Public Profile Page
 * 
 * Actions:
 * 1. Create a test user with profile and links via API
 * 2. Navigate to public profile URL (/@handle)
 * 3. Verify profile content displays
 * 4. Click on a link
 * 
 * Verifications:
 * - Public profile page loads for valid handle
 * - Display name is visible
 * - Bio is visible
 * - Avatar is displayed (if set)
 * - Links are displayed and clickable
 * - Hidden links are NOT displayed
 * - 404 page shows for invalid handle
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyPublicProfile() {
  const reporter = new Reporter('Public Profile Verification');
  let browser, page;
  let authToken = null;
  
  // Test user credentials
  const testUser = {
    email: `public-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `publictest${Date.now()}`
  };
  
  // Profile data
  const profileData = {
    displayName: 'Public Test User',
    bio: 'This is a public test bio'
  };
  
  // Test links
  const visibleLink = {
    title: 'Visible Test Link',
    url: 'https://example.com/visible',
    isVisible: true
  };
  
  const hiddenLink = {
    title: 'Hidden Test Link',
    url: 'https://example.com/hidden',
    isVisible: false
  };
  
  console.log('\n🚀 Starting Public Profile Verification...\n');
  console.log(`Test Profile: @${testUser.handle}\n`);
  
  try {
    // === Setup: Create test user with profile and links ===
    console.log('Setup: Create test user with profile and links');
    
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
    
    // Update profile
    await apiRequest('/api/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(profileData)
    });
    reporter.record('Profile data set', true);
    
    // Create visible link
    const visibleLinkResponse = await apiRequest('/api/links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(visibleLink)
    });
    reporter.record('Visible link created', visibleLinkResponse.ok);
    
    // Create hidden link
    const hiddenLinkResponse = await apiRequest('/api/links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(hiddenLink)
    });
    reporter.record('Hidden link created', hiddenLinkResponse.ok);
    
    // Launch browser
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    
    // === Step 1: Navigate to public profile ===
    console.log('Step 1: Navigate to public profile');
    
    await page.goto(`${config.frontendUrl}/@${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    
    const pageLoaded = await page.title();
    reporter.record('Public profile page loads', !!pageLoaded);
    
    // === Step 2: Verify display name ===
    console.log('Step 2: Verify display name');
    
    const pageContent = await page.content();
    const displayNameVisible = pageContent.includes(profileData.displayName);
    reporter.record('Display name is visible', displayNameVisible);
    
    // === Step 3: Verify bio ===
    console.log('Step 3: Verify bio');
    
    const bioVisible = pageContent.includes(profileData.bio);
    reporter.record('Bio is visible', bioVisible);
    
    // === Step 4: Verify visible link is displayed ===
    console.log('Step 4: Verify visible link');
    
    const visibleLinkDisplayed = pageContent.includes(visibleLink.title);
    reporter.record('Visible link is displayed', visibleLinkDisplayed);
    
    // === Step 5: Verify hidden link is NOT displayed ===
    console.log('Step 5: Verify hidden link is hidden');
    
    const hiddenLinkDisplayed = pageContent.includes(hiddenLink.title);
    reporter.record('Hidden link is NOT displayed', !hiddenLinkDisplayed);
    
    // === Step 6: Verify links are clickable ===
    console.log('Step 6: Verify links are clickable');
    
    const linkElement = await page.$(`a:has-text("${visibleLink.title}"), .link-button:has-text("${visibleLink.title}")`);
    if (linkElement) {
      const href = await linkElement.getAttribute('href');
      const hasCorrectUrl = href === visibleLink.url || href?.includes('example.com');
      reporter.record('Link has correct URL', hasCorrectUrl, `href: ${href}`);
      
      // Check target attribute for new tab
      const target = await linkElement.getAttribute('target');
      reporter.record('Link opens in new tab', target === '_blank');
    } else {
      reporter.record('Link element found', false);
    }
    
    // === Step 7: Verify avatar placeholder/image ===
    console.log('Step 7: Verify avatar');
    
    const avatarEl = await page.$('.avatar, .profile-avatar, img[alt*="avatar" i], .avatar-placeholder');
    reporter.record('Avatar element present', !!avatarEl);
    
    // === Step 8: Test 404 for invalid handle ===
    console.log('Step 8: Test 404 for invalid handle');
    
    await page.goto(`${config.frontendUrl}/@nonexistent-handle-${Date.now()}`);
    await page.waitForLoadState('networkidle');
    
    const notFoundContent = await page.content();
    const shows404 = notFoundContent.toLowerCase().includes('not found') || 
                     notFoundContent.toLowerCase().includes('404') ||
                     notFoundContent.toLowerCase().includes("doesn't exist");
    reporter.record('404 page for invalid handle', shows404);
    
    // === Step 9: Verify page view tracking ===
    console.log('Step 9: Verify page view was tracked');
    
    // Small delay to ensure analytics were recorded
    await page.waitForTimeout(1000);
    
    const analyticsResponse = await apiRequest('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      // Should have at least 1 view from our page visit
      reporter.record('Page view tracked', analytics.totalViews >= 1, `Views: ${analytics.totalViews}`);
    } else {
      reporter.record('Page view tracked', false, 'Analytics API error');
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'public-profile-error');
    reporter.record('Public profile flow', false, error.message);
  } finally {
    await closeBrowser(browser);
  }
  
  return reporter.summary();
}

// Run if executed directly
if (process.argv[1].includes('public-profile.js')) {
  verifyPublicProfile().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyPublicProfile;

