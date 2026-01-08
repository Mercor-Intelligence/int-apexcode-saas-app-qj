/**
 * Browser utility functions for verification scripts
 */

import { chromium } from 'playwright';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

/**
 * Launch a new browser instance with configured settings
 */
export async function launchBrowser() {
  const browser = await chromium.launch({
    headless: config.browser.headless,
    slowMo: config.browser.slowMo
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  page.setDefaultTimeout(config.browser.timeout);
  
  return { browser, context, page };
}

/**
 * Close browser and cleanup
 */
export async function closeBrowser(browser) {
  if (browser) {
    await browser.close();
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
    console.log(`Screenshot saved: ${filename}`);
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
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  return response;
}

export default {
  launchBrowser,
  closeBrowser,
  screenshotOnFailure,
  waitForNavigation,
  elementExists,
  getTextContent,
  apiRequest
};

