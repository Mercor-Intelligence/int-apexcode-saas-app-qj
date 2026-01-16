/**
 * Evaluation Primitives for APEX Code V2
 * 
 * Reusable verifier functions that implement core evaluation patterns:
 * - screenshotEval: UI/UX quality validation via visual inspection
 * - networkIntercept: Robustness testing via network manipulation
 * 
 * Based on: APEX SaaS Evaluation Architecture - Primitives & Harness
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { launchBrowser, closeBrowser, screenshotOnFailure, apiRequest } from '../utils/browser.js';
import { config } from '../config.js';

const SCORE_THRESHOLD = 0.7;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Ensure screenshot directory exists
 */
function ensureScreenshotDir() {
  const dir = config.verification.screenshotDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Real visual evaluation using GPT-4 Vision
 * Analyzes screenshot and returns structured quality scores
 * 
 * @param {Object} params
 * @param {string} params.screenshotPath - Path to screenshot file
 * @param {string} params.schema - Schema identifier for context
 * @returns {Promise<Object>} Evaluation result with subScores
 */
async function evaluateScreenshot({ screenshotPath, schema = 'page' }) {
  try {
    // Read screenshot and convert to base64
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    // Call GPT-4 Vision to evaluate the screenshot
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `You are evaluating a ${schema} screenshot for a web application. 

Rate the following aspects on a scale from 0 to 1 (where 1 is perfect):

1. **layout** (0-1): Is the page layout coherent, well-organized, and visually balanced?
   - 0.9-1.0: Excellent grid alignment, clear visual hierarchy, professional spacing
   - 0.7-0.89: Good layout with minor alignment or spacing issues
   - 0.5-0.69: Functional but has noticeable layout problems
   - 0.0-0.49: Broken layout, overlapping elements, or confusing structure

2. **clarity** (0-1): Are CTAs (calls-to-action) and key elements clearly visible and understandable?
   - 0.9-1.0: Primary actions immediately obvious, clear labels, strong visual hierarchy
   - 0.7-0.89: Clear but could be more prominent or better labeled
   - 0.5-0.69: Some confusion about what actions to take
   - 0.0-0.49: Unclear, hidden, or missing CTAs

3. **polish** (0-1): Does the design look professionally crafted and enterprise-ready?
   - 0.9-1.0: Polished, modern design with consistent styling and attention to detail
   - 0.7-0.89: Professional with minor rough edges or inconsistencies
   - 0.5-0.69: Functional but basic styling, lacks refinement
   - 0.0-0.49: Unprofessional appearance, looks unfinished

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "layout": 0.XX,
  "clarity": 0.XX,
  "polish": 0.XX,
  "reasoning": "Detailed explanation of scores with specific observations"
}`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }],
      max_tokens: 500,
      temperature: 0.3
    });

    // Parse the response
    const content = response.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const evaluation = JSON.parse(jsonStr);

    // Validate scores are in range
    const subScores = {
      layout: Math.max(0, Math.min(1, parseFloat(evaluation.layout) || 0)),
      clarity: Math.max(0, Math.min(1, parseFloat(evaluation.clarity) || 0)),
      polish: Math.max(0, Math.min(1, parseFloat(evaluation.polish) || 0))
    };

    const result = {
      pass: Object.values(subScores).every(score => score >= SCORE_THRESHOLD),
      subScores,
      reasoning: evaluation.reasoning || 'No reasoning provided',
      screenshotPath
    };

    return result;
  } catch (error) {
    console.error('Error evaluating screenshot:', error.message);
    
    // Fallback to low scores on error
    return {
      pass: false,
      subScores: {
        layout: 0.0,
        clarity: 0.0,
        polish: 0.0
      },
      reasoning: `Evaluation failed: ${error.message}`,
      screenshotPath,
      error: error.message
    };
  }
}

/**
 * Capture screenshot with labeled filename
 */
async function captureScreenshot(page, label) {
  const dir = ensureScreenshotDir();
  const filename = `harness-${label}-${Date.now()}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

/**
 * Screenshot + Schema Primitive (Section 4.1)
 * 
 * Validates UI/UX quality via visual inspection
 * - Captures full-page screenshot
 * - Evaluates visual correctness using GPT-4 Vision
 * - Returns structured result with pass/fail and subScores
 * 
 * @param {Object} params
 * @param {string} params.url - URL path to navigate to
 * @param {string} params.schema - Schema identifier (for future LLM integration)
 * @returns {Promise<Object>} Result with pass, subScores, reasoning, screenshotPath
 */
export async function screenshotEval({ url, schema }) {
  let browser;
  let page;
  let sessionId;

  try {
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;

    await page.goto(`${config.frontendUrl}${url}`);
    await page.waitForLoadState('networkidle');

    const screenshotPath = await captureScreenshot(page, schema || 'screenshot');
    const evaluation = await evaluateScreenshot({ screenshotPath, schema });

    return {
      pass: evaluation.pass,
      subScores: evaluation.subScores,
      reasoning: evaluation.reasoning,
      screenshotPath,
      sessionId
    };
  } catch (error) {
    if (page) await screenshotOnFailure(page, 'harness-screenshot-eval-error');
    return {
      pass: false,
      subScores: { layout: 0, clarity: 0, polish: 0 },
      reasoning: error.message,
      screenshotPath: null,
      sessionId
    };
  } finally {
    await closeBrowser(browser, sessionId);
  }
}

/**
 * Create test user via API
 */
async function createTestUser() {
  const testUser = {
    email: `harness-test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    handle: `harnesstest${Date.now()}`
  };

  const response = await apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(testUser)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to create test user');
  }

  return testUser;
}

/**
 * Network Manipulation Primitive (Section 4.3)
 * 
 * Tests robustness by manipulating network conditions
 * - mode: 'observe' - normal network conditions
 * - mode: 'fail' - inject network failures at specified routes
 * 
 * @param {Object} params
 * @param {string} params.url - Target URL to test
 * @param {string} params.mode - 'observe' or 'fail'
 * @param {Object} params.intercept - Failure injection config (route, status, body)
 * @param {Object} params.expectation - Expected UI state (selector)
 * @returns {Promise<Object>} Result with pass, mode, selector, screenshotPath
 */
export async function networkIntercept({ url, mode = 'observe', intercept, expectation }) {
  let browser;
  let page;
  let sessionId;

  try {
    const testUser = await createTestUser();
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;

    // Inject network failure if mode is 'fail'
    if (mode === 'fail' && intercept?.route) {
      await page.route(intercept.route, async (route) => {
        await route.fulfill({
          status: intercept.status || 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(intercept.body || { error: 'Injected failure' })
        });
      });
    }

    // Navigate to login page
    await page.goto(`${config.frontendUrl}/login`);
    await page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    if (emailInput) {
      await emailInput.fill(testUser.email);
    }

    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (passwordInput) {
      await passwordInput.fill(testUser.password);
    }

    // Submit form
    const submitButton = await page.$('button[type="submit"], button:has-text("Log In"), button:has-text("Login"), button:has-text("Sign In")');
    if (submitButton) {
      await submitButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });

    // Verify expected element is present
    const selector = expectation?.selector || '.dashboard';
    const element = await page.$(selector);
    const screenshotPath = await captureScreenshot(page, 'network-intercept');

    return {
      pass: Boolean(element),
      mode,
      selector,
      screenshotPath,
      sessionId
    };
  } catch (error) {
    if (page) await screenshotOnFailure(page, 'harness-network-intercept-error');
    return {
      pass: false,
      mode,
      selector: expectation?.selector || '.dashboard',
      screenshotPath: null,
      sessionId,
      error: error.message
    };
  } finally {
    await closeBrowser(browser, sessionId);
  }
}

export default {
  screenshotEval,
  networkIntercept
};

