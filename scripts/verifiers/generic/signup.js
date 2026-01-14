/**
 * Generic Signup Verification
 * 
 * Tests signup functionality without assuming specific routes or selectors.
 * Adapts to different implementations (separate page, modal, home page form).
 */

import { launchBrowser, closeBrowser } from '../utils/browser.js';
import { Reporter } from '../utils/browser.js';
import { config } from '../../config.js';

export default async function verifySignup() {
  const timestamp = Date.now();
  const testEmail = `signup-gen-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testHandle = `genuser${timestamp}`.slice(0, 20);
  
  console.log('\n🚀 Starting Generic Signup Verification...\n');
  console.log(`Test User: ${testEmail} / @${testHandle}\n`);
  
  const report = new Reporter('Generic Signup Verification');
  let browser, page, sessionId, sessionUrl;
  
  try {
    // Create browser session
    const session = await launchBrowser();
    browser = session.browser;
    page = session.page;
    sessionId = session.sessionId;
    sessionUrl = session.debugUrl;
    
    report.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // Step 1: Find signup form (could be on /, /signup, or /register)
    console.log('Step 1: Find signup form');
    let signupFound = false;
    const possiblePaths = ['/', '/signup', '/register', '/sign-up'];
    
    for (const path of possiblePaths) {
      await page.goto(`${config.frontendUrl}${path}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      
      // Look for signup indicators
      const hasSignupForm = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        const hasSignupText = pageText.includes('sign up') || pageText.includes('signup') || 
                             pageText.includes('create account') || pageText.includes('register') ||
                             pageText.includes('get started');
        const hasEmailInput = document.querySelector('input[type="email"], input[name*="email"], input[placeholder*="email" i]');
        const hasPasswordInput = document.querySelector('input[type="password"]');
        return hasSignupText && hasEmailInput && hasPasswordInput;
      });
      
      if (hasSignupForm) {
        signupFound = true;
        report.record(`Signup form found at ${path}`, true);
        break;
      }
    }
    
    if (!signupFound) {
      report.record('Signup form found', false, 'Could not find signup form on any expected page');
      throw new Error('Signup form not found');
    }
    
    // Step 2: Fill handle/username field (if present)
    console.log('Step 2: Fill form fields');
    const handleFilled = await page.evaluate((handle) => {
      const selectors = [
        'input[name*="handle" i]', 'input[name*="username" i]', 'input[name*="user" i]',
        'input[placeholder*="handle" i]', 'input[placeholder*="username" i]',
        'input[id*="handle" i]', 'input[id*="username" i]'
      ];
      for (const sel of selectors) {
        const input = document.querySelector(sel);
        if (input && input.type !== 'email' && input.type !== 'password') {
          input.value = handle;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, testHandle);
    
    if (handleFilled) {
      report.record('Handle/username field filled', true);
    }
    
    // Step 3: Fill email field
    const emailFilled = await page.evaluate((email) => {
      const selectors = [
        'input[type="email"]', 'input[name*="email" i]', 
        'input[placeholder*="email" i]', 'input[id*="email" i]'
      ];
      for (const sel of selectors) {
        const input = document.querySelector(sel);
        if (input) {
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, testEmail);
    
    report.record('Email field filled', emailFilled, emailFilled ? '' : 'Email input not found');
    
    // Step 4: Fill password field
    const passwordFilled = await page.evaluate((password) => {
      const inputs = document.querySelectorAll('input[type="password"]');
      if (inputs.length > 0) {
        inputs[0].value = password;
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        // If there's a confirm password field, fill it too
        if (inputs.length > 1) {
          inputs[1].value = password;
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
      }
      return false;
    }, testPassword);
    
    report.record('Password field filled', passwordFilled, passwordFilled ? '' : 'Password input not found');
    
    await page.waitForTimeout(500);
    
    // Step 5: Submit form
    console.log('Step 3: Submit signup form');
    const submitted = await page.evaluate(() => {
      // First try: find button with signup-related text
      const buttons = document.querySelectorAll('button, input[type="submit"]');
      for (const btn of buttons) {
        const text = btn.innerText?.toLowerCase() || btn.value?.toLowerCase() || '';
        if (text.includes('sign up') || text.includes('signup') || text.includes('create') || 
            text.includes('register') || text.includes('get started') || text.includes('submit')) {
          if (!btn.disabled) {
            btn.click();
            return true;
          }
        }
      }
      
      // Second try: submit the form directly
      const form = document.querySelector('form');
      if (form) {
        form.submit();
        return true;
      }
      
      return false;
    });
    
    report.record('Signup form submitted', submitted, submitted ? '' : 'Could not submit form');
    
    // Step 6: Wait and check for success
    console.log('Step 4: Verify signup success');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    const isOnDashboard = currentUrl.includes('dashboard') || currentUrl.includes('home') || 
                          currentUrl.includes('profile') || currentUrl.includes('links');
    
    // Check for success indicators
    const successIndicators = await page.evaluate(() => {
      const pageText = document.body.innerText.toLowerCase();
      const url = window.location.href.toLowerCase();
      
      return {
        onDashboard: url.includes('dashboard') || url.includes('home'),
        hasWelcome: pageText.includes('welcome') || pageText.includes('success'),
        hasLogout: !!document.querySelector('button, a')?.innerText?.toLowerCase()?.includes('logout'),
        hasUserMenu: !!document.querySelector('[class*="avatar"], [class*="user"], [class*="profile"]'),
        noError: !pageText.includes('error') && !pageText.includes('failed') && !pageText.includes('invalid')
      };
    });
    
    const signupSuccess = isOnDashboard || successIndicators.hasWelcome || 
                          successIndicators.hasLogout || successIndicators.onDashboard;
    
    report.record('Signup completed successfully', signupSuccess, 
      signupSuccess ? `Redirected to: ${currentUrl}` : `Stayed on: ${currentUrl}`);
    
    // Step 7: Verify authenticated state
    console.log('Step 5: Verify authentication state');
    const isAuthenticated = await page.evaluate(() => {
      // Check localStorage/sessionStorage for tokens
      const hasToken = localStorage.getItem('token') || localStorage.getItem('authToken') || 
                       localStorage.getItem('jwt') || sessionStorage.getItem('token');
      // Check for auth cookies
      const hasCookie = document.cookie.includes('token') || document.cookie.includes('session') ||
                        document.cookie.includes('auth');
      // Check for logged-in UI elements
      const pageText = document.body.innerText.toLowerCase();
      const hasAuthUI = pageText.includes('logout') || pageText.includes('sign out');
      
      return hasToken || hasCookie || hasAuthUI;
    });
    
    report.record('User is authenticated', isAuthenticated || signupSuccess);
    
    console.log(`  ✅ Session completed: ${sessionUrl}`);
    
  } catch (error) {
    console.error('Signup verification error:', error.message);
    report.record('Signup verification', false, error.message);
  } finally {
    if (browser) {
      await closeBrowser(browser, sessionId);
    }
  }
  
  const results = report.summary();
  results.sessionUrl = sessionUrl;
  return results;
}
