/**
 * Browser Verification Script: User Login Flow
 * 
 * Actions:
 * 1. Create a test user via API (setup)
 * 2. Navigate to login page
 * 3. Fill in email and password
 * 4. Submit the form
 * 
 * Verifications:
 * - User is redirected to dashboard
 * - Dashboard is accessible with authenticated session
 * - JWT token is stored (localStorage/cookie)
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyLogin() {
  const reporter = new Reporter('Login Verification');
  let browser, page;
  
  // Test user credentials
  const testUser = {
    email: `login-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `logintest${Date.now()}`
  };
  
  console.log('\n🚀 Starting Login Verification...\n');
  console.log(`Test User: ${testUser.email}\n`);
  
  try {
    // === Setup: Create test user via API ===
    console.log('Setup: Create test user via API');
    
    try {
      const signupResponse = await apiRequest('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(testUser)
      });
      
      if (signupResponse.ok) {
        reporter.record('Test user created via API', true);
      } else {
        const error = await signupResponse.text();
        reporter.record('Test user created via API', false, error);
      }
    } catch (error) {
      reporter.record('Test user created via API', false, error.message);
    }
    
    // Launch browser
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    
    // === Step 1: Navigate to login page ===
    console.log('Step 1: Navigate to login page');
    await page.goto(`${config.frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    const loginPageLoaded = await page.$('form');
    reporter.record('Login page loads', !!loginPageLoaded);
    
    // === Step 2: Fill login form ===
    console.log('Step 2: Fill login form');
    
    // Fill email
    const emailInput = await page.$('input[type="email"], input[name="email"]');
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
    
    // === Step 3: Submit form ===
    console.log('Step 3: Submit login form');
    
    const submitButton = await page.$('button[type="submit"], button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")');
    if (submitButton) {
      await submitButton.click();
      reporter.record('Submit login form', true);
    } else {
      await page.keyboard.press('Enter');
      reporter.record('Submit login form', true, 'Used Enter key');
    }
    
    // === Step 4: Verify redirect to dashboard ===
    console.log('Step 4: Verify redirect to dashboard');
    
    try {
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      reporter.record('Redirected to dashboard', true);
    } catch {
      const currentUrl = page.url();
      reporter.record('Redirected to dashboard', false, `Current URL: ${currentUrl}`);
    }
    
    // === Step 5: Verify JWT token is stored ===
    console.log('Step 5: Verify authentication token');
    
    const localStorage = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      };
    });
    
    const hasToken = !!localStorage.token;
    reporter.record('JWT token stored in localStorage', hasToken);
    
    // === Step 6: Verify dashboard content is accessible ===
    console.log('Step 6: Verify dashboard content is accessible');
    
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard elements
    const dashboardElements = await page.$$('.dashboard, .links-tab, [class*="dashboard"], [class*="tab"]');
    reporter.record('Dashboard content loads', dashboardElements.length > 0, `Found ${dashboardElements.length} dashboard elements`);
    
    // === Step 7: Verify protected API access ===
    console.log('Step 7: Verify protected API access');
    
    if (localStorage.token) {
      try {
        const profileResponse = await apiRequest('/api/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.token}`
          }
        });
        reporter.record('Protected API accessible with token', profileResponse.ok);
      } catch (error) {
        reporter.record('Protected API accessible with token', false, error.message);
      }
    } else {
      reporter.record('Protected API accessible with token', false, 'No token available');
    }
    
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'login-error');
    reporter.record('Login flow completion', false, error.message);
  } finally {
    await closeBrowser(browser);
  }
  
  return reporter.summary();
}

// Run if executed directly
if (process.argv[1].includes('login.js')) {
  verifyLogin().then(result => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyLogin;

