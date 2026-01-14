/**
 * Generic Homepage Verification
 * 
 * Tests that the homepage loads correctly and has expected elements.
 */

import { launchBrowser, closeBrowser } from '../utils/browser.js';
import { Reporter } from '../utils/browser.js';
import { config } from '../../config.js';

export default async function verifyHomepage() {
  console.log('\n🚀 Starting Generic Homepage Verification...\n');
  console.log(`Testing: ${config.frontendUrl}\n`);
  
  const report = new Reporter('Generic Homepage Verification');
  let browser, page, sessionId, sessionUrl;
  
  try {
    // Create browser session
    const session = await launchBrowser();
    browser = session.browser;
    page = session.page;
    sessionId = session.sessionId;
    sessionUrl = session.debugUrl;
    
    report.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // Step 1: Load homepage
    console.log('Step 1: Load homepage');
    const startTime = Date.now();
    const response = await page.goto(config.frontendUrl, { waitUntil: 'networkidle', timeout: 20000 });
    const loadTime = Date.now() - startTime;
    
    const statusCode = response?.status();
    report.record('Homepage loads successfully', statusCode === 200 || statusCode === 304, 
      `Status: ${statusCode}, Load time: ${loadTime}ms`);
    
    // Step 2: Check page has content
    console.log('Step 2: Verify page content');
    await page.waitForTimeout(1000);
    
    const pageContent = await page.evaluate(() => {
      const body = document.body;
      const text = body.innerText || '';
      const html = body.innerHTML || '';
      
      return {
        hasTitle: document.title.length > 0,
        hasHeading: !!document.querySelector('h1, h2'),
        hasNavigation: !!document.querySelector('nav, header, [class*="nav"], [class*="header"]'),
        hasAuthOptions: text.toLowerCase().includes('login') || text.toLowerCase().includes('sign') ||
                        html.toLowerCase().includes('login') || html.toLowerCase().includes('signup'),
        hasFooter: !!document.querySelector('footer, [class*="footer"]'),
        textLength: text.length,
        hasBranding: text.toLowerCase().includes('biolink') || text.toLowerCase().includes('link') ||
                     document.title.toLowerCase().includes('biolink')
      };
    });
    
    report.record('Page has title', pageContent.hasTitle);
    report.record('Page has heading', pageContent.hasHeading);
    report.record('Page has navigation/header', pageContent.hasNavigation);
    report.record('Page has auth options', pageContent.hasAuthOptions);
    report.record('Page has branding', pageContent.hasBranding);
    
    // Step 3: Check responsive design
    console.log('Step 3: Test responsive design');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileLayout = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const bodyWidth = document.body.scrollWidth;
      const hasHorizontalScroll = bodyWidth > viewportWidth + 10;
      const hasContent = document.body.innerText.length > 50;
      
      return {
        noHorizontalScroll: !hasHorizontalScroll,
        hasContent,
        viewportWidth,
        bodyWidth
      };
    });
    
    report.record('Mobile responsive (no horizontal scroll)', mobileLayout.noHorizontalScroll);
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Step 4: Check performance metrics
    console.log('Step 4: Check performance');
    const isPerformant = loadTime < 3000;
    report.record('Page loads under 3s', isPerformant, `Load time: ${loadTime}ms`);
    
    // Step 5: Check for JavaScript errors
    console.log('Step 5: Check for JS errors');
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    report.record('No critical JS errors', jsErrors.length === 0, 
      jsErrors.length > 0 ? `Errors: ${jsErrors.join(', ')}` : '');
    
    // Step 6: Check accessibility basics
    console.log('Step 6: Basic accessibility check');
    const a11y = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.alt).length;
      const hasLang = document.documentElement.lang;
      const hasSkipLink = !!document.querySelector('[href="#main"], [href="#content"], .skip-link');
      
      return {
        imagesWithAlt: images.length === 0 || imagesWithAlt > 0,
        hasLang: !!hasLang,
        totalImages: images.length
      };
    });
    
    report.record('Images have alt text', a11y.imagesWithAlt, 
      a11y.totalImages > 0 ? `${a11y.totalImages} images found` : 'No images');
    report.record('Page has lang attribute', a11y.hasLang);
    
    console.log(`  ✅ Session completed: ${sessionUrl}`);
    
  } catch (error) {
    console.error('Homepage verification error:', error.message);
    report.record('Homepage verification', false, error.message);
  } finally {
    if (browser) {
      await closeBrowser(browser, sessionId);
    }
  }
  
  const results = report.summary();
  results.sessionUrl = sessionUrl;
  return results;
}

