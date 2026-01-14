/**
 * Generic Public Profile Verification
 * 
 * Tests that public profiles work without assuming specific implementation.
 */

import { launchBrowser, closeBrowser } from '../utils/browser.js';
import { Reporter } from '../utils/browser.js';
import { config } from '../../config.js';

export default async function verifyProfile() {
  const timestamp = Date.now();
  const testHandle = `profuser${timestamp}`.slice(0, 20);
  const testEmail = `profile-gen-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n🚀 Starting Generic Profile Verification...\n');
  console.log(`Test Handle: @${testHandle}\n`);
  
  const report = new Reporter('Generic Profile Verification');
  let browser, page, sessionId, sessionUrl;
  
  try {
    // Setup: Create test user via API
    console.log('Setup: Creating test user');
    let userCreated = false;
    
    const signupEndpoints = ['/api/auth/signup', '/api/auth/register', '/api/signup', '/api/register'];
    
    for (const endpoint of signupEndpoints) {
      try {
        const response = await fetch(`${config.frontendUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: testEmail, 
            password: testPassword, 
            handle: testHandle,
            name: 'Test Profile User'
          })
        });
        
        if (response.ok || response.status === 201) {
          userCreated = true;
          report.record('Test user created', true);
          break;
        }
      } catch (e) {}
    }
    
    if (!userCreated) {
      report.record('Test user created', false, 'Could not create test user');
    }
    
    // Create browser session
    const session = await launchBrowser();
    browser = session.browser;
    page = session.page;
    sessionId = session.sessionId;
    sessionUrl = session.debugUrl;
    
    report.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // Step 1: Visit public profile page
    console.log('Step 1: Visit public profile page');
    const profileUrl = `${config.frontendUrl}/${testHandle}`;
    await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    const isOnProfile = currentUrl.includes(testHandle) || currentUrl.includes('profile');
    report.record('Profile page accessible', isOnProfile || !userCreated, 
      isOnProfile ? `Loaded: ${currentUrl}` : (userCreated ? 'Could not load profile' : 'Expected: no user'));
    
    // Step 2: Check profile content
    console.log('Step 2: Check profile content');
    const profileContent = await page.evaluate((handle) => {
      const pageText = document.body.innerText.toLowerCase();
      const html = document.body.innerHTML.toLowerCase();
      
      return {
        hasHandle: pageText.includes(handle.toLowerCase()) || html.includes(handle.toLowerCase()),
        hasProfileSection: !!document.querySelector('[class*="profile"], [class*="bio"], [class*="user"]'),
        hasLinks: document.querySelectorAll('a[href^="http"]').length > 0 || 
                  !!document.querySelector('[class*="link"]'),
        is404: pageText.includes('not found') || pageText.includes('404') || pageText.includes('does not exist'),
        hasAvatar: !!document.querySelector('img[class*="avatar"], img[class*="profile"], img[alt*="avatar"]')
      };
    }, testHandle);
    
    if (userCreated) {
      report.record('Profile shows handle', profileContent.hasHandle);
      report.record('Profile section exists', profileContent.hasProfileSection || profileContent.hasHandle);
    } else {
      // If no user created, 404 is expected
      report.record('404 for non-existent user', profileContent.is404, 
        profileContent.is404 ? 'Correctly shows 404' : 'Did not show 404 as expected');
    }
    
    // Step 3: Test 404 for non-existent profile
    console.log('Step 3: Test 404 handling');
    const fakeHandle = `nonexistent${Date.now()}`;
    await page.goto(`${config.frontendUrl}/${fakeHandle}`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);
    
    const is404 = await page.evaluate(() => {
      const pageText = document.body.innerText.toLowerCase();
      const statusCode = document.querySelector('meta[name="status"]')?.content;
      return pageText.includes('not found') || pageText.includes('404') || 
             pageText.includes('does not exist') || pageText.includes("doesn't exist") ||
             statusCode === '404';
    });
    
    report.record('404 for non-existent profile', is404, 
      is404 ? 'Correctly returns 404' : 'Should return 404 for non-existent user');
    
    // Step 4: Check profile page performance
    console.log('Step 4: Check page performance');
    if (userCreated) {
      const startTime = Date.now();
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      const loadTime = Date.now() - startTime;
      
      const isPerformant = loadTime < 3000; // Should load within 3 seconds
      report.record('Profile loads quickly', isPerformant, `Load time: ${loadTime}ms`);
    }
    
    console.log(`  ✅ Session completed: ${sessionUrl}`);
    
  } catch (error) {
    console.error('Profile verification error:', error.message);
    report.record('Profile verification', false, error.message);
  } finally {
    if (browser) {
      await closeBrowser(browser, sessionId);
    }
  }
  
  const results = report.summary();
  results.sessionUrl = sessionUrl;
  return results;
}
