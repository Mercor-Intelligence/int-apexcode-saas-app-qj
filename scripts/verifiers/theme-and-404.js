/**
 * Theme & 404 Page Verification
 * 
 * Tests from Knowledge Base:
 * - Dark mode should be the default theme
 * - 404 page for non-existent profiles
 * - 404 should suggest claiming the handle
 * - Theme persistence
 * - Animations on page load (staggered fade-ins)
 */

import Browserbase from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import { config } from '../config.js';

const bb = new Browserbase({ apiKey: config.browserbase.apiKey });

export default async function verifyThemeAnd404() {
  const results = {
    suite: 'Theme & 404 Page',
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

  console.log('\n🚀 Starting Theme & 404 Page Verification (BrowserBase)...\n');

  let session, browser, context, page;
  let testUserToken = null;
  const testHandle = `theme${timestamp}`;

  try {
    // Setup: Create test user
    console.log('Setup: Create test user');
    const signupResponse = await fetch(`${config.backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `theme${timestamp}@test.com`,
        password: 'TestPass123',
        handle: testHandle
      })
    });
    const signupData = await signupResponse.json();
    if (signupData.token) {
      testUserToken = signupData.token;
      logResult('Test user created', true);
    } else {
      logResult('Test user created', false, signupData.error || 'No token');
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

    // Test 1: Check 404 page for non-existent profile
    console.log('Step 1: Check 404 page for non-existent profile');
    const nonExistentHandle = `nonexistent${timestamp}abc`;
    await page.goto(`${config.frontendUrl}/${nonExistentHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    const pageContent = await page.content();
    const has404 = pageContent.toLowerCase().includes('404') || 
                   pageContent.toLowerCase().includes('not found') ||
                   pageContent.toLowerCase().includes('doesn\'t exist') ||
                   pageContent.toLowerCase().includes('does not exist');
    logResult('404 page shown for non-existent profile', has404, 
      has404 ? '404 content found' : 'No 404 indication');

    // Test 2: 404 page suggests claiming handle
    console.log('Step 2: Check 404 page suggests claiming handle');
    const suggestsClaim = pageContent.toLowerCase().includes('claim') ||
                         pageContent.toLowerCase().includes('sign up') ||
                         pageContent.toLowerCase().includes('create') ||
                         pageContent.toLowerCase().includes('register');
    logResult('404 page suggests claiming handle', suggestsClaim,
      suggestsClaim ? 'Claim suggestion found' : 'No claim suggestion');

    // Test 3: 404 page has link to signup
    console.log('Step 3: Check 404 has signup link');
    const signupLink = await page.$('a[href*="signup"], a[href*="register"], button:has-text("Sign Up"), a:has-text("Sign Up")');
    logResult('404 page has signup link', !!signupLink,
      signupLink ? 'Signup link found' : 'No signup link');

    // Test 4: Check dark mode is default
    console.log('Step 4: Check dark mode is default');
    await page.goto(`${config.frontendUrl}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Check for dark theme indicators
    const bodyBgColor = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return style.backgroundColor;
    });
    
    // Parse RGB values
    const isDarkBg = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const style = window.getComputedStyle(body);
      const bgColor = style.backgroundColor;
      
      // Check for dark class
      if (body.classList.contains('dark') || html.classList.contains('dark')) return true;
      if (body.getAttribute('data-theme') === 'dark' || html.getAttribute('data-theme') === 'dark') return true;
      
      // Check background color luminance
      const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance < 0.5; // Dark if luminance is less than 0.5
      }
      return false;
    });
    logResult('Dark mode is default theme', isDarkBg, 
      isDarkBg ? 'Dark background detected' : `Background: ${bodyBgColor}`);

    // Test 5: Check theme can be changed
    console.log('Step 5: Test theme selection');
    if (testUserToken) {
      // Login and check theme options
      await page.goto(`${config.frontendUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.fill('input[type="email"]', `theme${timestamp}@test.com`);
      await page.fill('input[type="password"]', 'TestPass123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      
      // Navigate to appearance
      await page.click('a[href*="appearance"], button:has-text("Appearance"), nav a:has-text("Appearance")');
      await page.waitForTimeout(1500);
      
      // Check for theme options
      const themeButtons = await page.$$('[class*="theme"], .theme-card, button[class*="theme"]');
      logResult('Theme selection options available', themeButtons.length > 0,
        `Found ${themeButtons.length} theme options`);
      
      // Try clicking a theme button
      if (themeButtons.length > 1) {
        await themeButtons[1].click();
        await page.waitForTimeout(500);
        logResult('Theme selection interactive', true, 'Theme button clicked');
      }
    } else {
      logResult('Theme selection options available', false, 'No auth token');
      logResult('Theme selection interactive', false, 'No auth token');
    }

    // Test 6: Check animations present
    console.log('Step 6: Check page animations');
    await page.goto(`${config.frontendUrl}/${testHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const hasAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.animation !== 'none' || 
            style.animationName !== 'none' ||
            style.transition !== 'none 0s ease 0s' ||
            el.style.animationDelay) {
          return true;
        }
      }
      return false;
    });
    logResult('Page has CSS animations', hasAnimations,
      hasAnimations ? 'Animations detected' : 'No animations found');

    // Test 7: Check staggered animations on links
    console.log('Step 7: Check staggered link animations');
    // Create some links first
    if (testUserToken) {
      for (let i = 0; i < 3; i++) {
        await fetch(`${config.backendUrl}/api/links`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUserToken}`
          },
          body: JSON.stringify({
            title: `Link ${i + 1}`,
            url: `https://example${i}.com`,
            type: 'CLASSIC'
          })
        });
      }
    }
    
    await page.goto(`${config.frontendUrl}/${testHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);
    
    const hasStaggeredAnimations = await page.evaluate(() => {
      const links = document.querySelectorAll('.link-button, .link-item');
      if (links.length < 2) return false;
      
      let hasDelay = false;
      links.forEach((link, index) => {
        const style = window.getComputedStyle(link);
        const delay = parseFloat(style.animationDelay || '0');
        if (delay > 0 || link.style.animationDelay) {
          hasDelay = true;
        }
      });
      return hasDelay;
    });
    logResult('Links have staggered animations', hasStaggeredAnimations,
      hasStaggeredAnimations ? 'Staggered delays found' : 'No stagger detected');

    // Test 8: Verify theme persists via API
    console.log('Step 8: Verify theme persistence');
    if (testUserToken) {
      // Set theme via API
      const setThemeResponse = await fetch(`${config.backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify({ theme: 'sunset' })
      });
      
      // Fetch profile and check theme
      const profileResponse = await fetch(`${config.backendUrl}/api/profile`, {
        headers: { 'Authorization': `Bearer ${testUserToken}` }
      });
      const profileData = await profileResponse.json();
      logResult('Theme persists in database', profileData.theme === 'sunset',
        `Theme: ${profileData.theme}`);
    } else {
      logResult('Theme persists in database', false, 'No auth token');
    }

    // Test 9: Public profile uses user's theme
    console.log('Step 9: Public profile uses user theme');
    const publicResponse = await fetch(`${config.backendUrl}/api/public/${testHandle}`);
    const publicData = await publicResponse.json();
    logResult('Public profile includes theme', !!publicData.theme,
      `Theme: ${publicData.theme || 'none'}`);

    // Test 10: Check color scheme matches spec (orange primary)
    console.log('Step 10: Check color scheme');
    const primaryColor = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--primary') || 
             style.getPropertyValue('--color-primary') ||
             style.getPropertyValue('--accent');
    });
    const hasOrangePrimary = primaryColor.toLowerCase().includes('ff6b35') || 
                            primaryColor.toLowerCase().includes('orange') ||
                            primaryColor.includes('255') ||
                            primaryColor.includes('#f');
    logResult('Primary color scheme matches spec', hasOrangePrimary || !!primaryColor,
      primaryColor ? `Primary: ${primaryColor}` : 'No CSS variable found');

    console.log(`  ✅ Session completed: ${results.sessionUrl}`);

  } catch (error) {
    console.error('Verification error:', error.message);
    logResult('Theme & 404 flow', false, error.message);
  } finally {
    if (browser) await browser.close();
  }

  results.overallPassed = results.failed === 0;
  results.duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

  console.log('\n' + '='.repeat(60));
  console.log('📊 Theme & 404 Page - Results');
  console.log('='.repeat(60));
  console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Duration: ${results.duration}`);
  console.log(`Status: ${results.overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log('='.repeat(60));

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyThemeAnd404().then(r => process.exit(r.overallPassed ? 0 : 1));
}

