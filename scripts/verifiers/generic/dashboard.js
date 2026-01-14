/**
 * Generic Dashboard Verification
 * 
 * Tests that authenticated users can access and use dashboard functionality.
 */

import { launchBrowser, closeBrowser } from '../utils/browser.js';
import { Reporter } from '../utils/browser.js';
import { config } from '../../config.js';

export default async function verifyDashboard() {
  const timestamp = Date.now();
  const testEmail = `dash-gen-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testHandle = `dashuser${timestamp}`.slice(0, 20);
  
  console.log('\n🚀 Starting Generic Dashboard Verification...\n');
  console.log(`Test User: ${testEmail}\n`);
  
  const report = new Reporter('Generic Dashboard Verification');
  let browser, page, sessionId, sessionUrl;
  
  try {
    // Create browser session
    const session = await launchBrowser();
    browser = session.browser;
    page = session.page;
    sessionId = session.sessionId;
    sessionUrl = session.debugUrl;
    
    report.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // Step 1: Sign up via UI (to test full flow)
    console.log('Step 1: Sign up to access dashboard');
    
    // Find and fill signup form
    const possiblePaths = ['/', '/signup', '/register'];
    let signedUp = false;
    
    for (const path of possiblePaths) {
      await page.goto(`${config.frontendUrl}${path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      
      // Check if this page has a signup form
      const hasSignupForm = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        return (pageText.includes('sign up') || pageText.includes('register') || pageText.includes('create')) &&
               document.querySelector('input[type="password"]');
      });
      
      if (!hasSignupForm) continue;
      
      // Fill handle (if exists)
      await page.evaluate((handle) => {
        const selectors = ['input[name*="handle" i]', 'input[name*="username" i]', 'input[placeholder*="handle" i]'];
        for (const sel of selectors) {
          const input = document.querySelector(sel);
          if (input && input.type !== 'email' && input.type !== 'password') {
            input.value = handle;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return;
          }
        }
      }, testHandle);
      
      // Fill email
      await page.evaluate((email) => {
        const input = document.querySelector('input[type="email"], input[name*="email" i]');
        if (input) {
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, testEmail);
      
      // Fill password
      await page.evaluate((password) => {
        const inputs = document.querySelectorAll('input[type="password"]');
        inputs.forEach(input => {
          input.value = password;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }, testPassword);
      
      await page.waitForTimeout(500);
      
      // Submit
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="submit"]');
        for (const btn of buttons) {
          const text = btn.innerText?.toLowerCase() || btn.value?.toLowerCase() || '';
          if (text.includes('sign up') || text.includes('create') || text.includes('register') || text.includes('get started')) {
            btn.click();
            return;
          }
        }
        const form = document.querySelector('form');
        if (form) form.submit();
      });
      
      await page.waitForTimeout(3000);
      
      // Check if we made it to dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || currentUrl.includes('home')) {
        signedUp = true;
        break;
      }
    }
    
    report.record('Signup and redirect to dashboard', signedUp, 
      signedUp ? 'Successfully signed up' : 'Could not complete signup flow');
    
    // Step 2: Verify dashboard loaded
    console.log('Step 2: Verify dashboard content');
    
    // If not on dashboard, try navigating directly
    if (!signedUp) {
      await page.goto(`${config.frontendUrl}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    
    const dashboardContent = await page.evaluate(() => {
      const pageText = document.body.innerText.toLowerCase();
      const url = window.location.href.toLowerCase();
      
      return {
        onDashboard: url.includes('dashboard') || url.includes('home'),
        hasLinks: pageText.includes('link') || pageText.includes('add') || !!document.querySelector('[class*="link"]'),
        hasProfile: pageText.includes('profile') || pageText.includes('settings') || pageText.includes('bio'),
        hasAnalytics: pageText.includes('analytics') || pageText.includes('views') || pageText.includes('clicks'),
        hasNavigation: document.querySelectorAll('nav, [class*="nav"], [class*="sidebar"], [class*="menu"]').length > 0,
        hasLogout: pageText.includes('logout') || pageText.includes('sign out')
      };
    });
    
    report.record('Dashboard page loaded', dashboardContent.onDashboard || signedUp);
    report.record('Dashboard has link management', dashboardContent.hasLinks);
    report.record('Dashboard has profile/settings', dashboardContent.hasProfile);
    report.record('Dashboard has navigation', dashboardContent.hasNavigation || dashboardContent.hasLogout);
    
    // Step 3: Try adding a link
    console.log('Step 3: Test link management');
    const linkAdded = await page.evaluate(() => {
      // Look for add link button
      const addButtons = document.querySelectorAll('button, a');
      for (const btn of addButtons) {
        const text = btn.innerText?.toLowerCase() || '';
        if (text.includes('add') && (text.includes('link') || text.length < 15)) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (linkAdded) {
      await page.waitForTimeout(1000);
      
      // Try to fill link form
      await page.evaluate(() => {
        const urlInput = document.querySelector('input[name*="url" i], input[placeholder*="url" i], input[type="url"]');
        const titleInput = document.querySelector('input[name*="title" i], input[placeholder*="title" i]');
        
        if (urlInput) {
          urlInput.value = 'https://example.com';
          urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (titleInput) {
          titleInput.value = 'Test Link';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      report.record('Link form accessible', true);
    } else {
      report.record('Link form accessible', dashboardContent.hasLinks, 'Add link button not found');
    }
    
    // Step 4: Check for logout functionality
    console.log('Step 4: Verify logout available');
    const hasLogout = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a');
      for (const el of elements) {
        const text = el.innerText?.toLowerCase() || '';
        if (text.includes('logout') || text.includes('log out') || text.includes('sign out')) {
          return true;
        }
      }
      return false;
    });
    
    report.record('Logout option available', hasLogout);
    
    console.log(`  ✅ Session completed: ${sessionUrl}`);
    
  } catch (error) {
    console.error('Dashboard verification error:', error.message);
    report.record('Dashboard verification', false, error.message);
  } finally {
    if (browser) {
      await closeBrowser(browser, sessionId);
    }
  }
  
  const results = report.summary();
  results.sessionUrl = sessionUrl;
  return results;
}
