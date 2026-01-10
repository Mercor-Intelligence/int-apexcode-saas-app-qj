/**
 * Run Trajectory with Simulated Low Pass Rate (~20%)
 * 
 * This script simulates a scenario where most tests fail
 * to demonstrate partial failure trajectories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the next trajectory run number
function getNextRunNumber() {
  const baseDir = path.join(__dirname, '../../');
  const dirs = fs.readdirSync(baseDir).filter(d => d.startsWith('trajectory_run_'));
  if (dirs.length === 0) return 1;
  
  const numbers = dirs.map(d => parseInt(d.replace('trajectory_run_', ''), 10)).filter(n => !isNaN(n));
  return Math.max(...numbers) + 1;
}

// Create trajectory directory structure
function createTrajectoryDir(runNumber) {
  const trajectoryDir = path.join(__dirname, '../../', `trajectory_run_${runNumber}`);
  const agentLogsDir = path.join(trajectoryDir, 'agent-logs');
  const sessionsDir = path.join(trajectoryDir, 'sessions');
  
  fs.mkdirSync(trajectoryDir, { recursive: true });
  fs.mkdirSync(agentLogsDir, { recursive: true });
  fs.mkdirSync(sessionsDir, { recursive: true });
  
  return { trajectoryDir, agentLogsDir, sessionsDir };
}

// Simulate test with controlled pass/fail rate
function simulateTest(name, shouldPass) {
  return {
    test: name,
    passed: shouldPass,
    details: shouldPass ? 'Test passed' : 'Simulated failure - element not found or timeout',
    timestamp: new Date().toISOString()
  };
}

async function runLowPassTrajectory() {
  const runNumber = getNextRunNumber();
  const { trajectoryDir, agentLogsDir, sessionsDir } = createTrajectoryDir(runNumber);
  
  console.log('\n' + '='.repeat(60));
  console.log(`BioLink Browser Verification - Run #${runNumber}`);
  console.log('='.repeat(60));
  console.log(`Trajectory: trajectory_run_${runNumber}`);
  console.log(`Mode: Low Pass Rate Simulation (~20%)`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  const startTime = Date.now();
  const results = [];
  let episodeNum = 0;
  
  // Define test suites with simulated results (~20% pass rate)
  const suites = [
    {
      name: 'Signup Verification',
      tests: [
        { name: 'BrowserBase session created', pass: true },
        { name: 'Signup page loads', pass: false },
        { name: 'Fill handle field', pass: false },
        { name: 'Handle is available', pass: false },
        { name: 'Continue to step 2', pass: false },
        { name: 'Fill email field', pass: false },
        { name: 'Fill password field', pass: false },
        { name: 'Continue to step 3', pass: false },
        { name: 'Select category', pass: false },
        { name: 'Submit signup form', pass: false },
        { name: 'Redirected to dashboard', pass: false },
        { name: 'User record exists in database', pass: false }
      ]
    },
    {
      name: 'Login Verification',
      tests: [
        { name: 'Test user created via API', pass: true },
        { name: 'BrowserBase session created', pass: true },
        { name: 'Login page loads', pass: false },
        { name: 'Fill email field', pass: false },
        { name: 'Fill password field', pass: false },
        { name: 'Submit login form', pass: false },
        { name: 'Redirected to dashboard', pass: false },
        { name: 'JWT token stored in localStorage', pass: false },
        { name: 'Dashboard content loads', pass: false },
        { name: 'Protected API accessible with token', pass: false }
      ]
    },
    {
      name: 'Link Management Verification',
      tests: [
        { name: 'Test user created', pass: true },
        { name: 'BrowserBase session created', pass: false },
        { name: 'Login successful', pass: false },
        { name: 'Links tab visible', pass: false },
        { name: 'Click Add Link button', pass: false },
        { name: 'Fill title field', pass: false },
        { name: 'Fill URL field', pass: false },
        { name: 'Submit new link', pass: false },
        { name: 'Link appears in list', pass: false },
        { name: 'Link item element exists', pass: false },
        { name: 'Link exists in database', pass: false },
        { name: 'Toggle link visibility', pass: false },
        { name: 'Delete link action', pass: false },
        { name: 'Link removed from list', pass: false },
        { name: 'Link removed from database', pass: false }
      ]
    },
    {
      name: 'Profile Management Verification',
      tests: [
        { name: 'Test user created', pass: true },
        { name: 'BrowserBase session created', pass: false },
        { name: 'Login successful', pass: false },
        { name: 'Navigate to Appearance tab', pass: false },
        { name: 'Fill profile title', pass: false },
        { name: 'Fill bio', pass: false },
        { name: 'Title visible in preview', pass: false },
        { name: 'Bio visible in preview', pass: false },
        { name: 'Title saved to database', pass: false },
        { name: 'Bio saved to database', pass: false },
        { name: 'Change theme selection', pass: false },
        { name: 'Title visible on public profile', pass: false },
        { name: 'Bio visible on public profile', pass: false }
      ]
    },
    {
      name: 'Public Profile Verification',
      tests: [
        { name: 'Test user created', pass: true },
        { name: 'Profile data set', pass: true },
        { name: 'Visible link created', pass: false },
        { name: 'Hidden link created', pass: false },
        { name: 'BrowserBase session created', pass: false },
        { name: 'Public profile page loads', pass: false },
        { name: 'Profile title is visible', pass: false },
        { name: 'Bio is visible', pass: false },
        { name: 'Visible link is displayed', pass: false },
        { name: 'Hidden link is NOT displayed', pass: false },
        { name: 'Link button element found', pass: false },
        { name: 'Avatar element present', pass: false },
        { name: '404 page for invalid handle', pass: false },
        { name: 'Page view tracked', pass: false }
      ]
    },
    {
      name: 'Analytics Verification',
      tests: [
        { name: 'Test user created', pass: true },
        { name: 'Test link created', pass: false },
        { name: 'BrowserBase session created', pass: false },
        { name: 'Public profile visited', pass: false },
        { name: 'Link clicked', pass: false },
        { name: 'Views count recorded', pass: false },
        { name: 'Clicks count recorded', pass: false },
        { name: 'Login to dashboard', pass: false },
        { name: 'Navigate to Analytics tab', pass: false },
        { name: 'Dashboard shows analytics data', pass: false },
        { name: 'Analytics page has content', pass: false }
      ]
    }
  ];
  
  // Process each suite
  for (const suite of suites) {
    console.log(`\n${'-'.repeat(60)}`);
    console.log(`Running: ${suite.name}`);
    console.log('-'.repeat(60));
    
    const episodeDir = path.join(agentLogsDir, `episode-${episodeNum}`);
    fs.mkdirSync(episodeDir, { recursive: true });
    
    // Save action
    fs.writeFileSync(
      path.join(episodeDir, 'action.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: suite.name.toLowerCase().replace(/ /g, '-'),
        details: {
          type: 'browser_verification',
          suite: suite.name,
          url: config.frontendUrl
        }
      }, null, 2)
    );
    
    const testResults = [];
    let passed = 0;
    let failed = 0;
    
    for (const test of suite.tests) {
      const result = simulateTest(test.name, test.pass);
      testResults.push(result);
      
      if (result.passed) {
        passed++;
        console.log(`  [PASS] ${test.name}`);
      } else {
        failed++;
        console.log(`  [FAIL] ${test.name}`);
      }
      
      // Small delay to simulate real execution
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const suiteResult = {
      suite: suite.name,
      total: suite.tests.length,
      passed,
      failed,
      duration: (Math.random() * 10 + 2).toFixed(2),
      results: testResults,
      overallPassed: failed === 0
    };
    
    results.push(suiteResult);
    
    // Save result
    fs.writeFileSync(
      path.join(episodeDir, 'result.json'),
      JSON.stringify(suiteResult, null, 2)
    );
    
    console.log(`\n  Suite: ${passed}/${suite.tests.length} passed (${((passed/suite.tests.length)*100).toFixed(0)}%)`);
    
    episodeNum++;
  }
  
  // Calculate totals
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const passRate = ((totalPassed / totalTests) * 100).toFixed(2);
  const allPassed = results.every(r => r.overallPassed);
  
  // Build evaluation results
  const evalResults = {
    run_number: runNumber,
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(totalDuration),
    mode: 'low_pass_rate_simulation',
    config: {
      frontend_url: config.frontendUrl,
      backend_url: config.backendUrl,
      browserbase_project: config.browserbase.projectId ? 'configured' : 'not configured'
    },
    summary: {
      total_tests: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      pass_rate: passRate + '%',
      overall_passed: allPassed
    },
    suites: results.map(r => ({
      name: r.suite,
      total: r.total,
      passed: r.passed,
      failed: r.failed,
      pass_rate: ((r.passed / r.total) * 100).toFixed(2) + '%',
      overall_passed: r.overallPassed,
      tests: r.results,
      error: null
    }))
  };
  
  // Build agent actions log
  const agentActionsLog = {
    run_number: runNumber,
    mode: 'low_pass_rate_simulation',
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: parseFloat(totalDuration),
    total_episodes: episodeNum,
    actions: results.map((r, idx) => ({
      episode: idx,
      type: 'browser_verification',
      suite: r.suite,
      url: config.frontendUrl,
      timestamp: new Date(startTime + idx * 1000).toISOString(),
      result: {
        passed: r.overallPassed,
        tests_passed: r.passed,
        tests_failed: r.failed,
        pass_rate: ((r.passed / r.total) * 100).toFixed(2) + '%'
      }
    }))
  };
  
  // Save files
  fs.writeFileSync(
    path.join(trajectoryDir, 'eval_results.json'),
    JSON.stringify(evalResults, null, 2)
  );
  
  fs.writeFileSync(
    path.join(trajectoryDir, 'agent_actions.json'),
    JSON.stringify(agentActionsLog, null, 2)
  );
  
  // Save summary
  const summary = `BioLink Browser Verification - Run #${runNumber}
${'='.repeat(50)}

Mode: Low Pass Rate Simulation
Started:  ${new Date(startTime).toISOString()}
Finished: ${new Date().toISOString()}
Duration: ${totalDuration}s

RESULTS
${'-'.repeat(50)}
${results.map(r => `${r.overallPassed ? 'PASS' : 'FAIL'} ${r.suite}: ${r.passed}/${r.total} (${((r.passed/r.total)*100).toFixed(0)}%)`).join('\n')}

SUMMARY
${'-'.repeat(50)}
Total Tests: ${totalTests}
Passed:      ${totalPassed}
Failed:      ${totalFailed}
Pass Rate:   ${passRate}%
Overall:     ${allPassed ? 'PASSED' : 'FAILED'}

FAILURE REASONS
${'-'.repeat(50)}
- BrowserBase session creation failures
- Element not found errors
- Navigation timeouts
- Form submission failures
- Database verification failures
`;
  
  fs.writeFileSync(
    path.join(trajectoryDir, 'summary.txt'),
    summary
  );
  
  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION REPORT');
  console.log('='.repeat(60));
  
  console.log('\nSuite Results:');
  for (const result of results) {
    const status = result.overallPassed ? 'PASS' : 'FAIL';
    const pct = ((result.passed / result.total) * 100).toFixed(0);
    console.log(`  [${status}] ${result.suite}: ${result.passed}/${result.total} (${pct}%)`);
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`Passed:        ${totalPassed}`);
  console.log(`Failed:        ${totalFailed}`);
  console.log(`Pass Rate:     ${passRate}%`);
  console.log(`Duration:      ${totalDuration}s`);
  console.log(`Overall:       ${allPassed ? 'PASSED' : 'FAILED'}`);
  console.log('='.repeat(60));
  
  console.log(`\nTrajectory saved to: trajectory_run_${runNumber}/`);
  console.log('  - eval_results.json');
  console.log('  - agent_actions.json');
  console.log('  - summary.txt');
  console.log('  - agent-logs/ (per-episode logs)\n');
  
  return { passed: allPassed, runNumber, passRate };
}

// Run
runLowPassTrajectory().then(({ passed, runNumber, passRate }) => {
  console.log(`Run #${runNumber} completed with ${passRate}% pass rate\n`);
  process.exit(passed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

