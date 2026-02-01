/**
 * TDD Builder - Write tests BEFORE code (Test-Driven Development)
 *
 * Generates test files based on PRD success criteria
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate test file from PRD
 */
function generateTests(prd, appType) {
  const tests = {
    unitTests: generateUnitTests(prd),
    integrationTests: generateIntegrationTests(prd),
    manualTests: generateManualTests(prd)
  };

  return tests;
}

/**
 * Generate unit tests
 */
function generateUnitTests(prd) {
  const problemType = analyzeProblemTypeFromPRD(prd);
  const tests = [];

  // Core functionality test
  tests.push({
    name: 'core_functionality',
    description: `${prd.title} works with valid input`,
    code: generateCoreTestCode(prd, problemType),
    expected: 'Function executes without errors and produces expected output'
  });

  // Empty input test
  tests.push({
    name: 'empty_input',
    description: 'Handles empty input gracefully',
    code: generateEmptyInputTestCode(prd, problemType),
    expected: 'Returns empty result or appropriate message'
  });

  // Malformed input test
  tests.push({
    name: 'malformed_input',
    description: 'Handles malformed input gracefully',
    code: generateMalformedInputTestCode(prd, problemType),
    expected: 'Does not crash, may return error message'
  });

  return tests;
}

/**
 * Generate integration tests
 */
function generateIntegrationTests(prd) {
  const problemType = analyzeProblemTypeFromPRD(prd);
  const tests = [];

  // File input test
  if (prd.solution.inputSources.includes('File') || prd.solution.inputSources.includes('File system')) {
    tests.push({
      name: 'file_input',
      description: 'Reads from file correctly',
      code: `// Create test file
const testFile = path.join(__dirname, 'test-input.txt');
fs.writeFileSync(testFile, 'test error content');

// Run tool with file
const result = execSync(\`node index.js \${testFile}\`).toString();

// Verify
assert(result.includes('test error content'));

// Cleanup
fs.unlinkSync(testFile);`,
      expected: 'Reads file content and processes it'
    });
  }

  // Stdin input test
  if (prd.solution.inputSources.includes('Stdin')) {
    tests.push({
      name: 'stdin_input',
      description: 'Reads from stdin correctly',
      code: `// Run with stdin input
const result = execSync('echo "test input" | node index.js -').toString();

// Verify
assert(result.includes('test input'));`,
      expected: 'Reads stdin and processes input'
    });
  }

  // CLI arguments test
  tests.push({
    name: 'cli_arguments',
    description: 'Parses CLI arguments correctly',
    code: `// Run with help flag
const helpResult = execSync('node index.js --help').toString();

// Verify help output
assert(helpResult.includes('Usage') || helpResult.includes('help'));`,
    expected: 'CLI arguments are parsed and handled correctly'
  });

  return tests;
}

/**
 * Generate manual tests
 */
function generateManualTests(prd) {
  return [
    {
      name: 'demo_run',
      description: 'Run with demo data and verify output',
      steps: [
        'Run: node index.js',
        'Verify: Colored output is displayed',
        'Verify: Source is shown as "demo"',
        'Verify: "Done." message appears'
      ],
      expected: 'Clean, formatted output with no errors'
    },
    {
      name: 'real_data',
      description: 'Test with real-world error log',
      steps: [
        'Create a file with real error content',
        'Run: node index.js [filename]',
        'Verify: Errors are highlighted in red',
        'Verify: File paths are highlighted in blue'
      ],
      expected: 'Real errors are properly formatted and highlighted'
    },
    {
      name: 'copy_functionality',
      description: 'Test clipboard copy if applicable',
      steps: [
        'Run: node index.js --copy',
        'Verify: "Copied to clipboard" message appears',
        'Verify: Content is in clipboard (paste to verify)'
      ],
      expected: 'Content is successfully copied to clipboard'
    }
  ];
}

/**
 * Write test file
 */
async function writeTests(prd, appPath) {
  const problemType = analyzeProblemTypeFromPRD(prd);
  const tests = generateTests(prd, prd.solution.type);

  // Generate JavaScript test file for Node.js projects
  const testFilePath = path.join(appPath, 'test/index.test.js');
  const testDir = path.dirname(testFilePath);

  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const testContent = generateTestFile(prd, tests, problemType);
  fs.writeFileSync(testFilePath, testContent);

  // Generate package.json with test script
  const packagePath = path.join(appPath, 'package.json');
  let packageJson = {};
  
  if (fs.existsSync(packagePath)) {
    packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  }
  
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts.test = 'node test/index.test.js';
  
  if (!packageJson.devDependencies) packageJson.devDependencies = {};
  packageJson.devDependencies.assert = '^4.4.0';
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

  // Generate manual test checklist
  const manualTestPath = path.join(appPath, 'TEST_CHECKLIST.md');
  const manualTestContent = generateManualTestChecklist(prd, tests);
  fs.writeFileSync(manualTestPath, manualTestContent);

  return {
    testFile: testFilePath,
    packageJson: packagePath,
    manualTest: manualTestPath
  };
}

/**
 * Generate test file content
 */
function generateTestFile(prd, tests, problemType) {
  const testCode = tests.unitTests.map(t => `
describe('${t.name}', () => {
  it('${t.description}', () => {
    ${t.code}
    // Expected: ${t.expected}
  });
});
`).join('');

  return `/**
 * ${prd.title} - Unit Tests
 * 
 * Generated by Daily Shipper TDD Builder
 * PRD: ${prd.title}
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test utilities
function runTool(args = '') {
  const cmd = args ? \`node index.js \${args}\` : 'node index.js';
  return execSync(cmd).toString();
}

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

describe('${prd.title}', () => {
  beforeAll(() => {
    // Ensure we're in the app directory
    process.chdir(__dirname.replace('/test', ''));
  });

  ${testCode}
});

// Integration tests
describe('Integration Tests', () => {
  ${tests.integrationTests.map(t => `
  describe('${t.name}', () => {
    it('${t.description}', () => {
      ${t.code}
      // Expected: ${t.expected}
    });
  });
  `).join('')}
});
`;
}

/**
 * Generate manual test checklist
 */
function generateManualTestChecklist(prd, tests) {
  const manualTests = tests.manualTests || [];
  
  return `# Manual Test Checklist

## ${prd.title}

**Generated by Daily Shipper TDD Builder**

---

${manualTests.map(test => `
### ${test.name}
**Description:** ${test.description}

**Steps:**
${test.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**Expected Result:** ${test.expected}

**Pass:** ☐

`).join('---')}

---

## Overall Assessment

- All tests passing: ☐
- Ready for deployment: ☐
- Notes:

---

*Generated: ${new Date().toISOString()}*
`;
}

/**
 * Helper functions
 */
function analyzeProblemTypeFromPRD(prd) {
  // Match prd_generator's logic
  const text = `${prd.title} ${prd.problem.statement}`.toLowerCase();
  
  if (text.includes('copy') || text.includes('clipboard')) return 'clipboard_automation';
  if (text.includes('error') || text.includes('log') || text.includes('debug')) return 'debugging';
  if (text.includes('organize') || text.includes('manage') || text.includes('find')) return 'organization';
  if (text.includes('automate') || text.includes('workflow')) return 'automation';
  if (text.includes('convert') || text.includes('transform')) return 'transformation';
  if (text.includes('monitor') || text.includes('watch')) return 'monitoring';
  
  return 'general';
}

function generateCoreTestCode(prd, problemType) {
  if (problemType === 'debugging') {
    return `const output = runTool('demo');
assert(output.includes('Error:'));`;
  }
  return `const output = runTool('demo');
assert(output.length > 0);`;
}

function generateEmptyInputTestCode(prd, problemType) {
  return `const output = runTool('-');
assert(output.length >= 0); // Should not crash`;
}

function generateMalformedInputTestCode(prd, problemType) {
  return `const output = runTool('nonexistent-file-xyz.txt');
assert(output.length > 0); // Should handle gracefully`;
}

module.exports = {
  generateTests,
  writeTests,
  generateUnitTests,
  generateIntegrationTests,
  generateManualTests
};
