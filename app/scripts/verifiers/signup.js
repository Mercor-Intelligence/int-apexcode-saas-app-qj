/**
 * Browser Verification Script: User Signup Flow
 * 
 * Actions:
 * 1. Navigate to landing page
 * 2. Click "Get Started" / "Sign Up" button
 * 3. Fill in email, password, and handle
 * 4. Submit the form
 * 
 * Verifications:
 * - User is redirected to dashboard
 * - Dashboard displays user's handle
 * - User record exists in database (via API check)
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifySignup() {
  const reporter = new Reporter('Signup Verification');
  let browser, page;
  
  // Generate unique test user for this run
  const testUser = {
    email: `signup-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `signuptest${Date.now()}`
  };
  
  console.log('\n🚀 Starting Signup Verification...\n');
  console.log(`Test User: ${testUser.email} / @${testUser.handle}\n`);
  
  try {
    // Launch browser
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    
    // === Step 1: Navigate to landing page ===
    console.log('Step 1: Navigate to landing page');
    await page.goto(config.frontendUrl);
    await page.waitForLoadState('networkidle');
    
    const landingLoaded = await page.title();
    reporter.record('Landing page loads', !!landingLoaded, `Title: ${landingLoaded}`);
    
    // === Step 2: Click Sign Up button ===
    console.log('Step 2: Click Sign Up button');
    
    // Try different possible selectors for signup button
    const signupSelectors = [
      'text=Get Started',
      'text=Sign Up',
      'text=Claim Your Handle',
      'a[href="/signup"]',
      'button:has-text("Sign")',
      '.cta-button'
    ];
    
    let clicked = false;
    for (const selector of signupSelectors) {
      try {
        await page.click(selector, { timeout: 3000 });
        clicked = true;
        break;
      } catch {
        continue;
      }
    }
    
    reporter.record('Navigate to signup page', clicked);
    
    if (!clicked) {
      // Direct navigation fallback
      await page.goto(`${config.frontendUrl}/signup`);
    }
    
    await page.waitForLoadState('networkidle');
    
    // === Step 3: Fill signup form ===
    console.log('Step 3: Fill signup form');
    
    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill email
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (emailInput) {
      await emailInput.fill(testUser.email);
      reporter.record('Fill email field', true);
    } else {
      reporter.record('Fill email field', false, 'Email input not found');
    }
    
    // Fill password
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.fill(testUser.password);
      reporter.record('Fill password field', true);
    } else {
      reporter.record('Fill password field', false, 'Password input not found');
    }
    
    // Fill handle
    const handleInput = await page.$('input[name="handle"], input[placeholder*="handle" i], input[placeholder*="username" i]');
    if (handleInput) {
      await handleInput.fill(testUser.handle);
      reporter.record('Fill handle field', true);
    } else {
      reporter.record('Fill handle field', false, 'Handle input not found');
    }
    
    // === Step 4: Submit form ===
    console.log('Step 4: Submit signup form');
    
    const submitButton = await page.$('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create")');
    if (submitButton) {
      await submitButton.click();
      reporter.record('Submit signup form', true);
    } else {
      // Try pressing Enter as fallback
      await page.keyboard.press('Enter');
      reporter.record('Submit signup form', true, 'Used Enter key');
    }
    
    // === Step 5: Verify redirect to dashboard ===
    console.log('Step 5: Verify redirect to dashboard');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      reporter.record('Redirected to dashboard', true);
    } catch {
      const currentUrl = page.url();
      reporter.record('Redirected to dashboard', false, `Current URL: ${currentUrl}`);
    }
    
    // === Step 6: Verify dashboard shows user info ===
    console.log('Step 6: Verify dashboard content');
    
    await page.waitForLoadState('networkidle');
    const pageContent = await page.content();
    const handleVisible = pageContent.toLowerCase().includes(testUser.handle.toLowerCase());
    reporter.record('Dashboard displays user handle', handleVisible);
    
    // === Step 7: Verify user exists in database via API ===
    console.log('Step 7: Verify user record in database');
    
    try {
      const response = await apiRequest(`/api/auth/check-handle/${testUser.handle}`);
      const data = await response.json();
      // Handle should NOT be available (because user was created)
      const userExists = data.available === false || data.exists === true;
      reporter.record('User record exists in database', userExists, JSON.stringify(data));
    } catch (error) {
      reporter.record('User record exists in database', false, error.message);
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'signup-error');
    reporter.record('Signup flow completion', false, error.message);
  } finally {
    await closeBrowser(browser);
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

