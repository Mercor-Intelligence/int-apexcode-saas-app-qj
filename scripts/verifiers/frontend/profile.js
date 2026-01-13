/**
 * BrowserBase Verification Script: Profile Management Flow
 * 
 * Actions:
 * 1. Login as test user
 * 2. Navigate to Appearance tab
 * 3. Update profile title (bioTitle)
 * 4. Update bio (bioDescription)
 * 5. Change theme
 * 
 * Verifications:
 * - Profile form displays current values
 * - Changes visible in preview
 * - Changes persist in database
 * - Public profile reflects changes
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyProfile() {
  const reporter = new Reporter('Profile Management Verification');
  let browser, page, sessionId;
  let authToken = null;
  
  // Test user credentials
  const testUser = {
    email: `profile-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `profiletest${Date.now().toString().slice(-8)}`
  };
  
  // Profile updates
  const profileUpdates = {
    bioTitle: 'Updated Display Name',
    bioDescription: 'This is an updated bio for testing.'
  };
  
  console.log('\n🚀 Starting Profile Management Verification (BrowserBase)...\n');
  
  try {
    // === Setup: Create test user and get token ===
    console.log('Setup: Create test user');
    
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
    
    // Launch BrowserBase session
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // === Step 1: Login ===
    console.log('Step 1: Login as test user');
    
    await page.goto(`${config.frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      reporter.record('Login successful', true);
    } catch {
      reporter.record('Login successful', false);
      return reporter.summary();
    }
    
    // === Step 2: Navigate to Appearance tab ===
    console.log('Step 2: Navigate to Appearance tab');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    // Click Appearance link in sidebar
    await page.goto(`${config.frontendUrl}/dashboard/appearance`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const appearanceTab = await page.$('.appearance-tab');
    reporter.record('Navigate to Appearance tab', !!appearanceTab);
    
    // === Step 3: Update profile title ===
    console.log('Step 3: Update profile title');
    
    const titleInput = await page.$('input[placeholder="Your name or brand"]');
    if (titleInput) {
      await titleInput.fill('');
      await titleInput.fill(profileUpdates.bioTitle);
      await page.waitForTimeout(1000); // Wait for auto-save
      reporter.record('Fill profile title', true);
    } else {
      reporter.record('Fill profile title', false, 'Input not found');
    }
    
    // === Step 4: Update bio ===
    console.log('Step 4: Update bio');
    
    const bioInput = await page.$('input[placeholder="A short description about you"]');
    if (bioInput) {
      await bioInput.fill('');
      await bioInput.fill(profileUpdates.bioDescription);
      await page.waitForTimeout(1000); // Wait for auto-save
      reporter.record('Fill bio', true);
    } else {
      reporter.record('Fill bio', false, 'Input not found');
    }
    
    // === Step 5: Verify changes in preview ===
    console.log('Step 5: Verify changes in preview');
    
    await page.waitForTimeout(500);
    const previewContent = await page.content();
    const titleInPreview = previewContent.includes(profileUpdates.bioTitle);
    const bioInPreview = previewContent.includes(profileUpdates.bioDescription);
    
    reporter.record('Title visible in preview', titleInPreview);
    reporter.record('Bio visible in preview', bioInPreview);
    
    // === Step 6: Verify changes persisted via API ===
    console.log('Step 6: Verify changes in database');
    
    await page.waitForTimeout(1000); // Wait for save to complete
    
    const profileResponse = await apiRequest('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      reporter.record('Title saved to database', profile.bioTitle === profileUpdates.bioTitle);
      reporter.record('Bio saved to database', profile.bioDescription === profileUpdates.bioDescription);
    } else {
      reporter.record('Profile fetch from database', false, 'API error');
    }
    
    // === Step 7: Change theme ===
    console.log('Step 7: Change theme');
    
    const themeCards = await page.$$('.theme-card');
    if (themeCards.length > 1) {
      // Click second theme option
      await themeCards[1].click();
      await page.waitForTimeout(1000);
      reporter.record('Change theme selection', true);
    } else {
      reporter.record('Change theme selection', false, 'Theme cards not found');
    }
    
    // === Step 8: Verify public profile reflects changes ===
    console.log('Step 8: Verify public profile');
    
    await page.goto(`${config.frontendUrl}/${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const publicContent = await page.content();
    const titleOnPublic = publicContent.includes(profileUpdates.bioTitle);
    const bioOnPublic = publicContent.includes(profileUpdates.bioDescription);
    
    reporter.record('Title visible on public profile', titleOnPublic);
    reporter.record('Bio visible on public profile', bioOnPublic);
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'profile-error');
    reporter.record('Profile management flow', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }
  
  return reporter.summary();
}

// Run if executed directly
if (process.argv[1].includes('profile.js')) {
  verifyProfile().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyProfile;
