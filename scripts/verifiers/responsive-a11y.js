/**
 * Responsive Design & Accessibility Verification
 * 
 * Tests from Knowledge Base:
 * - Minimum supported screen width: 320px (iPhone SE)
 * - Public profile fully functional at 320px
 * - Dashboard can require 768px minimum
 * - PWA installable
 * - Offline message handling
 * - Reduce motion option for accessibility
 */

import Browserbase from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import { config } from '../config.js';

const bb = new Browserbase({ apiKey: config.browserbase.apiKey });

export default async function verifyResponsiveA11y() {
  const results = {
    suite: 'Responsive & Accessibility',
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

  console.log('\n🚀 Starting Responsive & Accessibility Verification (BrowserBase)...\n');

  let session, browser, context, page;
  let testUserToken = null;
  const testHandle = `responsive${timestamp}`;

  try {
    // Setup: Create test user with links
    console.log('Setup: Create test user with links');
    const signupResponse = await fetch(`${config.backendUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `responsive${timestamp}@test.com`,
        password: 'TestPass123',
        handle: testHandle
      })
    });
    const signupData = await signupResponse.json();
    if (signupData.token) {
      testUserToken = signupData.token;
      logResult('Test user created', true);
      
      // Add some links for testing
      for (let i = 0; i < 5; i++) {
        await fetch(`${config.backendUrl}/api/links`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUserToken}`
          },
          body: JSON.stringify({
            title: `Test Link ${i + 1}`,
            url: `https://example${i}.com`,
            type: 'CLASSIC'
          })
        });
      }
      
      // Update profile
      await fetch(`${config.backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUserToken}`
        },
        body: JSON.stringify({
          bioTitle: 'Responsive Test User',
          bioDescription: 'Testing responsive design'
        })
      });
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

    // Test 1: Public profile at 320px width (iPhone SE)
    console.log('Step 1: Test public profile at 320px width');
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`${config.frontendUrl}/${testHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    // Check for horizontal scroll (indicates overflow issues)
    const hasHorizontalScroll320 = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    logResult('No horizontal scroll at 320px', !hasHorizontalScroll320,
      hasHorizontalScroll320 ? 'Horizontal overflow detected' : 'Layout fits');

    // Test 2: All links visible at 320px
    console.log('Step 2: Check links visible at 320px');
    const linksVisible320 = await page.$$('.link-button, .link-item');
    logResult('Links visible at 320px', linksVisible320.length >= 5,
      `Found ${linksVisible320.length} links`);

    // Test 3: Links are tappable (min touch target 44x44)
    console.log('Step 3: Check link touch targets');
    const linkButton = await page.$('.link-button, .link-item button');
    if (linkButton) {
      const box = await linkButton.boundingBox();
      const minSize = 44;
      const isTappable = box && box.height >= minSize && box.width >= 44;
      logResult('Links have adequate touch targets', isTappable,
        box ? `Size: ${Math.round(box.width)}x${Math.round(box.height)}` : 'No box');
    } else {
      logResult('Links have adequate touch targets', false, 'No link button found');
    }

    // Test 4: Avatar visible at 320px
    console.log('Step 4: Check avatar at 320px');
    const avatar320 = await page.$('.avatar, .profile-avatar, img[class*="avatar"]');
    logResult('Avatar visible at 320px', !!avatar320, avatar320 ? 'Avatar found' : 'No avatar');

    // Test 5: Profile title/bio visible at 320px
    console.log('Step 5: Check profile info at 320px');
    const pageContent = await page.content();
    const hasTitle = pageContent.includes('Responsive Test User');
    const hasBio = pageContent.includes('Testing responsive design');
    logResult('Profile info visible at 320px', hasTitle || hasBio,
      `Title: ${hasTitle}, Bio: ${hasBio}`);

    // Test 6: Test at tablet size (768px)
    console.log('Step 6: Test at tablet size (768px)');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${config.frontendUrl}/${testHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const linksVisible768 = await page.$$('.link-button, .link-item');
    logResult('Layout works at 768px', linksVisible768.length >= 5,
      `Found ${linksVisible768.length} links`);

    // Test 7: Test dashboard at 768px (minimum supported)
    console.log('Step 7: Test dashboard at 768px');
    await page.goto(`${config.frontendUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', `responsive${timestamp}@test.com`);
    await page.fill('input[type="password"]', 'TestPass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await page.waitForTimeout(1500);
    
    const dashboardUsable = await page.evaluate(() => {
      // Check if main navigation and content is accessible
      const nav = document.querySelector('nav, [class*="nav"], [class*="sidebar"]');
      const content = document.querySelector('main, [class*="content"], [class*="main"]');
      return !!(nav || content);
    });
    logResult('Dashboard usable at 768px', dashboardUsable,
      dashboardUsable ? 'Navigation accessible' : 'Layout broken');

    // Test 8: Check for PWA manifest
    console.log('Step 8: Check PWA manifest');
    await page.goto(`${config.frontendUrl}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const hasManifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return !!link;
    });
    logResult('PWA manifest present', hasManifest,
      hasManifest ? 'manifest.json linked' : 'No manifest');

    // Test 9: Check viewport meta tag
    console.log('Step 9: Check viewport meta tag');
    const hasViewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      if (!meta) return false;
      const content = meta.getAttribute('content') || '';
      return content.includes('width=device-width');
    });
    logResult('Viewport meta tag correct', hasViewportMeta,
      hasViewportMeta ? 'viewport configured' : 'No viewport meta');

    // Test 10: Check for semantic HTML
    console.log('Step 10: Check semantic HTML');
    const hasSemanticHTML = await page.evaluate(() => {
      const semantic = {
        main: !!document.querySelector('main'),
        header: !!document.querySelector('header'),
        nav: !!document.querySelector('nav'),
        footer: !!document.querySelector('footer'),
        h1: !!document.querySelector('h1')
      };
      return Object.values(semantic).filter(Boolean).length >= 2;
    });
    logResult('Uses semantic HTML', hasSemanticHTML,
      hasSemanticHTML ? 'Semantic elements found' : 'Missing semantic elements');

    // Test 11: Check for focus styles
    console.log('Step 11: Check focus styles');
    const hasFocusStyles = await page.evaluate(() => {
      const focusable = document.querySelector('a, button, input');
      if (!focusable) return false;
      focusable.focus();
      const style = window.getComputedStyle(focusable);
      return style.outlineStyle !== 'none' || 
             style.boxShadow !== 'none' ||
             focusable.matches(':focus-visible');
    });
    logResult('Focus styles present', hasFocusStyles,
      hasFocusStyles ? 'Focus indicators work' : 'No focus styles');

    // Test 12: Check for alt text on images
    console.log('Step 12: Check image alt text');
    await page.goto(`${config.frontendUrl}/${testHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    
    const imagesHaveAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      if (images.length === 0) return true; // No images to check
      let count = 0;
      images.forEach(img => {
        if (img.hasAttribute('alt')) count++;
      });
      return count === images.length;
    });
    logResult('Images have alt text', imagesHaveAlt,
      imagesHaveAlt ? 'All images have alt' : 'Some images missing alt');

    // Test 13: Check color contrast (basic check)
    console.log('Step 13: Check text readability');
    const hasReadableText = await page.evaluate(() => {
      const textElements = document.querySelectorAll('h1, h2, p, span, a');
      for (const el of textElements) {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        // Text should be at least 12px
        if (fontSize < 12 && el.textContent.trim().length > 0) {
          return false;
        }
      }
      return true;
    });
    logResult('Text is readable size', hasReadableText,
      hasReadableText ? 'Font sizes adequate' : 'Some text too small');

    // Test 14: Check for prefers-reduced-motion support
    console.log('Step 14: Check reduced motion support');
    const hasReducedMotionSupport = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      try {
        for (const sheet of styles) {
          const rules = sheet.cssRules || [];
          for (const rule of rules) {
            if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
              return true;
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw
      }
      return false;
    });
    logResult('Reduced motion media query', hasReducedMotionSupport,
      hasReducedMotionSupport ? 'Supports reduced motion' : 'No reduced motion support');

    // Test 15: Desktop layout at 1280px
    console.log('Step 15: Test desktop layout (1280px)');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${config.frontendUrl}/${testHandle}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.evaluate(() => {
      const profile = document.querySelector('.public-profile, .profile-page, main');
      if (!profile) return false;
      const rect = profile.getBoundingClientRect();
      // Content should be centered and not span full width
      return rect.width < window.innerWidth * 0.9;
    });
    logResult('Desktop layout centered', desktopLayout,
      desktopLayout ? 'Content centered' : 'Full width or no container');

    console.log(`  ✅ Session completed: ${results.sessionUrl}`);

  } catch (error) {
    console.error('Verification error:', error.message);
    logResult('Responsive & A11y flow', false, error.message);
  } finally {
    if (browser) await browser.close();
  }

  results.overallPassed = results.failed === 0;
  results.duration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';

  console.log('\n' + '='.repeat(60));
  console.log('📊 Responsive & Accessibility - Results');
  console.log('='.repeat(60));
  console.log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
  console.log(`Duration: ${results.duration}`);
  console.log(`Status: ${results.overallPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
  console.log('='.repeat(60));

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyResponsiveA11y().then(r => process.exit(r.overallPassed ? 0 : 1));
}

