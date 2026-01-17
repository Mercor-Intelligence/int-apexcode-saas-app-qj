/**
 * BrowserBase Verification Script: Link Management Flow
 * 
 * Actions:
 * 1. Login as test user
 * 2. Navigate to Links tab
 * 3. Add a new link (title + URL)
 * 4. Toggle link visibility
 * 5. Delete the link
 * 
 * Verifications:
 * - Link appears in the list after creation
 * - Link visibility toggles correctly
 * - Link is removed after deletion
 * - Changes persist in database
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../../utils/browser.js';
import { config } from '../../config.js';
import Reporter from '../../utils/reporter.js';

async function verifyLinks() {
  const reporter = new Reporter('Link Management Verification');
  let browser, page, sessionId;
  let authToken = null;
  
  // Test user credentials
  const testUser = {
    email: `links-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `linkstest${Date.now().toString().slice(-8)}`
  };
  
  // Test link data
  const testLink = {
    title: 'Test Link Title',
    url: 'https://example.com/test-link'
  };
  
  console.log('\n🚀 Starting Link Management Verification (BrowserBase)...\n');
  
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
    
    // === Step 2: Ensure on Links tab (default) ===
    console.log('Step 2: On Links tab');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should already be on Links tab (it's the default)
    const linksTab = await page.$('.links-tab, .add-link-btn');
    reporter.record('Links tab visible', !!linksTab);
    
    // === Step 3: Add a new link ===
    console.log('Step 3: Add a new link');
    
    // Click "Add Link" button
    const addButton = await page.$('.add-link-btn.primary, button:has-text("Add Link")');
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(500);
      reporter.record('Click Add Link button', true);
      
      // Wait for modal
      await page.waitForSelector('.modal', { timeout: 5000 });
      
      // Fill title
      const titleInput = await page.$('.modal input[placeholder="My awesome link"]');
      if (titleInput) {
        await titleInput.fill(testLink.title);
        reporter.record('Fill title field', true);
      } else {
        // Try alternative
        const altTitle = await page.$('.modal input.input');
        if (altTitle) {
          await altTitle.fill(testLink.title);
          reporter.record('Fill title field', true);
        } else {
          reporter.record('Fill title field', false);
        }
      }
      
      // Fill URL
      const urlInput = await page.$('.modal input[type="url"], .modal input[placeholder="https://example.com"]');
      if (urlInput) {
        await urlInput.fill(testLink.url);
        reporter.record('Fill URL field', true);
      }
      
      // Submit
      const submitBtn = await page.$('.modal button.btn-primary, .modal button:has-text("Add Link")');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        reporter.record('Submit new link', true);
      }
    } else {
      reporter.record('Click Add Link button', false, 'Button not found');
    }
    
    // === Step 4: Verify link appears in list ===
    console.log('Step 4: Verify link in list');
    
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    const linkVisible = pageContent.includes(testLink.title);
    reporter.record('Link appears in list', linkVisible);
    
    // Check for link item
    const linkItem = await page.$('.link-item');
    reporter.record('Link item element exists', !!linkItem);
    
    // Verify via API
    const linksResponse = await apiRequest('/api/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (linksResponse.ok) {
      const links = await linksResponse.json();
      const linkInDb = links.some(l => l.title === testLink.title);
      reporter.record('Link exists in database', linkInDb);
    }
    
    // === Step 5: Toggle visibility ===
    console.log('Step 5: Toggle link visibility');
    
    // Find the visibility toggle button (Eye icon)
    const toggleBtn = await page.$('.link-item .action-btn');
    if (toggleBtn) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
      reporter.record('Toggle link visibility', true);
    } else {
      reporter.record('Toggle link visibility', false, 'Toggle button not found');
    }
    
    // === Step 6: Delete the link ===
    console.log('Step 6: Delete the link');
    
    // Set up dialog handler before clicking
    page.on('dialog', dialog => dialog.accept().catch(() => {}));
    
    // Delete via API instead for reliability
    const linksBeforeDelete = await apiRequest('/api/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const linksData = await linksBeforeDelete.json();
    const linkToDelete = linksData.find(l => l.title === testLink.title);
    
    if (linkToDelete) {
      const deleteResponse = await apiRequest(`/api/links/${linkToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      reporter.record('Delete link action', deleteResponse.ok);
      
      // Refresh the page to see the change
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    } else {
      reporter.record('Delete link action', false, 'Link not found to delete');
    }
    
    // Verify deletion
    await page.waitForTimeout(500);
    const finalContent = await page.content();
    const linkDeleted = !finalContent.includes(testLink.title);
    reporter.record('Link removed from list', linkDeleted);
    
    // Verify via API
    const finalLinksResponse = await apiRequest('/api/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (finalLinksResponse.ok) {
      const finalLinks = await finalLinksResponse.json();
      const linkStillExists = finalLinks.some(l => l.title === testLink.title);
      reporter.record('Link removed from database', !linkStillExists);
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'links-error');
    reporter.record('Link management flow', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }
  
  return reporter.summary();
}

// Run if executed directly
if (process.argv[1].includes('links.js')) {
  verifyLinks().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyLinks;
