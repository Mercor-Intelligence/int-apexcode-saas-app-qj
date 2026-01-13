/**
 * Handle/Username Validation Verification
 * 
 * Tests from Knowledge Base:
 * - Letters, numbers, underscores, and periods allowed
 * - Must start with a letter
 * - Length: 3-30 characters
 * - No consecutive periods or underscores
 * - Case-insensitive (JohnDoe = johndoe)
 */

import Browserbase from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import { config } from '../config.js';

const bb = new Browserbase({ apiKey: config.browserbase.apiKey });

export default async function verifyHandleValidation() {
  const results = {
    suite: 'Handle Validation',
    tests: [],
    total: 0,
    passed: 0,
    failed: 0,
    overallPassed: false,
    sessionUrl: null
  };

  const startTime = Date.now();
  const timestamp = Date.now();

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

  console.log('\n🚀 Starting Handle Validation Verification (BrowserBase)...\n');

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

    const handleInput = await page.$('input[type="text"]');

    // Test 1: Handle too short (less than 3 chars)
    console.log('Step 2: Test handle too short');
    if (handleInput) {
      await handleInput.fill('ab'); // Only 2 chars
      await page.waitForTimeout(1000);
      
      // Check API for availability (should be rejected)
      const response = await fetch(`${config.backendUrl}/api/auth/check-handle/ab`);
      const data = await response.json();
      // Short handles should either be unavailable or return an error
      logResult('Rejects handle under 3 characters', !data.available || data.error, 
        data.error ? data.error : (data.available ? 'Handle accepted (should reject)' : 'Handle rejected'));
      
      await handleInput.fill('');
    } else {
      logResult('Rejects handle under 3 characters', false, 'Handle input not found');
    }

    // Test 2: Handle starting with number
    console.log('Step 3: Test handle starting with number');
    const numStartHandle = `123test${timestamp}`;
    const response2 = await fetch(`${config.backendUrl}/api/auth/check-handle/${numStartHandle}`);
    const data2 = await response2.json();
    logResult('Rejects handle starting with number', !data2.available || data2.error,
      data2.available ? 'Handle accepted (should reject)' : 'Handle rejected');

    // Test 3: Handle with special characters
    console.log('Step 4: Test handle with special characters');
    const specialHandle = `test@${timestamp}`;
    const response3 = await fetch(`${config.backendUrl}/api/auth/check-handle/${encodeURIComponent(specialHandle)}`);
    const data3 = await response3.json();
    logResult('Rejects handle with special characters (@)', !data3.available || data3.error,
      data3.available ? 'Handle accepted (should reject)' : 'Handle rejected');

    // Test 4: Handle with consecutive periods
    console.log('Step 5: Test handle with consecutive periods');
    const doublePeriodHandle = `test..handle${timestamp}`;
    const response4 = await fetch(`${config.backendUrl}/api/auth/check-handle/${doublePeriodHandle}`);
    const data4 = await response4.json();
    logResult('Rejects handle with consecutive periods', !data4.available || data4.error,
      data4.available ? 'Handle accepted (should reject)' : 'Handle rejected');

    // Test 5: Handle with consecutive underscores
    console.log('Step 6: Test handle with consecutive underscores');
    const doubleUnderscoreHandle = `test__handle${timestamp}`;
    const response5 = await fetch(`${config.backendUrl}/api/auth/check-handle/${doubleUnderscoreHandle}`);
    const data5 = await response5.json();
    logResult('Rejects handle with consecutive underscores', !data5.available || data5.error,
      data5.available ? 'Handle accepted (should reject)' : 'Handle rejected');

    // Test 6: Handle too long (over 30 chars)
    console.log('Step 7: Test handle too long');
    const longHandle = 'a'.repeat(35); // 35 chars
    const response6 = await fetch(`${config.backendUrl}/api/auth/check-handle/${longHandle}`);
    const data6 = await response6.json();
    logResult('Rejects handle over 30 characters', !data6.available || data6.error,
      data6.available ? 'Handle accepted (should reject)' : 'Handle rejected');

    // Test 7: Valid handle with letters only
    console.log('Step 8: Test valid handle (letters only)');
    const validHandle1 = `testhandle${timestamp}`;
    const response7 = await fetch(`${config.backendUrl}/api/auth/check-handle/${validHandle1}`);
    const data7 = await response7.json();
    logResult('Accepts valid handle (letters only)', data7.available === true, 
      data7.available ? 'Handle available' : 'Handle not available');

    // Test 8: Valid handle with underscore
    console.log('Step 9: Test valid handle (with underscore)');
    const validHandle2 = `test_handle${timestamp}`;
    const response8 = await fetch(`${config.backendUrl}/api/auth/check-handle/${validHandle2}`);
    const data8 = await response8.json();
    logResult('Accepts valid handle (with underscore)', data8.available === true,
      data8.available ? 'Handle available' : 'Handle not available');

    // Test 9: Valid handle with period
    console.log('Step 10: Test valid handle (with period)');
    const validHandle3 = `test.handle${timestamp}`;
    const response9 = await fetch(`${config.backendUrl}/api/auth/check-handle/${validHandle3}`);
    const data9 = await response9.json();
    logResult('Accepts valid handle (with period)', data9.available === true,
      data9.available ? 'Handle available' : 'Handle not available');

    // Test 10: Case insensitivity - create user then check uppercase
    console.log('Step 11: Test case insensitivity');
    const caseTestHandle = `casetest${timestamp}`;
    
    // First create the user
    const createResponse = await fetch(`${config.backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `case${timestamp}@test.com`,
        password: 'TestPass123',
        handle: caseTestHandle
      })
    });
    
    if (createResponse.ok) {
      // Now check if uppercase version is unavailable
      const upperHandle = caseTestHandle.toUpperCase();
      const caseResponse = await fetch(`${config.backendUrl}/api/auth/check-handle/${upperHandle}`);
      const caseData = await caseResponse.json();
      logResult('Handles are case-insensitive', !caseData.available,
        caseData.available ? 'Uppercase variant available (should be taken)' : 'Uppercase variant correctly unavailable');
    } else {
      logResult('Handles are case-insensitive', false, 'Could not create test user');
    }

    // Test 11: Verify handle preserves original case
    console.log('Step 12: Test handle preserves original case');
    const mixedCaseHandle = `MixedCase${timestamp}`;
    const createResponse2 = await fetch(`${config.backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `mixed${timestamp}@test.com`,
        password: 'TestPass123',
        handle: mixedCaseHandle
      })
    });
    
    if (createResponse2.ok) {
      const userData = await createResponse2.json();
      // Check the public profile to verify case is preserved
      const profileResponse = await fetch(`${config.backendUrl}/api/public/${mixedCaseHandle.toLowerCase()}`);
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        logResult('Handle preserves original case', profileData.handle === mixedCaseHandle,
          `Stored: ${profileData.handle}, Expected: ${mixedCaseHandle}`);
      } else {
        logResult('Handle preserves original case', false, 'Could not fetch profile');
      }
    } else {
      logResult('Handle preserves original case', false, 'Could not create test user');
    }

    console.log(`  ✅ Session completed: ${results.sessionUrl}`);

  } catch (error) {
    console.error('Verification error:', error.message);
    logResult('Handle validation flow', false, error.message);
  } finally {
    if (browser) await browser.close();
  }

  results.overallPassed = results.failed === 0;
  results.duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

  console.log('\n' + '='.repeat(60));
  console.log('📊 Handle Validation - Results');
  console.log('='.repeat(60));
  console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Duration: ${results.duration}`);
  console.log(`Status: ${results.overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log('='.repeat(60));

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyHandleValidation().then(r => process.exit(r.overallPassed ? 0 : 1));
}

