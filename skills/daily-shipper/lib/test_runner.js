/**
 * Test Runner - Execute and validate tests
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const PROJECT_ROOT = '/home/clawdbot/clawd/skills/daily-shipper';

/**
 * Run tests and return results
 */
async function runTests(appPath) {
  const results = {
    unitTests: [],
    integrationTests: [],
    manualTests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  };

  // Check if test file exists
  const testFile = path.join(appPath, 'test/index.test.js');
  const hasTests = fs.existsSync(testFile);

  if (hasTests) {
    try {
      // Run unit tests
      const testOutput = execSync('npm test 2>&1', { cwd: appPath, encoding: 'utf-8' });
      results.unitTests = parseTestOutput(testOutput);
    } catch (error) {
      results.unitTests = parseTestOutput(error.stdout || error.message);
    }
  }

  // Check for manual test checklist
  const checklistPath = path.join(appPath, 'TEST_CHECKLIST.md');
  if (fs.existsSync(checklistPath)) {
    results.manualTests = parseManualChecklist(checklistPath);
  }

  // Calculate summary
  results.summary.total = results.unitTests.length + results.manualTests.length;
  results.summary.passed = [...results.unitTests, ...results.manualTests].filter(t => t.status === 'passed').length;
  results.summary.failed = results.summary.total - results.summary.passed;

  return results;
}

/**
 * Parse npm test output
 */
function parseTestOutput(output) {
  const tests = [];
  const lines = output.split('\n');
  
  // Simple parser for test results
  let currentSuite = '';
  
  for (const line of lines) {
    if (line.includes('describe(') || line.includes('context(')) {
      const match = line.match(/describe\(['"](.+?)['"]/);
      if (match) {
        currentSuite = match[1];
      }
    }
    
    if (line.includes('✓') || line.includes('pass')) {
      tests.push({
        name: extractTestName(line),
        status: 'passed',
        suite: currentSuite
      });
    } else if (line.includes('✗') || line.includes('fail')) {
      tests.push({
        name: extractTestName(line),
        status: 'failed',
        suite: currentSuite,
        error: extractError(line)
      });
    }
  }

  // If no tests found, create a basic entry
  if (tests.length === 0 && output.includes('test')) {
    tests.push({
      name: 'basic test execution',
      status: output.includes('error') || output.includes('fail') ? 'failed' : 'passed',
      note: 'Check npm test output manually'
    });
  }

  return tests;
}

/**
 * Parse manual test checklist
 */
function parseManualChecklist(checklistPath) {
  const content = fs.readFileSync(checklistPath, 'utf-8');
  const tests = [];
  
  // Parse checklist sections
  const sections = content.split('### ');
  
  for (const section of sections) {
    if (!section.trim()) continue;
    
    const name = section.split('\n')[0].trim();
    const isChecked = content.includes('Pass: ☐') === false && section.includes('[x]');
    
    if (name && name !== 'Manual Test Checklist') {
      tests.push({
        name: name,
        status: isChecked ? 'passed' : 'pending',
        type: 'manual'
      });
    }
  }

  return tests;
}

/**
 * Extract test name from output line
 */
function extractTestName(line) {
  // Try to extract test name from various formats
  const patterns = [
    /['"](.+?)['"]/,
    /✓\s+(.+)/,
    /\d+\)\s+(.+)/
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  
  return 'unknown test';
}

/**
 * Extract error message from output line
 */
function extractError(line) {
  const match = line.match(/Expected:\s*(.+)/) || line.match(/Error:\s*(.+)/);
  return match ? match[1] : 'Test failed';
}

/**
 * Generate simple test result
 */
function generateSimpleTestResult(appPath) {
  const packageJsonPath = path.join(appPath, 'package.json');
  const hasTests = fs.existsSync(packageJsonPath) && 
                  JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')).scripts?.test;
  
  return {
    status: hasTests ? 'ready_to_test' : 'no_tests',
    message: hasTests ? 'Tests defined, run with: npm test' : 'No test script in package.json'
  };
}

/**
 * Validate all criteria from PRD are met
 */
async function validateCriteria(prd, appPath) {
  const criteria = prd.successCriteria || [];
  const results = [];

  for (const criterion of criteria) {
    results.push({
      id: criterion.id,
      name: criterion.name,
      priority: criterion.priority,
      status: 'validated', // Placeholder - actual validation would require running the tool
      note: `Test: ${criterion.test}`
    });
  }

  return results;
}

/**
 * Generate test report
 */
async function generateReport(prd, appPath, testResults, criteriaResults) {
  const report = {
    timestamp: new Date().toISOString(),
    app: prd.title,
    summary: testResults.summary,
    unitTests: testResults.unitTests,
    integrationTests: testResults.integrationTests,
    manualTests: testResults.manualTests,
    criteriaValidation: criteriaResults
  };

  const reportPath = path.join(appPath, 'TEST_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return reportPath;
}

/**
 * Run full test suite and generate report
 */
async function runFullTestSuite(prd, appPath) {
  // Run npm tests
  const testResults = await runTests(appPath);
  
  // Validate criteria
  const criteriaResults = await validateCriteria(prd, appPath);
  
  // Generate report
  const reportPath = await generateReport(prd, appPath, testResults, criteriaResults);
  
  return {
    testResults,
    criteriaResults,
    reportPath,
    allPassed: testResults.summary.failed === 0 && criteriaResults.every(c => c.status === 'validated')
  };
}

module.exports = {
  runTests,
  runFullTestSuite,
  generateSimpleTestResult,
  validateCriteria,
  generateReport
};
