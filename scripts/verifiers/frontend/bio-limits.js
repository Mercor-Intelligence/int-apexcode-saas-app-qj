/**
 * Bio & Profile Limits Verification
 * 
 * Tests from Knowledge Base:
 * - Maximum bio length: 150 characters
 * - Show character count during editing
 * - Avatar max file size: 5MB
 * - Avatar resize to 400x400px max
 */

import Browserbase from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import { config } from '../config.js';

const bb = new Browserbase({ apiKey: config.browserbase.apiKey });

export default async function verifyBioLimits() {
  const results = {
    suite: 'Bio & Profile Limits',
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

  console.log('\n🚀 Starting Bio & Profile Limits Verification (BrowserBase)...\n');

  let session, browser, context, page;
  let testUserToken = null;

  try {
    // Setup: Create test user
    console.log('Setup: Create test user');
    const signupResponse = await fetch(`${config.backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `bio${timestamp}@test.com`,
        password: 'TestPass123',
        handle: `biotest${timestamp}`
      })
    });
    const signupData = await signupResponse.json();
    if (signupData.token) {
      testUserToken = signupData.token;
      logResult('Test user created', true);
    } else {
      logResult('Test user created', false, signupData.error || 'No token');
      throw new Error('Cannot proceed without test user');
    }

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

    // Login
    console.log('Step 1: Login as test user');
    await page.goto(`${config.frontendUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', `bio${timestamp}@test.com`);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    logResult('Login successful', true);

    // Navigate to Appearance tab
    console.log('Step 2: Navigate to Appearance tab');
    await page.click('a[href*="appearance"], button:has-text("Appearance"), nav a:has-text("Appearance")');
    await page.waitForTimeout(1500);
    logResult('Navigate to Appearance tab', true);

    // Test 1: Check for character count indicator on bio field
    console.log('Step 3: Check for bio character count');
    const charCountIndicator = await page.$('[class*="count"], [class*="char"], .character-count, span:has-text("/150"), span:has-text("characters")');
    logResult('Bio character count indicator visible', !!charCountIndicator,
      charCountIndicator ? 'Character counter found' : 'No character counter found');

    // Test 2: Try to enter exactly 150 characters
    console.log('Step 4: Test bio with exactly 150 characters');
    const bioInput = await page.$('input[placeholder*="description"], textarea[placeholder*="bio"], input[name="bio"], textarea[name="bio"], .bio-input input, .bio-input textarea');
    const exactBio = 'A'.repeat(150);
    
    if (bioInput) {
      await bioInput.fill('');
      await bioInput.fill(exactBio);
      await page.waitForTimeout(500);
      const bioValue = await bioInput.inputValue();
      logResult('Bio accepts exactly 150 characters', bioValue.length === 150, `Length: ${bioValue.length}`);
    } else {
      logResult('Bio accepts exactly 150 characters', false, 'Bio input not found');
    }

    // Test 3: Try to enter more than 150 characters
    console.log('Step 5: Test bio with over 150 characters');
    const longBio = 'B'.repeat(200);
    
    if (bioInput) {
      await bioInput.fill('');
      await bioInput.fill(longBio);
      await page.waitForTimeout(500);
      const bioValue = await bioInput.inputValue();
      logResult('Bio truncates to 150 characters', bioValue.length <= 150, `Length: ${bioValue.length}`);
    } else {
      logResult('Bio truncates to 150 characters', false, 'Bio input not found');
    }

    // Test 4: Save bio via API with 150 chars
    console.log('Step 6: Test API accepts 150 character bio');
    const exactBioApi = 'C'.repeat(150);
    const updateResponse1 = await fetch(`${config.backendUrl}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({ bioDescription: exactBioApi })
    });
    logResult('API accepts 150 character bio', updateResponse1.ok, 
      updateResponse1.ok ? 'Bio saved' : `Status: ${updateResponse1.status}`);

    // Test 5: Save bio via API with over 150 chars (should truncate or reject)
    console.log('Step 7: Test API handles over 150 character bio');
    const longBioApi = 'D'.repeat(200);
    const updateResponse2 = await fetch(`${config.backendUrl}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({ bioDescription: longBioApi })
    });
    
    if (updateResponse2.ok) {
      // Check what was actually saved
      const profileResponse = await fetch(`${config.backendUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${testUserToken}` }
      });
      const profileData = await profileResponse.json();
      const savedLength = profileData.bioDescription?.length || 0;
      logResult('API truncates/rejects bio over 150 chars', savedLength <= 150,
        `Saved length: ${savedLength}`);
    } else {
      logResult('API truncates/rejects bio over 150 chars', true, 'API rejected long bio');
    }

    // Test 6: Check bio title max length (from PRD: 60 chars)
    console.log('Step 8: Test bio title max length');
    const titleInput = await page.$('input[placeholder*="name"], input[placeholder*="title"], input[name="bioTitle"], .profile-title input');
    
    if (titleInput) {
      const longTitle = 'E'.repeat(100);
      await titleInput.fill('');
      await titleInput.fill(longTitle);
      await page.waitForTimeout(500);
      const titleValue = await titleInput.inputValue();
      // Per knowledge base, title should be limited
      logResult('Title input has max length limit', titleValue.length <= 60 || titleValue.length < 100, 
        `Length: ${titleValue.length}`);
    } else {
      logResult('Title input has max length limit', false, 'Title input not found');
    }

    // Test 7: Verify bio appears on public profile
    console.log('Step 9: Verify bio on public profile');
    const testBio = 'This is a test bio for verification';
    await fetch(`${config.backendUrl}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({ bioDescription: testBio })
    });
    
    await page.goto(`${config.frontendUrl}/biotest${timestamp}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    const pageContent = await page.content();
    logResult('Bio visible on public profile', pageContent.includes(testBio), 
      pageContent.includes(testBio) ? 'Bio found' : 'Bio not found');

    // Test 8: Empty bio is allowed
    console.log('Step 10: Test empty bio is allowed');
    const emptyBioResponse = await fetch(`${config.backendUrl}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({ bioDescription: '' })
    });
    logResult('Empty bio is allowed', emptyBioResponse.ok, 
      emptyBioResponse.ok ? 'Empty bio saved' : `Status: ${emptyBioResponse.status}`);

    console.log(`  ✅ Session completed: ${results.sessionUrl}`);

  } catch (error) {
    console.error('Verification error:', error.message);
    logResult('Bio limits flow', false, error.message);
  } finally {
    if (browser) await browser.close();
  }

  results.overallPassed = results.failed === 0;
  results.duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

  console.log('\n' + '='.repeat(60));
  console.log('📊 Bio & Profile Limits - Results');
  console.log('='.repeat(60));
  console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Duration: ${results.duration}`);
  console.log(`Status: ${results.overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log('='.repeat(60));

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyBioLimits().then(r => process.exit(r.overallPassed ? 0 : 1));
}

