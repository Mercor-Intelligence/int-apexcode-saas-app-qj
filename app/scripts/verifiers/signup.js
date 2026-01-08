/**
 * BrowserBase Verification Script: User Signup Flow
 * 
 * Actions:
 * 1. Navigate to signup page
 * 2. Step 1: Enter handle and continue
 * 3. Step 2: Enter email and password, continue
 * 4. Step 3: Select category and submit
 * 
 * Verifications:
 * - User is redirected to dashboard
 * - User record exists in database (via API check)
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifySignup() {
  const reporter = new Reporter('Signup Verification');
  let browser, page, sessionId;
  
  // Generate unique test user for this run
  const testUser = {
    email: `signup-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `test${Date.now().toString().slice(-8)}`
  };
  
  console.log('\n🚀 Starting Signup Verification (BrowserBase)...\n');
  console.log(`Test User: ${testUser.email} / @${testUser.handle}\n`);
  
  try {
    // Launch BrowserBase session
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // === Step 1: Navigate to signup page ===
    console.log('Step 1: Navigate to signup page');
    await page.goto(`${config.frontendUrl}/signup`);
    await page.waitForLoadState('networkidle');
    
    const signupLoaded = await page.$('form');
    reporter.record('Signup page loads', !!signupLoaded);
    
    // === Step 2: Enter handle (Step 1 of form) ===
    console.log('Step 2: Enter handle');
    
    // Find the handle input (placeholder="yourname")
    const handleInput = await page.$('input[placeholder="yourname"]');
    if (handleInput) {
      await handleInput.fill(testUser.handle);
      reporter.record('Fill handle field', true);
      
      // Wait for availability check
      await page.waitForTimeout(1500);
      
      // Check if handle is available
      const availableMsg = await page.$('.handle-feedback.success, .available');
      if (availableMsg) {
        reporter.record('Handle is available', true);
      } else {
        reporter.record('Handle is available', false, 'May be taken');
      }
      
      // Click Continue button
      const continueBtn = await page.$('button[type="submit"]:not([disabled])');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(500);
        reporter.record('Continue to step 2', true);
      }
    } else {
      reporter.record('Fill handle field', false, 'Handle input not found');
    }
    
    // === Step 3: Enter email and password (Step 2 of form) ===
    console.log('Step 3: Enter email and password');
    
    await page.waitForTimeout(500);
    
    // Fill email
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill(testUser.email);
      reporter.record('Fill email field', true);
    } else {
      reporter.record('Fill email field', false, 'Email input not found');
    }
    
    // Fill password
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill(testUser.password);
      reporter.record('Fill password field', true);
    } else {
      reporter.record('Fill password field', false, 'Password input not found');
    }
    
    // Click Continue button
    await page.waitForTimeout(300);
    const continueBtn2 = await page.$('button.btn-primary:not([disabled])');
    if (continueBtn2) {
      await continueBtn2.click();
      await page.waitForTimeout(500);
      reporter.record('Continue to step 3', true);
    }
    
    // === Step 4: Select category (Step 3 of form) ===
    console.log('Step 4: Select category');
    
    await page.waitForTimeout(500);
    
    // Click first category button
    const categoryBtn = await page.$('.category-btn');
    if (categoryBtn) {
      await categoryBtn.click();
      await page.waitForTimeout(300);
      reporter.record('Select category', true);
    } else {
      reporter.record('Select category', false, 'Category buttons not found');
    }
    
    // === Step 5: Submit form ===
    console.log('Step 5: Submit signup form');
    
    const submitBtn = await page.$('button.btn-primary:not([disabled])');
    if (submitBtn) {
      await submitBtn.click();
      reporter.record('Submit signup form', true);
    } else {
      reporter.record('Submit signup form', false, 'Submit button not found or disabled');
    }
    
    // === Step 6: Verify redirect to dashboard ===
    console.log('Step 6: Verify redirect to dashboard');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 15000 });
      reporter.record('Redirected to dashboard', true);
    } catch {
      const currentUrl = page.url();
      reporter.record('Redirected to dashboard', false, `Current URL: ${currentUrl}`);
    }
    
    // === Step 7: Verify user exists in database via API ===
    console.log('Step 7: Verify user record in database');
    
    await page.waitForTimeout(1000);
    
    try {
      const response = await apiRequest(`/api/auth/check-handle/${testUser.handle}`);
      const data = await response.json();
      // Handle should NOT be available (because user was created)
      const userExists = data.available === false;
      reporter.record('User record exists in database', userExists, JSON.stringify(data));
    } catch (error) {
      reporter.record('User record exists in database', false, error.message);
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'signup-error');
    reporter.record('Signup flow completion', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }
  
  return reporter.summary();
}

// Run if executed directly
if (process.argv[1].includes('signup.js')) {
  verifySignup().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifySignup;
