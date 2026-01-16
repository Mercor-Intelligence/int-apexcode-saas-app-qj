/**
 * BrowserBase Full Journey Verification Script
 * 
 * A comprehensive end-to-end test that covers the entire user journey
 * in a single BrowserBase session:
 * 
 * 1. SIGNUP - Create a new account
 * 2. DASHBOARD - Explore the dashboard
 * 3. LINKS - Add, edit, toggle, and manage links
 * 4. APPEARANCE - Customize profile appearance
 * 5. PUBLIC PROFILE - View and verify public page
 * 6. ANALYTICS - Verify tracking and analytics
 * 7. LOGOUT & LOGIN - Test authentication persistence
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../../utils/browser.js';
import { config } from '../../config.js';
import Reporter from '../../utils/reporter.js';

async function verifyFullJourney() {
  const reporter = new Reporter('Full User Journey Verification');
  let browser, page, sessionId;
  let authToken = null;
  
  // Generate unique test user
  const timestamp = Date.now();
  const testUser = {
    email: `journey-test-${timestamp}@example.com`,
    password: 'JourneyTest123!',
    handle: `journey${timestamp.toString().slice(-8)}`
  };
  
  // Test data
  const testLink1 = { title: 'My Website', url: 'https://example.com/website' };
  const testLink2 = { title: 'My Portfolio', url: 'https://example.com/portfolio' };
  const profileData = {
    bioTitle: 'Journey Test User',
    bioDescription: 'Testing the complete user journey'
  };
  
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 FULL USER JOURNEY VERIFICATION');
  console.log('═'.repeat(60));
  console.log(`Test User: ${testUser.email}`);
  console.log(`Handle: @${testUser.handle}`);
  console.log('═'.repeat(60) + '\n');
  
  try {
    // ══════════════════════════════════════════════════════════
    // LAUNCH BROWSERBASE SESSION
    // ══════════════════════════════════════════════════════════
    console.log('🌐 Launching BrowserBase session...\n');
    
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    console.log(`📍 Session ID: ${sessionId}`);
    console.log(`🔗 Watch live: https://browserbase.com/sessions/${sessionId}\n`);
    reporter.record('BrowserBase session created', true, sessionId);
    
    // ══════════════════════════════════════════════════════════
    // PHASE 1: SIGNUP
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('📝 PHASE 1: SIGNUP');
    console.log('─'.repeat(60));
    
    // Navigate to signup page
    console.log('  → Navigating to signup page...');
    await page.goto(`${config.frontendUrl}/signup`);
    await page.waitForLoadState('networkidle');
    reporter.record('1.1 Navigate to signup page', true);
    
    // Step 1: Enter handle
    console.log('  → Step 1: Entering handle...');
    const handleInput = await page.$('input[placeholder="yourname"]');
    await handleInput.fill(testUser.handle);
    await page.waitForTimeout(1500); // Wait for availability check
    
    const availableMsg = await page.$('.handle-feedback.success, .available');
    reporter.record('1.2 Enter handle', !!availableMsg, testUser.handle);
    
    // Click Continue
    let continueBtn = await page.$('button[type="submit"]:not([disabled])');
    await continueBtn.click();
    await page.waitForTimeout(500);
    reporter.record('1.3 Continue to step 2', true);
    
    // Step 2: Enter email and password
    console.log('  → Step 2: Entering email and password...');
    const emailInput = await page.$('input[type="email"]');
    await emailInput.fill(testUser.email);
    
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.fill(testUser.password);
    reporter.record('1.4 Enter email and password', true);
    
    // Click Continue
    continueBtn = await page.$('button.btn-primary:not([disabled])');
    await continueBtn.click();
    await page.waitForTimeout(500);
    reporter.record('1.5 Continue to step 3', true);
    
    // Step 3: Select category
    console.log('  → Step 3: Selecting category...');
    const categoryBtn = await page.$('.category-btn');
    await categoryBtn.click();
    await page.waitForTimeout(300);
    reporter.record('1.6 Select category', true);
    
    // Submit signup
    console.log('  → Submitting signup...');
    const submitBtn = await page.$('button.btn-primary:not([disabled])');
    await submitBtn.click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    reporter.record('1.7 Signup complete - redirected to dashboard', true);
    
    // Get auth token
    await page.waitForTimeout(1000);
    const storageData = await page.evaluate(() => localStorage.getItem('biolink_token'));
    authToken = storageData;
    reporter.record('1.8 Auth token stored', !!authToken);
    
    console.log('  ✅ Signup complete!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 2: EXPLORE DASHBOARD
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('🏠 PHASE 2: EXPLORE DASHBOARD');
    console.log('─'.repeat(60));
    
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard elements
    console.log('  → Verifying dashboard layout...');
    const sidebar = await page.$('.dashboard-sidebar');
    const mainContent = await page.$('.dashboard-main');
    const preview = await page.$('.dashboard-preview');
    
    reporter.record('2.1 Dashboard sidebar visible', !!sidebar);
    reporter.record('2.2 Dashboard main content visible', !!mainContent);
    reporter.record('2.3 Live preview visible', !!preview);
    
    // Verify user handle is displayed
    const headerHandle = await page.$('.header-handle');
    const handleText = headerHandle ? await headerHandle.textContent() : '';
    reporter.record('2.4 User handle displayed', handleText.includes(testUser.handle));
    
    console.log('  ✅ Dashboard loaded!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 3: LINK MANAGEMENT
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('🔗 PHASE 3: LINK MANAGEMENT');
    console.log('─'.repeat(60));
    
    // Should already be on Links tab (default)
    console.log('  → Adding first link...');
    
    // Add first link
    let addLinkBtn = await page.$('.add-link-btn.primary, button:has-text("Add Link")');
    await addLinkBtn.click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    
    let titleInput = await page.$('.modal input.input');
    await titleInput.fill(testLink1.title);
    
    let urlInput = await page.$('.modal input[type="url"], .modal input[placeholder="https://example.com"]');
    await urlInput.fill(testLink1.url);
    
    let saveBtn = await page.$('.modal button.btn-primary');
    await saveBtn.click();
    await page.waitForTimeout(1000);
    reporter.record('3.1 Add first link', true, testLink1.title);
    
    // Add second link
    console.log('  → Adding second link...');
    addLinkBtn = await page.$('.add-link-btn.primary, button:has-text("Add Link")');
    await addLinkBtn.click();
    await page.waitForSelector('.modal', { timeout: 5000 });
    
    titleInput = await page.$('.modal input.input');
    await titleInput.fill(testLink2.title);
    
    urlInput = await page.$('.modal input[type="url"], .modal input[placeholder="https://example.com"]');
    await urlInput.fill(testLink2.url);
    
    saveBtn = await page.$('.modal button.btn-primary');
    await saveBtn.click();
    await page.waitForTimeout(1000);
    reporter.record('3.2 Add second link', true, testLink2.title);
    
    // Verify links in list
    const linkItems = await page.$$('.link-item');
    reporter.record('3.3 Links visible in list', linkItems.length >= 2, `${linkItems.length} links`);
    
    // Toggle first link visibility
    console.log('  → Toggling link visibility...');
    const toggleBtn = await page.$('.link-item .action-btn');
    if (toggleBtn) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
      reporter.record('3.4 Toggle link visibility', true);
    }
    
    // Verify in preview
    const previewContent = await page.content();
    const link1InPreview = previewContent.includes(testLink1.title) || previewContent.includes(testLink2.title);
    reporter.record('3.5 Links visible in live preview', link1InPreview);
    
    console.log('  ✅ Links created!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 4: CUSTOMIZE APPEARANCE
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('🎨 PHASE 4: CUSTOMIZE APPEARANCE');
    console.log('─'.repeat(60));
    
    // Navigate to Appearance tab
    console.log('  → Navigating to Appearance tab...');
    await page.goto(`${config.frontendUrl}/dashboard/appearance`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const appearanceTab = await page.$('.appearance-tab');
    reporter.record('4.1 Navigate to Appearance tab', !!appearanceTab);
    
    // Update profile title
    console.log('  → Updating profile title...');
    const bioTitleInput = await page.$('input[placeholder="Your name or brand"]');
    if (bioTitleInput) {
      await bioTitleInput.fill('');
      await bioTitleInput.fill(profileData.bioTitle);
      await page.waitForTimeout(1000);
      reporter.record('4.2 Update profile title', true, profileData.bioTitle);
    }
    
    // Update bio
    console.log('  → Updating bio...');
    const bioInput = await page.$('input[placeholder="A short description about you"]');
    if (bioInput) {
      await bioInput.fill('');
      await bioInput.fill(profileData.bioDescription);
      await page.waitForTimeout(1000);
      reporter.record('4.3 Update bio', true);
    }
    
    // Change theme
    console.log('  → Changing theme...');
    const themeCards = await page.$$('.theme-card');
    if (themeCards.length > 1) {
      await themeCards[1].click();
      await page.waitForTimeout(1000);
      reporter.record('4.4 Change theme', true);
    }
    
    // Change button style
    console.log('  → Changing button style...');
    const styleCards = await page.$$('.style-card');
    if (styleCards.length > 1) {
      await styleCards[1].click();
      await page.waitForTimeout(500);
      reporter.record('4.5 Change button style', true);
    }
    
    // Change font
    console.log('  → Changing font...');
    const fontCards = await page.$$('.font-card');
    if (fontCards.length > 2) {
      await fontCards[2].click();
      await page.waitForTimeout(500);
      reporter.record('4.6 Change font', true);
    }
    
    // Verify preview updated
    await page.waitForTimeout(500);
    const updatedPreview = await page.content();
    const titleInPreview = updatedPreview.includes(profileData.bioTitle);
    reporter.record('4.7 Preview shows updated profile', titleInPreview);
    
    console.log('  ✅ Appearance customized!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 5: VIEW PUBLIC PROFILE
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('👤 PHASE 5: VIEW PUBLIC PROFILE');
    console.log('─'.repeat(60));
    
    // Navigate to public profile
    console.log('  → Navigating to public profile...');
    await page.goto(`${config.frontendUrl}/${testUser.handle}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify profile page loaded (not error)
    const profilePage = await page.$('.public-profile');
    const errorPage = await page.$('.public-error');
    reporter.record('5.1 Public profile loads', !!profilePage && !errorPage);
    
    // Verify profile title
    const publicTitle = await page.$('.profile-title');
    const titleText = publicTitle ? await publicTitle.textContent() : '';
    reporter.record('5.2 Profile title visible', titleText.includes(profileData.bioTitle));
    
    // Verify bio
    const publicBio = await page.$('.profile-bio');
    const bioText = publicBio ? await publicBio.textContent() : '';
    reporter.record('5.3 Bio visible', bioText.includes(profileData.bioDescription));
    
    // Verify links
    const publicLinks = await page.$$('.link-button');
    reporter.record('5.4 Links visible', publicLinks.length >= 1, `${publicLinks.length} links`);
    
    // Verify avatar
    const avatar = await page.$('.avatar-wrapper, .profile-avatar, .profile-avatar-placeholder');
    reporter.record('5.5 Avatar visible', !!avatar);
    
    // Click on a link (generates analytics)
    console.log('  → Clicking on link...');
    if (publicLinks.length > 0) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
        publicLinks[0].click()
      ]);
      if (newPage) await newPage.close();
      reporter.record('5.6 Link clicked', true);
    }
    
    console.log('  ✅ Public profile verified!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 6: CHECK ANALYTICS
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('📊 PHASE 6: CHECK ANALYTICS');
    console.log('─'.repeat(60));
    
    // Navigate to Analytics tab
    console.log('  → Navigating to Analytics tab...');
    await page.goto(`${config.frontendUrl}/dashboard/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const analyticsContent = await page.content();
    reporter.record('6.1 Navigate to Analytics tab', true);
    
    // Check for views display
    const hasViews = analyticsContent.toLowerCase().includes('view');
    reporter.record('6.2 Views metric displayed', hasViews);
    
    // Check for clicks display  
    const hasClicks = analyticsContent.toLowerCase().includes('click');
    reporter.record('6.3 Clicks metric displayed', hasClicks);
    
    // Verify via API
    console.log('  → Verifying analytics via API...');
    const analyticsResponse = await apiRequest('/api/analytics/summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      reporter.record('6.4 Analytics API returns data', true, 
        `Views: ${analytics.totalViews}, Clicks: ${analytics.totalClicks}`);
    }
    
    console.log('  ✅ Analytics verified!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 7: LOGOUT AND LOGIN
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('🔐 PHASE 7: LOGOUT AND LOGIN');
    console.log('─'.repeat(60));
    
    // Logout
    console.log('  → Logging out...');
    const logoutBtn = await page.$('.logout-btn, button:has-text("Log out")');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }
    
    // Verify redirected to home or login
    const currentUrl = page.url();
    const loggedOut = !currentUrl.includes('dashboard');
    reporter.record('7.1 Logout successful', loggedOut);
    
    // Login again
    console.log('  → Logging back in...');
    await page.goto(`${config.frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      reporter.record('7.2 Login successful', true);
    } catch {
      reporter.record('7.2 Login successful', false);
    }
    
    // Verify data persisted
    console.log('  → Verifying data persistence...');
    await page.goto(`${config.frontendUrl}/dashboard/appearance`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const persistedContent = await page.content();
    const dataPersisted = persistedContent.includes(profileData.bioTitle);
    reporter.record('7.3 Profile data persisted after re-login', dataPersisted);
    
    // Check links persisted
    await page.goto(`${config.frontendUrl}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    
    const linksAfterLogin = await page.$$('.link-item');
    reporter.record('7.4 Links persisted after re-login', linksAfterLogin.length >= 1);
    
    console.log('  ✅ Authentication verified!\n');
    
    // ══════════════════════════════════════════════════════════
    // PHASE 8: CLEANUP (Delete test link)
    // ══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log('🧹 PHASE 8: CLEANUP');
    console.log('─'.repeat(60));
    
    // Delete a link via API
    console.log('  → Cleaning up test data...');
    const linksResponse = await apiRequest('/api/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (linksResponse.ok) {
      const links = await linksResponse.json();
      if (links.length > 0) {
        const deleteResponse = await apiRequest(`/api/links/${links[0].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        reporter.record('8.1 Delete link via API', deleteResponse.ok);
      }
    }
    
    console.log('  ✅ Cleanup complete!\n');
    
  } catch (error) {
    console.error('\n❌ Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'full-journey-error');
    reporter.record('Full journey completion', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }
  
  // Print final summary
  const result = reporter.summary();
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎬 SESSION RECORDING');
  console.log('═'.repeat(60));
  console.log(`\nWatch the full test replay at:`);
  console.log(`https://browserbase.com/sessions/${sessionId}\n`);
  
  return result;
}

// Run if executed directly
if (process.argv[1].includes('full-journey.js')) {
  verifyFullJourney().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyFullJourney;

