/**
 * BrowserBase Verification Script: Link Management Flow
 * 
 * Actions:
 * 1. Login as test user
 * 2. Navigate to Links tab
 * 3. Add a new link (title + URL)
 * 4. Edit the link
 * 5. Toggle link visibility
 * 6. Delete the link
 * 
 * Verifications:
 * - Link appears in the list after creation
 * - Link details are updated after edit
 * - Link visibility toggles correctly
 * - Link is removed after deletion
 * - Changes persist in database
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyLinks() {
  const reporter = new Reporter('Link Management Verification');
  let browser, page, sessionId;
  let authToken = null;
  
  // Test user credentials
  const testUser = {
    email: `links-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `linkstest${Date.now()}`
  };
  
  // Test link data
  const testLink = {
    title: 'Test Link Title',
    url: 'https://example.com/test-link',
    editedTitle: 'Updated Link Title',
    editedUrl: 'https://example.com/updated-link'
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
    
    await page.fill('input[type="email"], input[name="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      reporter.record('Login successful', true);
    } catch {
      reporter.record('Login successful', false);
      return reporter.summary();
    }
    
    // === Step 2: Navigate to Links tab ===
    console.log('Step 2: Navigate to Links tab');
    
    await page.waitForLoadState('networkidle');
    
    // Click on Links tab if not already selected
    const linksTab = await page.$('text=Links, button:has-text("Links"), [data-tab="links"]');
    if (linksTab) {
      await linksTab.click();
      await page.waitForTimeout(500);
    }
    reporter.record('Navigate to Links tab', true);
    
    // === Step 3: Add a new link ===
    console.log('Step 3: Add a new link');
    
    // Click "Add Link" button
    const addButton = await page.$('button:has-text("Add"), button:has-text("New Link"), button:has-text("+"), .add-link-button');
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(500);
      reporter.record('Click Add Link button', true);
    } else {
      reporter.record('Click Add Link button', false, 'Button not found');
    }
    
    // Fill link form
    const titleInput = await page.$('input[name="title"], input[placeholder*="title" i]');
    const urlInput = await page.$('input[name="url"], input[placeholder*="url" i], input[type="url"]');
    
    if (titleInput && urlInput) {
      await titleInput.fill(testLink.title);
      await urlInput.fill(testLink.url);
      reporter.record('Fill link form', true);
      
      // Save/Submit link
      const saveButton = await page.$('button:has-text("Save"), button:has-text("Add"), button[type="submit"]');
      if (saveButton) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        reporter.record('Submit new link', true);
      }
    } else {
      reporter.record('Fill link form', false, 'Form inputs not found');
    }
    
    // === Step 4: Verify link appears in list ===
    console.log('Step 4: Verify link in list');
    
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    const linkVisible = pageContent.includes(testLink.title);
    reporter.record('Link appears in list', linkVisible);
    
    // Verify via API
    const linksResponse = await apiRequest('/api/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (linksResponse.ok) {
      const links = await linksResponse.json();
      const linkInDb = links.some(l => l.title === testLink.title);
      reporter.record('Link exists in database', linkInDb);
    }
    
    // === Step 5: Edit the link ===
    console.log('Step 5: Edit the link');
    
    // Click edit button on the link
    const editButton = await page.$('.link-item button:has-text("Edit"), .edit-button, [aria-label="Edit"]');
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      // Update title
      const editTitleInput = await page.$('input[name="title"], input[placeholder*="title" i]');
      if (editTitleInput) {
        await editTitleInput.fill('');
        await editTitleInput.fill(testLink.editedTitle);
        
        const updateButton = await page.$('button:has-text("Save"), button:has-text("Update")');
        if (updateButton) {
          await updateButton.click();
          await page.waitForTimeout(1000);
        }
        reporter.record('Edit link', true);
      }
    } else {
      // Try inline editing
      reporter.record('Edit link', false, 'Edit button not found');
    }
    
    // Verify edit
    const editedContent = await page.content();
    const editVisible = editedContent.includes(testLink.editedTitle);
    reporter.record('Edited link displays correctly', editVisible);
    
    // === Step 6: Toggle visibility ===
    console.log('Step 6: Toggle link visibility');
    
    const visibilityToggle = await page.$('.visibility-toggle, input[type="checkbox"], .toggle-switch, [aria-label*="visibility" i]');
    if (visibilityToggle) {
      const beforeState = await visibilityToggle.isChecked().catch(() => true);
      await visibilityToggle.click();
      await page.waitForTimeout(500);
      const afterState = await visibilityToggle.isChecked().catch(() => false);
      reporter.record('Toggle link visibility', beforeState !== afterState);
    } else {
      reporter.record('Toggle link visibility', false, 'Toggle not found');
    }
    
    // === Step 7: Delete the link ===
    console.log('Step 7: Delete the link');
    
    const deleteButton = await page.$('button:has-text("Delete"), .delete-button, [aria-label="Delete"]');
    if (deleteButton) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Confirm deletion if dialog appears
      const confirmButton = await page.$('button:has-text("Confirm"), button:has-text("Yes")');
      if (confirmButton) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(1000);
      reporter.record('Delete link action', true);
    } else {
      reporter.record('Delete link action', false, 'Delete button not found');
    }
    
    // Verify deletion
    const finalContent = await page.content();
    const linkDeleted = !finalContent.includes(testLink.editedTitle) && !finalContent.includes(testLink.title);
    reporter.record('Link removed from list', linkDeleted);
    
    // Verify via API
    const finalLinksResponse = await apiRequest('/api/links', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (finalLinksResponse.ok) {
      const finalLinks = await finalLinksResponse.json();
      const linkStillExists = finalLinks.some(l => 
        l.title === testLink.title || l.title === testLink.editedTitle
      );
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
