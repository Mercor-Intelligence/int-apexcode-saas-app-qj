/**
 * Run BrowserBase Verification with Trajectory Logging
 * 
 * Executes all verifiers and saves agent actions and results to trajectory_run_x directories
 * 
 * Usage:
 *   node run-with-trajectory.js             # Run all frontend verifiers
 *   node run-with-trajectory.js --basic     # Run basic frontend verifiers only
 *   node run-with-trajectory.js --advanced  # Run advanced frontend verifiers only
 *   node run-with-trajectory.js --backend   # Run backend API verifiers only
 *   node run-with-trajectory.js --all       # Run both frontend and backend verifiers
 *   node run-with-trajectory.js --full      # Run full journey test
 *   node run-with-trajectory.js --v2        # Save to trajectory_v2_x
 *   node run-with-trajectory.js --v3        # Save to trajectory_v3_x
 *   node run-with-trajectory.js --v4        # Save to trajectory_v4_x
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Frontend verifiers
import verifySignup from './verifiers/frontend/signup.js';
import verifyLogin from './verifiers/frontend/login.js';
import verifyLinks from './verifiers/frontend/links.js';
import verifyProfile from './verifiers/frontend/profile.js';
import verifyPublicProfile from './verifiers/frontend/public-profile.js';
import verifyAnalytics from './verifiers/frontend/analytics.js';
import verifyFullJourney from './verifiers/frontend/full-journey.js';
// Advanced frontend verifiers
import verifyPasswordValidation from './verifiers/frontend/password-validation.js';
import verifyHandleValidation from './verifiers/frontend/handle-validation.js';
import verifyBioLimits from './verifiers/frontend/bio-limits.js';
import verifyLinkBehavior from './verifiers/frontend/link-behavior.js';
import verifyThemeAnd404 from './verifiers/frontend/theme-and-404.js';
import verifyAnalyticsAdvanced from './verifiers/frontend/analytics-advanced.js';
import verifyResponsiveA11y from './verifiers/frontend/responsive-a11y.js';

// Backend verifiers
import { verifyAuthAPI } from './verifiers/backend/auth-api.js';
import { verifyLinksAPI } from './verifiers/backend/links-api.js';
import { verifyProfileAPI } from './verifiers/backend/profile-api.js';
import { verifyAnalyticsAPI } from './verifiers/backend/analytics-api.js';
import { verifyPublicAPI } from './verifiers/backend/public-api.js';
import { verifyValidationAPI } from './verifiers/backend/validation-api.js';

import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the next trajectory run number
function getNextRunNumber() {
  const baseDir = path.join(__dirname, '../');
  // Check for version flags to pick trajectory prefix
  const useV2Naming = process.argv.includes('--v2');
  const useV3Naming = process.argv.includes('--v3');
  const useV4Naming = process.argv.includes('--v4');
  const prefix = useV4Naming
    ? 'trajectory_v4_'
    : useV3Naming
      ? 'trajectory_v3_'
      : useV2Naming
        ? 'trajectory_v2_'
        : 'trajectory_run_';
  const dirs = fs.readdirSync(baseDir).filter(d => d.startsWith(prefix));
  if (dirs.length === 0) return useV4Naming || useV3Naming || useV2Naming ? 1 : 6; // Start at 6 for trajectory_run_
  
  const numbers = dirs.map(d => parseInt(d.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  return Math.max(...numbers) + 1;
}

// Create trajectory directory structure
function createTrajectoryDir(runNumber) {
  const useV2Naming = process.argv.includes('--v2');
  const useV3Naming = process.argv.includes('--v3');
  const useV4Naming = process.argv.includes('--v4');
  const prefix = useV4Naming
    ? 'trajectory_v4_'
    : useV3Naming
      ? 'trajectory_v3_'
      : useV2Naming
        ? 'trajectory_v2_'
        : 'trajectory_run_';
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
  
  // Save action details
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

async function runWithTrajectory() {
  const runNumber = getNextRunNumber();
  const { trajectoryDir, agentLogsDir, sessionsDir } = createTrajectoryDir(runNumber);
  
  const useV2Naming = process.argv.includes('--v2');
  const useV3Naming = process.argv.includes('--v3');
  const useV4Naming = process.argv.includes('--v4');
  const prefix = useV4Naming
    ? 'trajectory_v4_'
    : useV3Naming
      ? 'trajectory_v3_'
      : useV2Naming
        ? 'trajectory_v2_'
        : 'trajectory_run_';
  const appName = useV4Naming ? 'BioLink V4' : useV3Naming ? 'BioLink V3' : useV2Naming ? 'BioLink V2' : 'BioLink';
  
  console.log('\n' + '='.repeat(60));
  console.log(`${appName} Verification - Run #${runNumber}`);
  console.log('='.repeat(60));
  console.log(`Trajectory: ${prefix}${runNumber}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  const allActions = [];
  const results = [];
  const startTime = Date.now();
  let episodeNum = 0;
  
  // Frontend verifiers
  const basicFrontendVerifiers = [
    { name: 'Signup', fn: verifySignup, type: 'frontend' },
    { name: 'Login', fn: verifyLogin, type: 'frontend' },
    { name: 'Links', fn: verifyLinks, type: 'frontend' },
    { name: 'Profile', fn: verifyProfile, type: 'frontend' },
    { name: 'Public Profile', fn: verifyPublicProfile, type: 'frontend' },
    { name: 'Analytics', fn: verifyAnalytics, type: 'frontend' }
  ];
  
  const advancedFrontendVerifiers = [
    { name: 'Password Validation', fn: verifyPasswordValidation, type: 'frontend' },
    { name: 'Handle Validation', fn: verifyHandleValidation, type: 'frontend' },
    { name: 'Bio Limits', fn: verifyBioLimits, type: 'frontend' },
    { name: 'Link Behavior', fn: verifyLinkBehavior, type: 'frontend' },
    { name: 'Theme & 404', fn: verifyThemeAnd404, type: 'frontend' },
    { name: 'Advanced Analytics', fn: verifyAnalyticsAdvanced, type: 'frontend' },
    { name: 'Responsive & A11y', fn: verifyResponsiveA11y, type: 'frontend' }
  ];
  
  // Backend verifiers
  const backendVerifiers = [
    { name: 'Auth API', fn: verifyAuthAPI, type: 'backend' },
    { name: 'Links API', fn: verifyLinksAPI, type: 'backend' },
    { name: 'Profile API', fn: verifyProfileAPI, type: 'backend' },
    { name: 'Analytics API', fn: verifyAnalyticsAPI, type: 'backend' },
    { name: 'Public API', fn: verifyPublicAPI, type: 'backend' },
    { name: 'Validation API', fn: verifyValidationAPI, type: 'backend' }
  ];
  
  // Determine which verifiers to run
  const runBasicOnly = process.argv.includes('--basic');
  const runAdvancedOnly = process.argv.includes('--advanced');
  const runBackendOnly = process.argv.includes('--backend');
  const runAll = process.argv.includes('--all');
  const runFullJourney = process.argv.includes('--full');
  
  let verifiers = [];
  
  if (runFullJourney) {
    console.log('Running Full Journey Test...\n');
    
    const action = {
      type: 'browser_verification',
      suite: 'Full Journey',
      url: config.frontendUrl,
      timestamp: new Date().toISOString()
    };
    
    allActions.push(action);
    logAgentAction(agentLogsDir, episodeNum, 'full-journey', action);
    
    try {
      const result = await verifyFullJourney();
      results.push(result);
      
      const episodeDir = path.join(agentLogsDir, `episode-${episodeNum}`);
      fs.writeFileSync(
        path.join(episodeDir, 'result.json'),
        JSON.stringify(result, null, 2)
      );
      
      if (result.sessionUrl) {
        fs.writeFileSync(
          path.join(sessionsDir, 'full-journey-session.txt'),
          result.sessionUrl
        );
      }
    } catch (error) {
      console.error('Full Journey Error:', error.message);
      results.push({
        suite: 'Full Journey',
        total: 1,
        passed: 0,
        failed: 1,
        overallPassed: false,
        error: error.message
      });
    }
  } else {
    if (runBackendOnly) {
      verifiers = backendVerifiers;
      console.log('Running BACKEND API verifiers only\n');
    } else if (runAll) {
      verifiers = [...basicFrontendVerifiers, ...advancedFrontendVerifiers, ...backendVerifiers];
      console.log('Running ALL verifiers (frontend + backend)\n');
    } else if (runBasicOnly) {
      verifiers = basicFrontendVerifiers;
      console.log('Running BASIC frontend verifiers only\n');
    } else if (runAdvancedOnly) {
      verifiers = advancedFrontendVerifiers;
      console.log('Running ADVANCED frontend verifiers only\n');
    } else {
      // Default: all frontend verifiers
      verifiers = [...basicFrontendVerifiers, ...advancedFrontendVerifiers];
      console.log('Running ALL frontend verifiers (basic + advanced)\n');
    }
    
    // Run each verifier
    for (const verifier of verifiers) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Running: ${verifier.name} Verification [${verifier.type}]`);
      console.log('─'.repeat(60));
      
      const action = {
        type: verifier.type === 'backend' ? 'api_verification' : 'browser_verification',
        suite: verifier.name,
        url: verifier.type === 'backend' ? config.backendUrl : config.frontendUrl,
        timestamp: new Date().toISOString()
      };
      
      allActions.push(action);
      const episodeDir = logAgentAction(agentLogsDir, episodeNum, verifier.name.toLowerCase().replace(/ /g, '-'), action);
      
      try {
        const result = await verifier.fn();
        result.type = verifier.type;
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
          type: verifier.type,
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
  }
  
  // Generate combined report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalPassed = results.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);
  const allPassed = results.every(r => r.overallPassed);
  
  // Separate frontend and backend results
  const frontendResults = results.filter(r => r.type === 'frontend');
  const backendResults = results.filter(r => r.type === 'backend');
  
  const frontendTests = frontendResults.reduce((sum, r) => sum + (r.total || 0), 0);
  const frontendPassed = frontendResults.reduce((sum, r) => sum + (r.passed || 0), 0);
  const backendTests = backendResults.reduce((sum, r) => sum + (r.total || 0), 0);
  const backendPassed = backendResults.reduce((sum, r) => sum + (r.passed || 0), 0);
  
  // Build evaluation results
  const evalResults = {
    run_number: runNumber,
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(totalDuration),
    config: {
      frontend_url: config.frontendUrl,
      backend_url: config.backendUrl,
      browserbase_project: config.browserbase.projectId ? 'configured' : 'not configured'
    },
    summary: {
      total_tests: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      pass_rate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) + '%' : '0%',
      overall_passed: allPassed,
      frontend: {
        tests: frontendTests,
        passed: frontendPassed,
        pass_rate: frontendTests > 0 ? ((frontendPassed / frontendTests) * 100).toFixed(2) + '%' : 'N/A'
      },
      backend: {
        tests: backendTests,
        passed: backendPassed,
        pass_rate: backendTests > 0 ? ((backendPassed / backendTests) * 100).toFixed(2) + '%' : 'N/A'
      }
    },
    suites: results.map(r => ({
      name: r.suite,
      type: r.type || 'frontend',
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
    total_episodes: episodeNum + 1,
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
  
  // Save main files to trajectory directory
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
${appName} Verification - Run #${runNumber}
${'='.repeat(50)}

Started:  ${new Date(startTime).toISOString()}
Finished: ${new Date().toISOString()}
Duration: ${totalDuration}s

FRONTEND RESULTS (Browser Tests)
${'─'.repeat(50)}
${frontendResults.map(r => `${r.overallPassed ? '[PASS]' : '[FAIL]'} ${r.suite}: ${r.passed}/${r.total} passed`).join('\n') || 'No frontend tests run'}

BACKEND RESULTS (API Tests)
${'─'.repeat(50)}
${backendResults.map(r => `${r.overallPassed ? '[PASS]' : '[FAIL]'} ${r.suite}: ${r.passed}/${r.total} passed`).join('\n') || 'No backend tests run'}

OVERALL SUMMARY
${'─'.repeat(50)}
Total Tests:      ${totalTests}
Passed:           ${totalPassed}
Failed:           ${totalFailed}
Pass Rate:        ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%
Frontend Rate:    ${frontendTests > 0 ? ((frontendPassed / frontendTests) * 100).toFixed(2) : 'N/A'}%
Backend Rate:     ${backendTests > 0 ? ((backendPassed / backendTests) * 100).toFixed(2) : 'N/A'}%
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
  
  if (frontendResults.length > 0) {
    console.log('\nFrontend Results:');
    for (const result of frontendResults) {
      const status = result.overallPassed ? '[PASS]' : '[FAIL]';
      console.log(`  ${status} ${result.suite}: ${result.passed}/${result.total} passed`);
      if (result.sessionUrl) {
        console.log(`       Session: ${result.sessionUrl}`);
      }
    }
  }
  
  if (backendResults.length > 0) {
    console.log('\nBackend Results:');
    for (const result of backendResults) {
      const status = result.overallPassed ? '[PASS]' : '[FAIL]';
      console.log(`  ${status} ${result.suite}: ${result.passed}/${result.total} passed`);
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`Passed:        ${totalPassed}`);
  console.log(`Failed:        ${totalFailed}`);
  console.log(`Duration:      ${totalDuration}s`);
  console.log(`Overall:       ${allPassed ? '[PASS] ALL SUITES PASSED' : '[FAIL] SOME SUITES FAILED'}`);
  console.log('='.repeat(60));
  
  console.log(`\nTrajectory saved to: ${prefix}${runNumber}/`);
  console.log('  - eval_results.json');
  console.log('  - agent_actions.json');
  console.log('  - summary.txt');
  console.log('  - agent-logs/ (per-episode logs)');
  console.log('  - sessions/ (BrowserBase session URLs)\n');
  
  return { passed: allPassed, runNumber };
}

// Run
runWithTrajectory().then(({ passed, runNumber }) => {
  console.log(`Run #${runNumber} completed ${passed ? 'successfully' : 'with failures'}\n`);
  process.exit(passed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
