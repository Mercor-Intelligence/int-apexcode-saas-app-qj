/**
 * Run BrowserBase Verification with Trajectory Logging
 * 
 * Executes all verifiers and saves agent actions and results to trajectory_run_x directories
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import verifySignup from './verifiers/signup.js';
import verifyLogin from './verifiers/login.js';
import verifyLinks from './verifiers/links.js';
import verifyProfile from './verifiers/profile.js';
import verifyPublicProfile from './verifiers/public-profile.js';
import verifyAnalytics from './verifiers/analytics.js';
import verifyFullJourney from './verifiers/full-journey.js';
// Advanced verifiers from knowledge_base.md
import verifyPasswordValidation from './verifiers/password-validation.js';
import verifyHandleValidation from './verifiers/handle-validation.js';
import verifyBioLimits from './verifiers/bio-limits.js';
import verifyLinkBehavior from './verifiers/link-behavior.js';
import verifyThemeAnd404 from './verifiers/theme-and-404.js';
import verifyAnalyticsAdvanced from './verifiers/analytics-advanced.js';
import verifyResponsiveA11y from './verifiers/responsive-a11y.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the next trajectory run number
function getNextRunNumber() {
  const baseDir = path.join(__dirname, '../');
  // Check for --v2 flag to use trajectory_v2_x naming
  const useV2Naming = process.argv.includes('--v2');
  const prefix = useV2Naming ? 'trajectory_v2_' : 'trajectory_run_';
  const dirs = fs.readdirSync(baseDir).filter(d => d.startsWith(prefix));
  if (dirs.length === 0) return useV2Naming ? 1 : 6; // Start at 6 for trajectory_run_
  
  const numbers = dirs.map(d => parseInt(d.replace(prefix, ''), 10)).filter(n => !isNaN(n));
  return Math.max(...numbers) + 1;
}

// Create trajectory directory structure
function createTrajectoryDir(runNumber) {
  const useV2Naming = process.argv.includes('--v2');
  const prefix = useV2Naming ? 'trajectory_v2_' : 'trajectory_run_';
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
  const prefix = useV2Naming ? 'trajectory_v2_' : 'trajectory_run_';
  const appName = useV2Naming ? 'BioLink V2' : 'BioLink';
  
  console.log('\n' + '═'.repeat(60));
  console.log(`${appName} Browser Verification - Run #${runNumber}`);
  console.log('═'.repeat(60));
  console.log(`Trajectory: ${prefix}${runNumber}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  const allActions = [];
  const results = [];
  const startTime = Date.now();
  let episodeNum = 0;
  
  // Define verifiers - basic tests
  const basicVerifiers = [
    { name: 'Signup', fn: verifySignup },
    { name: 'Login', fn: verifyLogin },
    { name: 'Links', fn: verifyLinks },
    { name: 'Profile', fn: verifyProfile },
    { name: 'Public Profile', fn: verifyPublicProfile },
    { name: 'Analytics', fn: verifyAnalytics }
  ];
  
  // Advanced verifiers from knowledge_base.md - harder to pass
  const advancedVerifiers = [
    { name: 'Password Validation', fn: verifyPasswordValidation },
    { name: 'Handle Validation', fn: verifyHandleValidation },
    { name: 'Bio Limits', fn: verifyBioLimits },
    { name: 'Link Behavior', fn: verifyLinkBehavior },
    { name: 'Theme & 404', fn: verifyThemeAnd404 },
    { name: 'Advanced Analytics', fn: verifyAnalyticsAdvanced },
    { name: 'Responsive & A11y', fn: verifyResponsiveA11y }
  ];
  
  // Use --basic for basic only, --advanced for advanced only, default runs all
  const runBasicOnly = process.argv.includes('--basic');
  const runAdvancedOnly = process.argv.includes('--advanced');
  
  let verifiers;
  if (runBasicOnly) {
    verifiers = basicVerifiers;
    console.log('Running BASIC verifiers only\n');
  } else if (runAdvancedOnly) {
    verifiers = advancedVerifiers;
    console.log('Running ADVANCED verifiers only\n');
  } else {
    verifiers = [...basicVerifiers, ...advancedVerifiers];
    console.log('Running ALL verifiers (basic + advanced)\n');
  }
  
  // Check if full journey should be run instead
  const runFullJourney = process.argv.includes('--full');
  
  if (runFullJourney) {
    console.log('Running Full Journey Test...\n');
    
    // Log the action
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
      
      // Log result
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
    // Run each verifier
    for (const verifier of verifiers) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`Running: ${verifier.name} Verification`);
      console.log('─'.repeat(60));
      
      // Log the action
      const action = {
        type: 'browser_verification',
        suite: verifier.name,
        url: config.frontendUrl,
        timestamp: new Date().toISOString()
      };
      
      allActions.push(action);
      const episodeDir = logAgentAction(agentLogsDir, episodeNum, verifier.name.toLowerCase().replace(' ', '-'), action);
      
      try {
        const result = await verifier.fn();
        results.push(result);
        
        // Log result to episode
        fs.writeFileSync(
          path.join(episodeDir, 'result.json'),
          JSON.stringify(result, null, 2)
        );
        
        // Save session URL if available
        if (result.sessionUrl) {
          fs.writeFileSync(
            path.join(sessionsDir, `${verifier.name.toLowerCase().replace(' ', '-')}-session.txt`),
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
      overall_passed: allPassed
    },
    suites: results.map(r => ({
      name: r.suite,
      total: r.total || 0,
      passed: r.passed || 0,
      failed: r.failed || 0,
      passed: r.overallPassed,
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
${appName} Browser Verification - Run #${runNumber}
${'═'.repeat(50)}

Started:  ${new Date(startTime).toISOString()}
Finished: ${new Date().toISOString()}
Duration: ${totalDuration}s

RESULTS
${'─'.repeat(50)}
${results.map(r => `${r.overallPassed ? '✓' : '✗'} ${r.suite}: ${r.passed}/${r.total} passed`).join('\n')}

SUMMARY
${'─'.repeat(50)}
Total Tests: ${totalTests}
Passed:      ${totalPassed}
Failed:      ${totalFailed}
Pass Rate:   ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%
Overall:     ${allPassed ? 'PASSED' : 'FAILED'}

SESSION RECORDINGS
${'─'.repeat(50)}
${results.filter(r => r.sessionUrl).map(r => `${r.suite}: ${r.sessionUrl}`).join('\n') || 'No sessions recorded'}
`.trim();
  
  fs.writeFileSync(
    path.join(trajectoryDir, 'summary.txt'),
    summary
  );
  
  // Print report
  console.log('\n' + '═'.repeat(60));
  console.log('VERIFICATION REPORT');
  console.log('═'.repeat(60));
  
  console.log('\nSuite Results:');
  for (const result of results) {
    const status = result.overallPassed ? '✅' : '❌';
    console.log(`  ${status} ${result.suite}: ${result.passed}/${result.total} passed`);
    if (result.sessionUrl) {
      console.log(`     Session: ${result.sessionUrl}`);
    }
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`Passed:        ${totalPassed}`);
  console.log(`Failed:        ${totalFailed}`);
  console.log(`Duration:      ${totalDuration}s`);
  console.log(`Overall:       ${allPassed ? '✅ ALL SUITES PASSED' : '❌ SOME SUITES FAILED'}`);
  console.log('═'.repeat(60));
  
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

