/**
 * BrowserBase Verification Script: Network Intercept (Robustness)
 * 
 * Actions:
 * 1. Create test user via API
 * 2. Navigate to login page and sign in
 * 3. (Optional) Intercept /api/profile to simulate failure
 * 
 * Verifications:
 * - Dashboard loads normally by default
 * - When enabled, failure injection surfaces fallback UI
 */

import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../../utils/browser.js';
import { config } from '../../config.js';
import Reporter from '../../utils/reporter.js';

async function verifyNetworkIntercept() {
  const reporter = new Reporter('Network Intercept Verification');
  let browser, page, sessionId;

  const testUser = {
    email: `intercept-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `intercept${Date.now()}`
  };
  const injectFailure = process.env.NETWORK_INTERCEPT_MODE === 'fail';

  console.log('\n🚀 Starting Network Intercept Verification (BrowserBase)...\n');
  console.log(`Test User: ${testUser.email}`);
  console.log(`Mode: ${injectFailure ? 'FAILURE INJECTION' : 'OBSERVE (normal)'}\n`);

  try {
    console.log('Setup: Create test user via API');
    const signupResponse = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    if (signupResponse.ok) {
      reporter.record('Test user created via API', true);
    } else {
      const errorText = await signupResponse.text();
      reporter.record('Test user created via API', false, errorText);
    }

    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;

    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);

    console.log('Step 1: Navigate to login page');
    await page.goto(`${config.frontendUrl}/login`);
    await page.waitForLoadState('networkidle');

    reporter.record('Login page loads', true);

    if (injectFailure) {
      console.log('Step 2: Set network intercept for profile request');
      await page.route('**/api/profile**', async (route) => {
        await route.fulfill({
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Injected failure' })
        });
      });
      reporter.record('Injected 500 for /api/profile', true);
    } else {
      reporter.record('Network intercept mode', true, 'observe');
    }

    console.log('Step 3: Fill login form');
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.fill(testUser.email);
      reporter.record('Fill email field', true);
    } else {
      reporter.record('Fill email field', false, 'Email input not found');
    }

    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.fill(testUser.password);
      reporter.record('Fill password field', true);
    } else {
      reporter.record('Fill password field', false, 'Password input not found');
    }

    const submitButton = await page.$('button[type="submit"], button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")');
    if (submitButton) {
      await submitButton.click();
      reporter.record('Submit login form', true);
    } else {
      await page.keyboard.press('Enter');
      reporter.record('Submit login form', true, 'Used Enter key');
    }

    console.log('Step 4: Verify dashboard renders');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    const dashboardLoaded = await page.$('.dashboard');
    reporter.record('Dashboard loads', !!dashboardLoaded);

    if (injectFailure) {
      const placeholder = await page.$('.preview-link.placeholder');
      const placeholderText = placeholder ? await placeholder.textContent() : '';
      const hasFallback = placeholderText?.toLowerCase().includes('your links appear here');
      reporter.record(
        'Fallback preview appears when profile fetch fails',
        Boolean(placeholder && hasFallback),
        placeholderText || 'Placeholder not found'
      );
    } else {
      const preview = await page.$('.profile-preview');
      reporter.record('Profile preview renders', Boolean(preview));
    }

  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'network-intercept-error');
    reporter.record('Network intercept flow completion', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }

  return reporter.summary();
}

if (process.argv[1].includes('network-intercept.js')) {
  verifyNetworkIntercept().then((result) => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyNetworkIntercept;

