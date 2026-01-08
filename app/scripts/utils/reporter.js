/**
 * Test result reporter for verification scripts
 */

export class Reporter {
  constructor(suiteName) {
    this.suiteName = suiteName;
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * Record a test result
   */
  record(testName, passed, details = '') {
    this.results.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${testName}${details ? ` - ${details}` : ''}`);
  }

  /**
   * Generate summary report
   */
  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${this.suiteName} - Results`);
    console.log('='.repeat(60));
    console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Status: ${failed === 0 ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    console.log('='.repeat(60) + '\n');
    
    return {
      suite: this.suiteName,
      total,
      passed,
      failed,
      duration: parseFloat(duration),
      results: this.results,
      overallPassed: failed === 0
    };
  }
}

export default Reporter;

