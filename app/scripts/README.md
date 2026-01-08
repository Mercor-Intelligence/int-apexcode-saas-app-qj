# BioLink Browser Verification Scripts

Automated browser verification scripts that simulate real user interactions to test the BioLink application. Uses Playwright for browser automation.

## Overview

These scripts act as "Browser Use" agents that verify the application works correctly by:
- Simulating user actions (navigation, clicking, form filling)
- Verifying expected outcomes (redirects, content display, database state)
- Generating detailed test reports

## Prerequisites

- Node.js 18+
- npm
- Running BioLink application (frontend + backend)

## Installation

```bash
cd app/scripts
npm install
```

## Configuration

Create a `.env` file or set environment variables:

```env
# Application URLs (defaults to localhost)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Browser settings
HEADLESS=true          # Run browser in headless mode
SLOW_MO=0              # Slow down actions (ms) for debugging
TIMEOUT=30000          # Default timeout (ms)
```

For production testing:

```env
FRONTEND_URL=https://your-frontend.vercel.app
BACKEND_URL=https://your-backend.vercel.app
```

## Running Verifiers

### Run All Verifiers

```bash
npm test
# or
npm run verify:all
```

### Run Individual Verifiers

```bash
npm run verify:signup      # Test signup flow
npm run verify:login       # Test login flow
npm run verify:links       # Test link management
npm run verify:profile     # Test profile customization
npm run verify:public      # Test public profile page
npm run verify:analytics   # Test analytics tracking
```

## Verification Suites

### 1. Signup Verification (`verifiers/signup.js`)

**Actions:**
1. Navigate to landing page
2. Click "Sign Up" button
3. Fill email, password, handle
4. Submit form

**Verifications:**
- Landing page loads
- Navigation to signup page
- Form fields fillable
- Redirect to dashboard on success
- User record created in database

### 2. Login Verification (`verifiers/login.js`)

**Actions:**
1. Create test user via API
2. Navigate to login page
3. Fill credentials
4. Submit form

**Verifications:**
- Login page loads
- Form submission works
- Redirect to dashboard
- JWT token stored
- Protected API accessible

### 3. Link Management (`verifiers/links.js`)

**Actions:**
1. Login as test user
2. Navigate to Links tab
3. Add a new link
4. Edit the link
5. Toggle visibility
6. Delete the link

**Verifications:**
- Link appears after creation
- Link updates correctly
- Visibility toggles work
- Link removed after deletion
- Database state matches UI

### 4. Profile Management (`verifiers/profile.js`)

**Actions:**
1. Login as test user
2. Navigate to Appearance tab
3. Update display name
4. Update bio
5. Change theme

**Verifications:**
- Profile form loads
- Changes visible in preview
- Changes persist in database
- Theme applies correctly
- Public profile reflects changes

### 5. Public Profile (`verifiers/public-profile.js`)

**Actions:**
1. Create user with profile/links via API
2. Navigate to /@handle
3. Verify content
4. Click on links

**Verifications:**
- Page loads for valid handle
- Display name visible
- Bio visible
- Avatar displayed
- Visible links shown
- Hidden links NOT shown
- Links clickable
- 404 for invalid handle
- View tracking works

### 6. Analytics (`verifiers/analytics.js`)

**Actions:**
1. Create user with links via API
2. Visit public profile (view)
3. Click on link (click)
4. Check Analytics tab

**Verifications:**
- Views tracked
- Clicks tracked
- CTR calculated
- Per-link stats available
- Dashboard displays metrics

## Output

### Console Output

Each verifier produces detailed console output:

```
🚀 Starting Signup Verification...

Test User: signup-test-1704672000000@example.com / @signuptest1704672000000

Step 1: Navigate to landing page
  ✅ PASS: Landing page loads - Title: BioLink
Step 2: Click Sign Up button
  ✅ PASS: Navigate to signup page
...

============================================================
📊 Signup Verification - Results
============================================================
Total: 7 | Passed: 7 | Failed: 0
Duration: 5.23s
Status: ✅ ALL PASSED
============================================================
```

### JSON Report

Running all verifiers generates a JSON report:

```json
{
  "timestamp": "2026-01-08T00:00:00.000Z",
  "duration": 45.67,
  "summary": {
    "total": 50,
    "passed": 48,
    "failed": 2,
    "overallPassed": false
  },
  "suites": [...]
}
```

### Screenshots

On failure, screenshots are saved to `./screenshots/` for debugging.

## Debugging

### Run with visible browser

```bash
HEADLESS=false npm run verify:signup
```

### Run with slow motion

```bash
SLOW_MO=500 npm run verify:signup
```

### Run with both

```bash
HEADLESS=false SLOW_MO=500 npm run verify:login
```

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Run Browser Verifications
  run: |
    cd app/scripts
    npm install
    npm test
  env:
    FRONTEND_URL: ${{ env.VERCEL_FRONTEND_URL }}
    BACKEND_URL: ${{ env.VERCEL_BACKEND_URL }}
    HEADLESS: true
```

## Extending

### Adding a new verifier

1. Create `verifiers/my-feature.js`
2. Follow the pattern from existing verifiers
3. Add to `package.json` scripts
4. Import in `run-all-verifiers.js`

### Verifier template

```javascript
import { launchBrowser, closeBrowser } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyMyFeature() {
  const reporter = new Reporter('My Feature Verification');
  let browser, page;
  
  try {
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    
    // Your verification steps here
    reporter.record('Step description', true/false, 'details');
    
  } catch (error) {
    reporter.record('Error', false, error.message);
  } finally {
    await closeBrowser(browser);
  }
  
  return reporter.summary();
}

export default verifyMyFeature;
```

