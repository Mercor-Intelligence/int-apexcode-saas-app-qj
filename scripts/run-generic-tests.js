/**
 * Run Generic Tests with Trajectory Logging
 * 
 * Runs flexible tests that work with any BioLink implementation.
 * 
 * Usage:
 *   node run-generic-tests.js                    # Run all generic tests
 *   node run-generic-tests.js --v3               # Save to trajectory_v3_x
 *   node run-generic-tests.js --v4               # Save to trajectory_v4_x
 *   FRONTEND_URL=https://... node run-generic-tests.js --v3
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import verifyHomepage from './verifiers/generic/homepage.js';
import verifySignup from './verifiers/generic/signup.js';
import verifyLogin from './verifiers/generic/login.js';
import verifyDashboard from './verifiers/generic/dashboard.js';
import verifyProfile from './verifiers/generic/profile.js';

import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine trajectory prefix based on flags
function getPrefix() {
  if (process.argv.includes('--v4')) return 'trajectory_v4_';
  if (process.argv.includes('--v3')) return 'trajectory_v3_';
  if (process.argv.includes('--v2')) return 'trajectory_v2_';
  return 'trajectory_gen_';
}

function getAppName() {
  if (process.argv.includes('--v4')) return 'BioLink V4';
  if (process.argv.includes('--v3')) return 'BioLink V3';
  if (process.argv.includes('--v2')) return 'BioLink V2';
  return 'BioLink';
}

// Get the next trajectory run number
function getNextRunNumber() {
  const baseDir = path.join(__dirname, '../');
  const prefix = getPrefix();
  const dirs = fs.readdirSync(baseDir).filter(d => d.startsWith(prefix));
  if (dirs.length === 0) return 1;
  
  const numbers = dirs.map(d => parseInt(d.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  return Math.max(...numbers) + 1;
}

// Create trajectory directory structure
function createTrajectoryDir(runNumber) {
  const prefix = getPrefix();
  const trajectoryDir = path.join(__dirname, '../', `${prefix}${runNumber}`);
  const agentLogsDir = path.join(trajectoryDir, 'agent-logs');
  const sessionsDir = path.join(trajectoryDir, 'sessions');
  
  fs.mkdirSync(trajectoryDir, { recursive: true });
  fs.mkdirSync(agentLogsDir, { recursive: true });
  fs.mkdirSync(sessionsDir, { recursive: true });
  
  return { trajectoryDir, agentLogsDir, sessionsDir };
}

// Log agent action
function logAgentAction(agentLogsDir, episodeNum, action, details) {
  const episodeDir = path.join(agentLogsDir, `episode-${episodeNum}`);
  fs.mkdirSync(episodeDir, { recursive: true });
  
  fs.writeFileSync(
    path.join(episodeDir, 'action.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      action,
      details
    }, null, 2)
  );
  
  return episodeDir;
}

async function runGenericTests() {
  const runNumber = getNextRunNumber();
  const { trajectoryDir, agentLogsDir, sessionsDir } = createTrajectoryDir(runNumber);
  
  const prefix = getPrefix();
  const appName = getAppName();
  
  console.log('\n' + '='.repeat(60));
  console.log(`${appName} Generic Verification - Run #${runNumber}`);
  console.log('='.repeat(60));
  console.log(`Trajectory: ${prefix}${runNumber}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  const allActions = [];
  const results = [];
  const startTime = Date.now();
  let episodeNum = 0;
  
  // Generic verifiers
  const verifiers = [
    { name: 'Homepage', fn: verifyHomepage },
    { name: 'Signup', fn: verifySignup },
    { name: 'Login', fn: verifyLogin },
    { name: 'Dashboard', fn: verifyDashboard },
    { name: 'Public Profile', fn: verifyProfile }
  ];
  
  // Run each verifier
  for (const verifier of verifiers) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Running: ${verifier.name} Verification`);
    console.log('─'.repeat(60));
    
    const action = {
      type: 'browser_verification',
      suite: verifier.name,
      url: config.frontendUrl,
      timestamp: new Date().toISOString()
    };
    
    allActions.push(action);
    const episodeDir = logAgentAction(agentLogsDir, episodeNum, verifier.name.toLowerCase().replace(/ /g, '-'), action);
    
    try {
      const result = await verifier.fn();
      results.push(result);
      
      fs.writeFileSync(
        path.join(episodeDir, 'result.json'),
        JSON.stringify(result, null, 2)
      );
      
      if (result.sessionUrl) {
        fs.writeFileSync(
          path.join(sessionsDir, `${verifier.name.toLowerCase().replace(/ /g, '-')}-session.txt`),
          result.sessionUrl
        );
      }
      
    } catch (error) {
      console.error(`Error running ${verifier.name}:`, error.message);
      const errorResult = {
        suite: verifier.name,
        total: 1,
        passed: 0,
        failed: 1,
        overallPassed: false,
        error: error.message
      };
      results.push(errorResult);
      
      fs.writeFileSync(
        path.join(episodeDir, 'result.json'),
        JSON.stringify(errorResult, null, 2)
      );
    }
    
    episodeNum++;
    
    // Small delay between verifiers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate combined report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalPassed = results.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);
  const allPassed = results.every(r => r.overallPassed);
  
  // Build evaluation results
  const evalResults = {
    run_number: runNumber,
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(totalDuration),
    test_type: 'generic',
    config: {
      frontend_url: config.frontendUrl,
      browserbase_project: config.browserbase.projectId ? 'configured' : 'not configured'
    },
    summary: {
      total_tests: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      pass_rate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) + '%' : '0%',
      overall_passed: allPassed
    },
    suites: results.map(r => ({
      name: r.suite,
      total: r.total || 0,
      passed: r.passed || 0,
      failed: r.failed || 0,
      suite_passed: r.overallPassed,
      session_url: r.sessionUrl || null,
      tests: r.tests || [],
      error: r.error || null
    }))
  };
  
  // Build agent actions log
  const agentActionsLog = {
    run_number: runNumber,
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: parseFloat(totalDuration),
    total_episodes: episodeNum,
    actions: allActions.map((action, idx) => ({
      episode: idx,
      ...action,
      result: results[idx] ? {
        passed: results[idx].overallPassed,
        tests_passed: results[idx].passed,
        tests_failed: results[idx].failed
      } : null
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
  const summary = `
${appName} Generic Verification - Run #${runNumber}
${'='.repeat(50)}

Started:  ${new Date(startTime).toISOString()}
Finished: ${new Date().toISOString()}
Duration: ${totalDuration}s
Test URL: ${config.frontendUrl}

RESULTS
${'─'.repeat(50)}
${results.map(r => `${r.overallPassed ? '[PASS]' : '[FAIL]'} ${r.suite}: ${r.passed}/${r.total} passed`).join('\n')}

OVERALL SUMMARY
${'─'.repeat(50)}
Total Tests:      ${totalTests}
Passed:           ${totalPassed}
Failed:           ${totalFailed}
Pass Rate:        ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%
Overall:          ${allPassed ? 'PASSED' : 'FAILED'}

SESSION RECORDINGS
${'─'.repeat(50)}
${results.filter(r => r.sessionUrl).map(r => `${r.suite}: ${r.sessionUrl}`).join('\n') || 'No sessions recorded'}
`.trim();
  
  fs.writeFileSync(
    path.join(trajectoryDir, 'summary.txt'),
    summary
  );
  
  // Print report
  console.log('\n' + '='.repeat(60));
  console.log('VERIFICATION REPORT');
  console.log('='.repeat(60));
  
  for (const result of results) {
    const status = result.overallPassed ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${result.suite}: ${result.passed}/${result.total} passed`);
    if (result.sessionUrl) {
      console.log(`       Session: ${result.sessionUrl}`);
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`Passed:        ${totalPassed}`);
  console.log(`Failed:        ${totalFailed}`);
  console.log(`Pass Rate:     ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`);
  console.log(`Duration:      ${totalDuration}s`);
  console.log(`Overall:       ${allPassed ? '[PASS] ALL SUITES PASSED' : '[FAIL] SOME SUITES FAILED'}`);
  console.log('='.repeat(60));
  
  console.log(`\nTrajectory saved to: ${prefix}${runNumber}/`);
  
  return { passed: allPassed, runNumber };
}

// Run
runGenericTests().then(({ passed, runNumber }) => {
  console.log(`\nRun #${runNumber} completed ${passed ? 'successfully' : 'with failures'}\n`);
  process.exit(passed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

