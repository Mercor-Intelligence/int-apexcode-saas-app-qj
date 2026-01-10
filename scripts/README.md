# BioLink BrowserBase Verification Scripts

Automated browser verification scripts using **BrowserBase** cloud browsers. These scripts simulate real user interactions to verify the BioLink application works correctly.

## Overview

These scripts act as "Browser Use" agents that:
- Run in BrowserBase's cloud browser infrastructure
- Simulate user actions (navigation, clicking, form filling)
- Verify expected outcomes (redirects, content display, database state)
- Generate detailed test reports with session recordings

## Prerequisites

- Node.js 18+
- npm
- **BrowserBase account** ([browserbase.com](https://browserbase.com))
- Running BioLink application (frontend + backend)

## Installation

```bash
cd app/scripts
npm install
```

## Configuration

Create a `.env` file with your BrowserBase credentials:

```env
# BrowserBase credentials (required)
BROWSERBASE_API_KEY=your_api_key_here
BROWSERBASE_PROJECT_ID=your_project_id_here

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001

# Browser settings
TIMEOUT=30000
```

### Getting BrowserBase Credentials

1. Sign up at [browserbase.com](https://browserbase.com)
2. Create a new project
3. Copy your API key from Settings → API Keys
4. Copy your Project ID from the project dashboard

### Production Testing

```env
BROWSERBASE_API_KEY=your_api_key
BROWSERBASE_PROJECT_ID=your_project_id
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
npm run verify:signup      # Test user registration
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

Each verifier produces detailed console output with session links:

```
🚀 Starting Signup Verification (BrowserBase)...

Test User: signup-test-1704672000000@example.com / @signuptest1704672000000

  🌐 Creating BrowserBase session...
  📍 Session ID: sess_abc123
  🔗 Debug URL: https://browserbase.com/sessions/sess_abc123
  ✅ PASS: BrowserBase session created - Session: sess_abc123
Step 1: Navigate to landing page
  ✅ PASS: Landing page loads - Title: BioLink
...

============================================================
📊 Signup Verification - Results
============================================================
Total: 8 | Passed: 8 | Failed: 0
Duration: 12.45s
Status: ✅ ALL PASSED
============================================================
  ✅ Session completed: https://browserbase.com/sessions/sess_abc123
```

### Session Recordings

Every test run creates a BrowserBase session with:
- **Full video recording** of the browser
- **Network logs** for debugging
- **Console logs** from the page
- **DOM snapshots** at each step

Access recordings at: `https://browserbase.com/sessions/{session_id}`

### JSON Report

Running all verifiers generates a JSON report:

```json
{
  "timestamp": "2026-01-08T00:00:00.000Z",
  "duration": 75.23,
  "summary": {
    "total": 55,
    "passed": 53,
    "failed": 2,
    "overallPassed": false
  },
  "suites": [...]
}
```

## Debugging

### View Session Recording

Each test outputs a session URL. Click it to view:
- Video replay of the entire test
- Network requests/responses
- Console logs
- DOM snapshots

### Screenshots on Failure

Screenshots are automatically saved to `./screenshots/` when tests fail.

### Increase Timeout

```bash
TIMEOUT=60000 npm run verify:signup
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Browser Verification

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd app/scripts
          npm install
      
      - name: Run Browser Verifications
        env:
          BROWSERBASE_API_KEY: ${{ secrets.BROWSERBASE_API_KEY }}
          BROWSERBASE_PROJECT_ID: ${{ secrets.BROWSERBASE_PROJECT_ID }}
          FRONTEND_URL: ${{ vars.FRONTEND_URL }}
          BACKEND_URL: ${{ vars.BACKEND_URL }}
        run: |
          cd app/scripts
          npm test
```

## Extending

### Adding a New Verifier

1. Create `verifiers/my-feature.js`
2. Follow the pattern from existing verifiers
3. Add to `package.json` scripts
4. Import in `run-all-verifiers.js`

### Verifier Template

```javascript
import { launchBrowser, closeBrowser } from '../utils/browser.js';
import { config } from '../config.js';
import Reporter from '../utils/reporter.js';

async function verifyMyFeature() {
  const reporter = new Reporter('My Feature Verification');
  let browser, page, sessionId;
  
  try {
    // Launch BrowserBase session
    const browserSetup = await launchBrowser();
    browser = browserSetup.browser;
    page = browserSetup.page;
    sessionId = browserSetup.sessionId;
    
    reporter.record('BrowserBase session created', true, `Session: ${sessionId}`);
    
    // Your verification steps here
    await page.goto(config.frontendUrl);
    reporter.record('Step description', true/false, 'details');
    
  } catch (error) {
    reporter.record('Error', false, error.message);
  } finally {
    await closeBrowser(browser, sessionId);
  }
  
  return reporter.summary();
}

export default verifyMyFeature;
```

## Benefits of BrowserBase

| Feature | Local Playwright | BrowserBase |
|---------|-----------------|-------------|
| Browser Management | Manual | Cloud-managed |
| Session Recording | Extra setup | Built-in |
| Parallel Execution | Limited by machine | Scalable |
| CI/CD Integration | Complex | Simple |
| Debugging | Screenshots only | Full replay |
| Network Logs | Manual capture | Automatic |
