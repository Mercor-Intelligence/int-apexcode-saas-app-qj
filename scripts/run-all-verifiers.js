/**
 * Run All Browser Verification Scripts
 * 
 * Executes all verifiers in sequence and generates a combined report
 */

import verifySignup from './verifiers/signup.js';
import verifyLogin from './verifiers/login.js';
import verifyLinks from './verifiers/links.js';
import verifyProfile from './verifiers/profile.js';
import verifyPublicProfile from './verifiers/public-profile.js';
import verifyAnalytics from './verifiers/analytics.js';

async function runAllVerifiers() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 BioLink Browser Verification Suite');
  console.log('═'.repeat(60));
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  const results = [];
  const startTime = Date.now();
  
  // Define verifiers in order of dependency
  const verifiers = [
    { name: 'Signup', fn: verifySignup },
    { name: 'Login', fn: verifyLogin },
    { name: 'Links', fn: verifyLinks },
    { name: 'Profile', fn: verifyProfile },
    { name: 'Public Profile', fn: verifyPublicProfile },
    { name: 'Analytics', fn: verifyAnalytics }
  ];
  
  // Run each verifier
  for (const verifier of verifiers) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Running: ${verifier.name} Verification`);
    console.log('─'.repeat(60));
    
    try {
      const result = await verifier.fn();
      results.push(result);
    } catch (error) {
      console.error(`Error running ${verifier.name}:`, error.message);
      results.push({
        suite: verifier.name,
        total: 1,
        passed: 0,
        failed: 1,
        overallPassed: false,
        error: error.message
      });
    }
    
    // Small delay between verifiers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate combined report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const allPassed = results.every(r => r.overallPassed);
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 COMBINED VERIFICATION REPORT');
  console.log('═'.repeat(60));
  
  // Per-suite summary
  console.log('\nSuite Results:');
  for (const result of results) {
    const status = result.overallPassed ? '✅' : '❌';
    console.log(`  ${status} ${result.suite}: ${result.passed}/${result.total} passed`);
  }
  
  // Overall summary
  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`Passed:        ${totalPassed}`);
  console.log(`Failed:        ${totalFailed}`);
  console.log(`Duration:      ${totalDuration}s`);
  console.log(`Overall:       ${allPassed ? '✅ ALL SUITES PASSED' : '❌ SOME SUITES FAILED'}`);
  console.log('═'.repeat(60) + '\n');
  
  // Write results to JSON file
  const reportFile = `./verification-report-${Date.now()}.json`;
  const report = {
    timestamp: new Date().toISOString(),
    duration: parseFloat(totalDuration),
    summary: {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      overallPassed: allPassed
    },
    suites: results
  };
  
  try {
    const fs = await import('fs');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${reportFile}\n`);
  } catch {
    // Ignore file write errors
  }
  
  return allPassed;
}

// Run
runAllVerifiers().then(passed => {
  process.exit(passed ? 0 : 1);
});

