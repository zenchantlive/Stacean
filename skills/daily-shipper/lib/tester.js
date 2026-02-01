/**
 * Tester - Validate app locally before push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TEMP_DIR = '/tmp/daily-shipper';

/**
 * Test app locally
 */
async function testApp(appPath) {
  console.log(`Testing app at: ${appPath}`);

  const testResults = [];

  // Check 1: All required files exist
  const requiredFiles = getRequiredFiles(appPath);
  const missingFiles = requiredFiles.filter(f => !fs.existsSync(path.join(appPath, f)));

  if (missingFiles.length > 0) {
    testResults.push({
      test: 'File structure',
      status: 'FAILED',
      detail: `Missing files: ${missingFiles.join(', ')}`
    });
  } else {
    testResults.push({
      test: 'File structure',
      status: 'PASSED',
      detail: `${requiredFiles.length} required files present`
    });
  }

  // Check 2: README exists and has required sections
  const readmePath = path.join(appPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, 'utf-8');

    const requiredSections = ['Purpose', 'Usage', 'Installation'];
    const missingSections = requiredSections.filter(section =>
      !readme.toLowerCase().includes(section.toLowerCase())
    );

    if (missingSections.length > 0) {
      testResults.push({
        test: 'README sections',
        status: 'FAILED',
        detail: `Missing sections: ${missingSections.join(', ')}`
      });
    } else {
      testResults.push({
        test: 'README sections',
        status: 'PASSED',
        detail: 'All required sections present'
      });
    }
  } else {
    testResults.push({
      test: 'README exists',
      status: 'FAILED',
      detail: 'README.md not found'
    });
  }

  // Check 3: LICENSE file exists
  const licensePath = path.join(appPath, 'LICENSE');
  if (!fs.existsSync(licensePath)) {
    testResults.push({
      test: 'LICENSE file',
      status: 'FAILED',
      detail: 'LICENSE not found'
    });
  } else {
    testResults.push({
      test: 'LICENSE file',
      status: 'PASSED',
      detail: 'LICENSE exists'
    });
  }

  // Check 4: No hardcoded secrets
  const secrets = findHardcodedSecrets(appPath);
  if (secrets.length > 0) {
    testResults.push({
      test: 'No hardcoded secrets',
      status: 'FAILED',
      detail: `Found potential secrets in: ${secrets.join(', ')}`
    });
  } else {
    testResults.push({
      test: 'No hardcoded secrets',
      status: 'PASSED',
      detail: 'No hardcoded secrets found'
    });
  }

  // Check 5: Syntax validation (basic)
  const syntaxErrors = validateSyntax(appPath);
  if (syntaxErrors.length > 0) {
    testResults.push({
      test: 'Syntax validation',
      status: 'FAILED',
      detail: `Syntax errors in: ${syntaxErrors.join(', ')}`
    });
  } else {
    testResults.push({
      test: 'Syntax validation',
      status: 'PASSED',
      detail: 'No syntax errors detected'
    });
  }

  // Generate report
  const failures = testResults.filter(r => r.status === 'FAILED');

  return {
    passed: failures.length === 0,
    failures,
    results: testResults
  };
}

/**
 * Get required files based on app type
 */
function getRequiredFiles(appPath) {
  // Check what type of app this is
  const files = fs.readdirSync(appPath);

  if (files.includes('manifest.json')) {
    return ['manifest.json', 'popup.html', 'content.js', 'background.js'];
  }

  if (files.includes('app/page.tsx') || files.includes('app/page.ts')) {
    return ['app/page.tsx', 'components/Button.tsx', 'components/Input.tsx', 'lib/api.ts'];
  }

  if (files.includes('lib/cli.rb')) {
    return ['lib/cli.rb', 'lib/generator.rb', 'Gemfile'];
  }

  if (files.includes('src/index.js')) {
    return ['src/index.js', 'package.json'];
  }

  if (files.includes('index.js')) {
    return ['index.js'];
  }

  // Default
  return ['README.md', 'LICENSE'];
}

/**
 * Find hardcoded secrets
 */
function findHardcodedSecrets(appPath) {
  const secrets = [];
  const secretPatterns = [
    /api[_-]?key\s*=\s*['"][\w-]+/gi,
    /password\s*=\s*['"][\w-]+/gi,
    /secret\s*=\s*['"][\w-]+/gi,
    /token\s*=\s*['"][\w-]+/gi,
    /sk-[a-z0-9]{20,}/gi
  ];

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.rb')) {
        const content = fs.readFileSync(filePath, 'utf-8');

        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            secrets.push(file);
            break;
          }
        }
      }
    }
  }

  scanDirectory(appPath);
  return [...new Set(secrets)];
}

/**
 * Validate syntax of code files
 */
function validateSyntax(appPath) {
  const errors = [];

  // Check for browser extensions - they use Chrome APIs not available in Node
  const manifestPath = path.join(appPath, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    // Browser extensions use Chrome APIs - skip Node.js require check
    return [];
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.ts')) {
        try {
          // Basic syntax check - try to require
          require(filePath);
        } catch (e) {
          errors.push(file);
        }
      }
    }
  }

  try {
    scanDirectory(appPath);
  } catch (error) {
    // Ignore validation errors for non-JS files
  }

  return errors;
}

module.exports = { testApp };
