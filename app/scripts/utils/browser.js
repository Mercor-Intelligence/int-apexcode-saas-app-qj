/**
 * BrowserBase utility functions for verification scripts
 * Uses BrowserBase cloud browsers for automated testing
 */

import Browserbase from '@browserbasehq/sdk';
import { chromium } from 'playwright-core';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

// Initialize BrowserBase client
const browserbase = new Browserbase({
  apiKey: config.browserbase.apiKey
});

/**
 * Launch a new BrowserBase session and connect via Playwright
 */
export async function launchBrowser() {
  console.log('  🌐 Creating BrowserBase session...');
  
  // Create a new BrowserBase session
  const session = await browserbase.sessions.create({
    projectId: config.browserbase.projectId,
    browserSettings: {
      viewport: {
        width: 1280,
        height: 720
      }
    }
  });
  
  console.log(`  📍 Session ID: ${session.id}`);
  console.log(`  🔗 Debug URL: https://browserbase.com/sessions/${session.id}`);
  
  // Connect to the session using Playwright
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0] || await browser.newContext();
  const page = context.pages()[0] || await context.newPage();
  
  page.setDefaultTimeout(config.browser.timeout);
  
  return { 
    browser, 
    context, 
    page, 
    sessionId: session.id,
    debugUrl: `https://browserbase.com/sessions/${session.id}`
  };
}

/**
 * Close browser and end BrowserBase session
 */
export async function closeBrowser(browser, sessionId) {
  if (browser) {
    await browser.close();
  }
  
  if (sessionId) {
    console.log(`  ✅ Session completed: https://browserbase.com/sessions/${sessionId}`);
  }
}

/**
 * Take a screenshot on failure
 */
export async function screenshotOnFailure(page, testName) {
  if (config.verification.screenshotOnFailure) {
    const dir = config.verification.screenshotDir;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${testName}-${Date.now()}.png`;
    await page.screenshot({ path: path.join(dir, filename) });
    console.log(`  📸 Screenshot saved: ${filename}`);
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page, url) {
  await page.waitForURL(url, { timeout: config.browser.timeout });
}

/**
 * Check if element exists on page
 */
export async function elementExists(page, selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content of element
 */
export async function getTextContent(page, selector) {
  const element = await page.waitForSelector(selector);
  return await element.textContent();
}

/**
 * API helper - make authenticated request
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${config.backendUrl}${endpoint}`;
  const { headers: optionHeaders, ...restOptions } = options;
  
  const response = await fetch(url, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...optionHeaders
    }
  });
  return response;
}

/**
 * Get session recording URL for debugging
 */
export function getSessionRecording(sessionId) {
  return `https://browserbase.com/sessions/${sessionId}`;
}

export default {
  launchBrowser,
  closeBrowser,
  screenshotOnFailure,
  waitForNavigation,
  elementExists,
  getTextContent,
  apiRequest,
  getSessionRecording
};
