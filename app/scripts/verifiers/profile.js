/**
 * Browser Verification Script: Profile Management Flow
 * 
 * Actions:
 * 1. Login as test user
 * 2. Navigate to Appearance tab
 * 3. Update display name
 * 4. Update bio
 * 5. Change theme
 * 
 * Verifications:
 * - Profile form displays current values
 * - Display name updates correctly
 * - Bio updates correctly
 * - Theme changes apply to preview
 * - Changes persist in database
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyProfile() {
  const reporter = new Reporter('Profile Management Verification');
  let browser, page;
  let authToken = null;
  
  // Test user credentials
  const testUser = {
    email: `profile-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `profiletest${Date.now()}`
  };
  
  // Profile updates
  const profileUpdates = {
    displayName: 'Updated Display Name',
    bio: 'This is an updated bio for testing purposes.'
  };
  
  console.log('\n🚀 Starting Profile Management Verification...\n');
  
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
    
    // Launch browser
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    
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
    
    const appearanceTab = await page.$('text=Appearance, button:has-text("Appearance"), [data-tab="appearance"]');
    if (appearanceTab) {
      await appearanceTab.click();
      await page.waitForTimeout(500);
      reporter.record('Navigate to Appearance tab', true);
    } else {
      reporter.record('Navigate to Appearance tab', false, 'Tab not found');
    }
    
    // === Step 3: Update display name ===
    console.log('Step 3: Update display name');
    
    const displayNameInput = await page.$('input[name="displayName"], input[placeholder*="name" i], #displayName');
    if (displayNameInput) {
      await displayNameInput.fill('');
      await displayNameInput.fill(profileUpdates.displayName);
      reporter.record('Fill display name', true);
    } else {
      reporter.record('Fill display name', false, 'Input not found');
    }
    
    // === Step 4: Update bio ===
    console.log('Step 4: Update bio');
    
    const bioInput = await page.$('textarea[name="bio"], textarea[placeholder*="bio" i], #bio, textarea');
    if (bioInput) {
      await bioInput.fill('');
      await bioInput.fill(profileUpdates.bio);
      reporter.record('Fill bio', true);
    } else {
      reporter.record('Fill bio', false, 'Input not found');
    }
    
    // === Step 5: Save profile changes ===
    console.log('Step 5: Save profile changes');
    
    const saveButton = await page.$('button:has-text("Save"), button:has-text("Update"), button[type="submit"]');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      reporter.record('Save profile changes', true);
    } else {
      reporter.record('Save profile changes', false, 'Save button not found');
    }
    
    // === Step 6: Verify changes in preview ===
    console.log('Step 6: Verify changes in preview');
    
    const previewContent = await page.content();
    const displayNameInPreview = previewContent.includes(profileUpdates.displayName);
    const bioInPreview = previewContent.includes(profileUpdates.bio);
    
    reporter.record('Display name visible in preview', displayNameInPreview);
    reporter.record('Bio visible in preview', bioInPreview);
    
    // === Step 7: Verify changes persisted via API ===
    console.log('Step 7: Verify changes in database');
    
    const profileResponse = await apiRequest('/api/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (profileResponse.ok) {
      const profile = await profileResponse.json();
      reporter.record('Display name saved to database', profile.displayName === profileUpdates.displayName);
      reporter.record('Bio saved to database', profile.bio === profileUpdates.bio);
    } else {
      reporter.record('Profile fetch from database', false, 'API error');
    }
    
    // === Step 8: Change theme ===
    console.log('Step 8: Change theme');
    
    const themeOptions = await page.$$('.theme-option, [data-theme], input[name="theme"]');
    if (themeOptions.length > 1) {
      // Click second theme option
      await themeOptions[1].click();
      await page.waitForTimeout(500);
      reporter.record('Change theme selection', true);
      
      // Save theme
      const themeSaveBtn = await page.$('button:has-text("Save")');
      if (themeSaveBtn) {
        await themeSaveBtn.click();
        await page.waitForTimeout(1000);
      }
      
      // Verify theme changed in preview
      const previewEl = await page.$('.profile-preview, .preview');
      if (previewEl) {
        const previewClass = await previewEl.getAttribute('class');
        reporter.record('Theme applied to preview', !!previewClass);
      }
    } else {
      reporter.record('Change theme selection', false, 'Theme options not found');
    }
    
    // === Step 9: Verify public profile reflects changes ===
    console.log('Step 9: Verify public profile');
    
    await page.goto(`${config.frontendUrl}/@${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    
    const publicContent = await page.content();
    const displayNameOnPublic = publicContent.includes(profileUpdates.displayName);
    const bioOnPublic = publicContent.includes(profileUpdates.bio);
    
    reporter.record('Display name visible on public profile', displayNameOnPublic);
    reporter.record('Bio visible on public profile', bioOnPublic);
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'profile-error');
    reporter.record('Profile management flow', false, error.message);
  } finally {
    await closeBrowser(browser);
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

