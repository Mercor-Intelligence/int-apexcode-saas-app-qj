/**
 * Password Validation Verification
 * 
 * Tests from Knowledge Base:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Password strength indicator during signup
 */

import Browserbase from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import { config } from '../config.js';

const bb = new Browserbase({ apiKey: config.browserbase.apiKey });

export default async function verifyPasswordValidation() {
  const results = {
    suite: 'Password Validation',
    tests: [],
    total: 0,
    passed: 0,
    failed: 0,
    overallPassed: false,
    sessionUrl: null
  };

  const startTime = Date.now();

  function logResult(test, passed, details = '') {
    results.tests.push({ test, passed, details, timestamp: new Date().toISOString() });
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`  ✅ PASS: ${test}${details ? ' - ' + details : ''}`);
    } else {
      results.failed++;
      console.log(`  ❌ FAIL: ${test}${details ? ' - ' + details : ''}`);
    }
  }

  console.log('\n🚀 Starting Password Validation Verification (BrowserBase)...\n');

  let session, browser, context, page;

  try {
    // Create BrowserBase session
    console.log('  🌐 Creating BrowserBase session...');
    session = await bb.sessions.create({ projectId: config.browserbase.projectId });
    console.log(`  📍 Session ID: ${session.id}`);
    results.sessionUrl = `https://browserbase.com/sessions/${session.id}`;
    console.log(`  🔗 Debug URL: ${results.sessionUrl}`);
    logResult('BrowserBase session created', true, `Session: ${session.id}`);

    browser = await chromium.connectOverCDP(session.connectUrl);
    context = browser.contexts()[0];
    page = context.pages()[0];
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to signup page
    console.log('Step 1: Navigate to signup page');
    await page.goto(`${config.frontendUrl}/signup`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    logResult('Signup page loads', true);

    // Enter a valid handle first to proceed to email/password step
    console.log('Step 2: Enter handle to proceed');
    const handleInput = await page.$('input[type="text"]');
    if (handleInput) {
      await handleInput.fill(`pwtest${Date.now()}`);
      await page.waitForTimeout(500);
      
      // Click continue to go to next step
      const continueBtn = await page.$('button:has-text("Continue"), button:has-text("Next")');
      if (continueBtn) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // Test 1: Password too short (less than 8 chars)
    console.log('Step 3: Test password too short');
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('Abc123'); // Only 6 chars
      await page.waitForTimeout(500);
      
      // Check for error message or validation feedback
      const errorMsg = await page.$('.error, .invalid, [class*="error"], [class*="invalid"]');
      const hasError = !!errorMsg;
      logResult('Rejects password under 8 characters', hasError, hasError ? 'Validation shown' : 'No validation error');
      
      // Clear and test next
      await passwordInput.fill('');
    } else {
      logResult('Rejects password under 8 characters', false, 'Password input not found');
    }

    // Test 2: Password without uppercase
    console.log('Step 4: Test password without uppercase');
    if (passwordInput) {
      await passwordInput.fill('abcdefg123'); // No uppercase
      await page.waitForTimeout(500);
      
      const errorMsg = await page.$('.error, .invalid, [class*="error"], [class*="weak"]');
      const hasError = !!errorMsg;
      logResult('Rejects password without uppercase', hasError, hasError ? 'Validation shown' : 'No validation error');
      
      await passwordInput.fill('');
    } else {
      logResult('Rejects password without uppercase', false, 'Password input not found');
    }

    // Test 3: Password without lowercase
    console.log('Step 5: Test password without lowercase');
    if (passwordInput) {
      await passwordInput.fill('ABCDEFG123'); // No lowercase
      await page.waitForTimeout(500);
      
      const errorMsg = await page.$('.error, .invalid, [class*="error"], [class*="weak"]');
      const hasError = !!errorMsg;
      logResult('Rejects password without lowercase', hasError, hasError ? 'Validation shown' : 'No validation error');
      
      await passwordInput.fill('');
    } else {
      logResult('Rejects password without lowercase', false, 'Password input not found');
    }

    // Test 4: Password without number
    console.log('Step 6: Test password without number');
    if (passwordInput) {
      await passwordInput.fill('Abcdefghij'); // No number
      await page.waitForTimeout(500);
      
      const errorMsg = await page.$('.error, .invalid, [class*="error"], [class*="weak"]');
      const hasError = !!errorMsg;
      logResult('Rejects password without number', hasError, hasError ? 'Validation shown' : 'No validation error');
      
      await passwordInput.fill('');
    } else {
      logResult('Rejects password without number', false, 'Password input not found');
    }

    // Test 5: Valid password accepted
    console.log('Step 7: Test valid password');
    if (passwordInput) {
      await passwordInput.fill('ValidPass123'); // Valid: 12 chars, upper, lower, number
      await page.waitForTimeout(500);
      
      // Check for success indicator or no error
      const errorMsg = await page.$('.error:visible, .invalid:visible');
      const strengthIndicator = await page.$('[class*="strength"], [class*="meter"], .password-strength');
      const hasStrengthIndicator = !!strengthIndicator;
      
      logResult('Accepts valid password', !errorMsg, 'No validation error');
      logResult('Password strength indicator visible', hasStrengthIndicator, hasStrengthIndicator ? 'Indicator found' : 'No indicator');
    } else {
      logResult('Accepts valid password', false, 'Password input not found');
      logResult('Password strength indicator visible', false, 'Password input not found');
    }

    // Test 6: Attempt signup with weak password via API
    console.log('Step 8: Test API rejects weak password');
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `weakpw${Date.now()}@test.com`,
          password: 'weak', // Too weak
          handle: `weakpw${Date.now()}`
        })
      });
      
      const data = await response.json();
      const rejected = response.status === 400 || data.error;
      logResult('API rejects weak password', rejected, rejected ? 'Password rejected' : `Status: ${response.status}`);
    } catch (error) {
      logResult('API rejects weak password', false, error.message);
    }

    // Test 7: API accepts strong password
    console.log('Step 9: Test API accepts strong password');
    try {
      const response = await fetch(`${config.backendUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `strongpw${Date.now()}@test.com`,
          password: 'StrongPass123!',
          handle: `strongpw${Date.now()}`
        })
      });
      
      const data = await response.json();
      const accepted = response.status === 201 || response.status === 200 || data.token;
      logResult('API accepts strong password', accepted, accepted ? 'User created' : `Error: ${data.error || response.status}`);
    } catch (error) {
      logResult('API accepts strong password', false, error.message);
    }

    console.log(`  ✅ Session completed: ${results.sessionUrl}`);

  } catch (error) {
    console.error('Verification error:', error.message);
    logResult('Password validation flow', false, error.message);
  } finally {
    if (browser) await browser.close();
  }

  results.overallPassed = results.failed === 0;
  results.duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

  console.log('\n' + '='.repeat(60));
  console.log('📊 Password Validation - Results');
  console.log('='.repeat(60));
  console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Duration: ${results.duration}`);
  console.log(`Status: ${results.overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log('='.repeat(60));

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyPasswordValidation().then(r => process.exit(r.overallPassed ? 0 : 1));
}

