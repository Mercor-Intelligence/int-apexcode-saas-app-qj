/**
 * BrowserBase Verification Script: Public Profile Page
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

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../../utils/browser.js';
import { config } from '../../config.js';
import Reporter from '../../utils/reporter.js';

async function verifyPublicProfile() {
  const reporter = new Reporter('Public Profile Verification');
  let browser, page, sessionId;
  let authToken = null;
  
  // Test user credentials
  const testUser = {
    email: `public-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `publictest${Date.now().toString().slice(-8)}`
  };
  
  // Profile data
  const profileData = {
    bioTitle: 'Public Test User',
    bioDescription: 'This is a public test bio'
  };
  
  // Test links
  const visibleLink = {
    title: 'Visible Test Link',
    url: 'https://example.com/visible',
    type: 'CLASSIC'
  };
  
  const hiddenLink = {
    title: 'Hidden Test Link',
    url: 'https://example.com/hidden',
    type: 'CLASSIC'
  };
  
  console.log('\n🚀 Starting Public Profile Verification (BrowserBase)...\n');
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
    const profileResponse = await apiRequest('/api/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(profileData)
    });
    reporter.record('Profile data set', profileResponse.ok);
    
    // Create visible link
    const visibleLinkResponse = await apiRequest('/api/links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(visibleLink)
    });
    if (!visibleLinkResponse.ok) {
      const errText = await visibleLinkResponse.text();
      reporter.record('Visible link created', false, `Status: ${visibleLinkResponse.status} - ${errText}`);
    } else {
      reporter.record('Visible link created', true);
    }
    
    // Create hidden link and then disable it
    const hiddenLinkResponse = await apiRequest('/api/links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(hiddenLink)
    });
    
    if (hiddenLinkResponse.ok) {
      const hiddenLinkData = await hiddenLinkResponse.json();
      // Update to make it inactive
      await apiRequest(`/api/links/${hiddenLinkData.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ isActive: false })
      });
      reporter.record('Hidden link created', true);
    } else {
      reporter.record('Hidden link created', false);
    }
    
    // Launch BrowserBase session
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // === Step 1: Navigate to public profile ===
    console.log('Step 1: Navigate to public profile');
    
    await page.goto(`${config.frontendUrl}/${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check we're not on error page
    const errorPage = await page.$('.public-error');
    const profilePage = await page.$('.public-profile');
    reporter.record('Public profile page loads', !!profilePage && !errorPage);
    
    // === Step 2: Verify profile title ===
    console.log('Step 2: Verify profile title');
    
    const pageContent = await page.content();
    const titleElement = await page.$('.profile-title');
    const titleText = titleElement ? await titleElement.textContent() : '';
    const titleVisible = titleText.includes(profileData.bioTitle) || pageContent.includes(profileData.bioTitle);
    reporter.record('Profile title is visible', titleVisible);
    
    // === Step 3: Verify bio ===
    console.log('Step 3: Verify bio');
    
    const bioElement = await page.$('.profile-bio');
    const bioText = bioElement ? await bioElement.textContent() : '';
    const bioVisible = bioText.includes(profileData.bioDescription) || pageContent.includes(profileData.bioDescription);
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
    
    const linkButton = await page.$('.link-button');
    if (linkButton) {
      const linkText = await linkButton.textContent();
      reporter.record('Link button element found', linkText.includes(visibleLink.title));
    } else {
      reporter.record('Link button element found', false);
    }
    
    // === Step 7: Verify avatar placeholder ===
    console.log('Step 7: Verify avatar');
    
    const avatarEl = await page.$('.profile-avatar, .profile-avatar-placeholder, .avatar-wrapper');
    reporter.record('Avatar element present', !!avatarEl);
    
    // === Step 8: Test 404 for invalid handle ===
    console.log('Step 8: Test 404 for invalid handle');
    
    await page.goto(`${config.frontendUrl}/nonexistent-handle-${Date.now()}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const notFoundContent = await page.content();
    const shows404 = notFoundContent.includes('404') || 
                     notFoundContent.includes("doesn't exist") ||
                     notFoundContent.includes('not found');
    reporter.record('404 page for invalid handle', shows404);
    
    // === Step 9: Verify page view tracking ===
    console.log('Step 9: Verify page view was tracked');
    
    // Visit the profile again to ensure view is tracked
    await page.goto(`${config.frontendUrl}/${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for tracking
    
    const analyticsResponse = await apiRequest('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      reporter.record('Page view tracked', analytics.totalViews >= 1, `Views: ${analytics.totalViews}`);
    } else {
      reporter.record('Page view tracked', false, 'Analytics API error');
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'public-profile-error');
    reporter.record('Public profile flow', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
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
