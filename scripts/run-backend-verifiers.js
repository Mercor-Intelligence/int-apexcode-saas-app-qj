/**
 * Run Backend API Verifiers
 * 
 * Tests backend API endpoints directly without browser automation
 * 
 * Usage:
 *   node run-backend-verifiers.js
 */

import { verifyAuthAPI } from './verifiers/backend/auth-api.js';
import { verifyLinksAPI } from './verifiers/backend/links-api.js';
import { verifyProfileAPI } from './verifiers/backend/profile-api.js';
import { verifyAnalyticsAPI } from './verifiers/backend/analytics-api.js';
import { verifyPublicAPI } from './verifiers/backend/public-api.js';
import { verifyValidationAPI } from './verifiers/backend/validation-api.js';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verifiers = [
  { name: 'Auth API', fn: verifyAuthAPI },
  { name: 'Links API', fn: verifyLinksAPI },
  { name: 'Profile API', fn: verifyProfileAPI },
  { name: 'Analytics API', fn: verifyAnalyticsAPI },
  { name: 'Public API', fn: verifyPublicAPI },
  { name: 'Validation API', fn: verifyValidationAPI }
];

async function runBackendVerifiers() {
  console.log('\n' + '='.repeat(60));
  console.log('Backend API Verification');
  console.log('='.repeat(60));
  console.log(`Backend URL: ${config.backendUrl}`);
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  const results = [];
  const startTime = Date.now();
  
  for (const verifier of verifiers) {
    console.log('\n' + '─'.repeat(60));
    console.log(`Running: ${verifier.name}`);
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
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate report
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const totalTests = results.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalPassed = results.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);
  const allPassed = results.every(r => r.overallPassed);
  
  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    duration_seconds: parseFloat(totalDuration),
    backend_url: config.backendUrl,
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
      passed_all: r.overallPassed,
      tests: r.tests || [],
      error: r.error || null
    }))
  };
  
  // Save report
  const reportPath = path.join(__dirname, `backend-verification-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('BACKEND VERIFICATION REPORT');
  console.log('='.repeat(60));
  
  console.log('\nSuite Results:');
  for (const result of results) {
    const status = result.overallPassed ? '[PASS]' : '[FAIL]';
    console.log(`  ${status} ${result.suite}: ${result.passed}/${result.total} passed`);
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log(`Total Tests:   ${totalTests}`);
  console.log(`Passed:        ${totalPassed}`);
  console.log(`Failed:        ${totalFailed}`);
  console.log(`Pass Rate:     ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0}%`);
  console.log(`Duration:      ${totalDuration}s`);
  console.log(`Overall:       ${allPassed ? '[PASS] ALL SUITES PASSED' : '[FAIL] SOME SUITES FAILED'}`);
  console.log('='.repeat(60));
  
  console.log(`\nReport saved to: ${path.basename(reportPath)}\n`);
  
  return allPassed;
}

// Run
runBackendVerifiers().then(passed => {
  console.log(`Backend verification completed ${passed ? 'successfully' : 'with failures'}\n`);
  process.exit(passed ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

