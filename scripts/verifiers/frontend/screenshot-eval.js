/**
 * BrowserBase Verification Script: Screenshot Eval (UI Quality)
 * 
 * Actions:
 * 1. Navigate to landing page
 * 2. Navigate to signup page
 * 3. Capture screenshots
 * 
 * Verifications:
 * - Screenshots captured
 * - Placeholder visual evaluation returns passing scores
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { launchBrowser, closeBrowser, screenshotOnFailure } from '../../utils/browser.js';
import { config } from '../../config.js';
import Reporter from '../../utils/reporter.js';

const SCORE_THRESHOLD = 0.7;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
 */
async function evaluateScreenshot({ screenshotPath, schema = 'page' }) {
  try {
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Evaluate this ${schema} screenshot. Rate on 0-1 scale:
1. layout: Page organization and structure
2. clarity: Visibility of CTAs and key elements  
3. polish: Professional design quality

Return JSON: {"layout": 0.XX, "clarity": 0.XX, "polish": 0.XX, "reasoning": "..."}`
          },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${base64Image}` }
          }
        ]
      }],
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0].message.content.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const evaluation = JSON.parse(content);

    const subScores = {
      layout: Math.max(0, Math.min(1, parseFloat(evaluation.layout) || 0)),
      clarity: Math.max(0, Math.min(1, parseFloat(evaluation.clarity) || 0)),
      polish: Math.max(0, Math.min(1, parseFloat(evaluation.polish) || 0))
    };

    return {
      pass: Object.values(subScores).every(score => score >= SCORE_THRESHOLD),
      subScores,
      reasoning: evaluation.reasoning || 'No reasoning provided',
      screenshotPath
    };
  } catch (error) {
    console.error('Error evaluating screenshot:', error.message);
    return {
      pass: false,
      subScores: { layout: 0.0, clarity: 0.0, polish: 0.0 },
      reasoning: `Evaluation failed: ${error.message}`,
      screenshotPath,
      error: error.message
    };
  }
}

async function captureScreenshot(page, label) {
  const dir = ensureScreenshotDir();
  const filename = `screenshot-eval-${label}-${Date.now()}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function verifyScreenshotEval() {
  const reporter = new Reporter('Screenshot Eval Verification');
  let browser, page, sessionId;

  console.log('\n🚀 Starting Screenshot Eval Verification (BrowserBase)...\n');

  try {
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;

    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);

    console.log('Step 1: Navigate to landing page');
    await page.goto(config.frontendUrl);
    await page.waitForLoadState('networkidle');
    reporter.record('Landing page loads', true, page.url());

    const landingScreenshot = await captureScreenshot(page, 'landing');
    reporter.record('Landing page screenshot captured', true, landingScreenshot);

    console.log('  Evaluating with GPT-4 Vision...');
    const landingEval = await evaluateScreenshot({ screenshotPath: landingScreenshot, schema: 'landing page' });
    reporter.record(
      'Landing page visual score meets threshold',
      landingEval.pass,
      `Scores: ${JSON.stringify(landingEval.subScores)} - ${landingEval.reasoning}`
    );

    console.log('Step 2: Navigate to signup page');
    await page.goto(`${config.frontendUrl}/signup`);
    await page.waitForLoadState('networkidle');
    reporter.record('Signup page loads', true, page.url());

    const signupScreenshot = await captureScreenshot(page, 'signup');
    reporter.record('Signup page screenshot captured', true, signupScreenshot);

    console.log('  Evaluating with GPT-4 Vision...');
    const signupEval = await evaluateScreenshot({ screenshotPath: signupScreenshot, schema: 'signup page' });
    reporter.record(
      'Signup page visual score meets threshold',
      signupEval.pass,
      `Scores: ${JSON.stringify(signupEval.subScores)} - ${signupEval.reasoning}`
    );
  } catch (error) {
    console.error('Verification error:', error.message);
    if (page) await screenshotOnFailure(page, 'screenshot-eval-error');
    reporter.record('Screenshot eval flow completion', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }

  return reporter.summary();
}

if (process.argv[1].includes('screenshot-eval.js')) {
  verifyScreenshotEval().then((result) => {
    process.exit(result.overallPassed ? 0 : 1);
  });
}

export default verifyScreenshotEval;

