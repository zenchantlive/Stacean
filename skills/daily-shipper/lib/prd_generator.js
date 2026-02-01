/**
 * PRD Generator - Create Product Requirements Document from trend
 *
 * Generates a structured PRD that defines:
 * - Problem statement
 * - Solution approach
 * - Success criteria (tests)
 * - Implementation hints
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = '/home/clawdbot/clawd/skills/daily-shipper';

/**
 * Generate PRD from trend
 */
function generatePRD(spec) {
  const trend = spec.trend;
  const title = trend.title;
  const description = trend.description;
  const tags = trend.tags || [];

  // Analyze problem type
  const problemType = analyzeProblemType(title, description);
  
  // Generate PRD sections
  const prd = {
    title: title,
    createdAt: new Date().toISOString(),
    author: 'Atlas (Daily Shipper)',
    problem: generateProblemSection(title, description, problemType),
    solution: generateSolutionSection(title, description, problemType, spec.appType),
    successCriteria: generateSuccessCriteria(title, description, problemType),
    technicalNotes: generateTechnicalNotes(spec, problemType),
    noveltyAssessment: assessNovelty(title, description, tags),
    testPlan: generateTestPlan(title, description, problemType)
  };

  return prd;
}

/**
 * Analyze what type of problem this is
 */
function analyzeProblemType(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('copy') || text.includes('clipboard') || text.includes('share')) {
    return 'clipboard_automation';
  }
  if (text.includes('error') || text.includes('log') || text.includes('debug')) {
    return 'debugging';
  }
  if (text.includes('organize') || text.includes('manage') || text.includes('find')) {
    return 'organization';
  }
  if (text.includes('automate') || text.includes('workflow')) {
    return 'automation';
  }
  if (text.includes('convert') || text.includes('transform') || text.includes('parse')) {
    return 'transformation';
  }
  if (text.includes('monitor') || text.includes('watch') || text.includes('track')) {
    return 'monitoring';
  }
  
  return 'general';
}

/**
 * Generate problem statement section
 */
function generateProblemSection(title, description, problemType) {
  const painIndicators = extractPainIndicators(title, description);
  
  return {
    statement: description,
    painPoints: painIndicators,
    impact: estimateImpact(problemType),
    currentWorkaround: describeCurrentWorkaround(problemType)
  };
}

/**
 * Generate solution approach section
 */
function generateSolutionSection(title, description, problemType, appType) {
  const approach = {
    type: appType,
    inputSources: describeInputSources(problemType),
    processingSteps: describeProcessingSteps(problemType),
    outputFormats: describeOutputFormats(problemType),
    userInterface: describeInterface(appType)
  };

  return approach;
}

/**
 * Generate success criteria (tests)
 */
function generateSuccessCriteria(title, description, problemType) {
  const criteria = [
    {
      id: 'core-functionality',
      name: 'Core functionality works',
      priority: 'must-have',
      test: generateCoreTest(title, description, problemType)
    },
    {
      id: 'input-handling',
      name: 'Handles expected inputs',
      priority: 'must-have',
      test: generateInputTest(title, description, problemType)
    },
    {
      id: 'error-handling',
      name: 'Handles edge cases gracefully',
      priority: 'should-have',
      test: generateErrorTest(title, description, problemType)
    }
  ];

  // Add problem-type specific criteria
  if (problemType === 'clipboard_automation') {
    criteria.push({
      id: 'clipboard-access',
      name: 'Can read/write to clipboard',
      priority: 'must-have',
      test: 'Verify clipboard read/write works on target platform'
    });
  }

  return criteria;
}

/**
 * Generate technical notes
 */
function generateTechnicalNotes(spec, problemType) {
  return {
    language: spec.language,
    framework: spec.framework,
    dependencies: identifyDependencies(problemType),
    platformNotes: identifyPlatformNotes(problemType),
    securityConsiderations: identifySecurityNotes(problemType)
  };
}

/**
 * Assess novelty of the idea
 */
function assessNovelty(title, description, tags) {
  const text = `${title} ${description}`.toLowerCase();
  
  const noveltyIndicators = [];
  const existingPatterns = [];
  
  // Check for novelty signals
  if (text.includes('first') || text.includes('nothing exists') || text.includes('never seen')) {
    noveltyIndicators.push('Claims to be first-of-its-kind');
  }
  if (text.includes('wish there was') || text.includes('I need')) {
    noveltyIndicators.push('Unmet user need identified');
  }
  if (text.includes('tired of') || text.includes('annoying')) {
    noveltyIndicators.push('Solves common frustration');
  }
  
  // Check for existing patterns (might not be novel)
  if (text.includes('another') || text.includes('new version of')) {
    existingPatterns.push('Seems like an existing tool variant');
  }
  if (text.includes('wrapper') || text.includes('wrapper for')) {
    existingPatterns.push('Wrapper pattern - may lack novelty');
  }
  if (text.includes('ui for') || text.includes('new interface for')) {
    existingPatterns.push('Interface layer - may lack novelty');
  }

  return {
    score: calculateNoveltyScore(noveltyIndicators, existingPatterns),
    indicators: noveltyIndicators,
    concerns: existingPatterns,
    verdict: noveltyIndicators.length > existingPatterns.length ? 'ACCEPT' : 'REVIEW'
  };
}

/**
 * Generate test plan
 */
function generateTestPlan(title, description, problemType) {
  return {
    unitTests: [
      'Test core function with valid input',
      'Test core function with empty input',
      'Test core function with malformed input'
    ],
    integrationTests: [
      'Test with real file (if applicable)',
      'Test with stdin input (if applicable)',
      'Test with CLI arguments (if applicable)'
    ],
    manualTests: [
      'Run with demo data and verify output',
      'Run with real-world example data',
      'Verify output format matches specification'
    ]
  };
}

/**
 * Helper functions
 */
function extractPainIndicators(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const indicators = [];
  
  const painWords = [
    { word: 'manually', context: 'Requires manual effort' },
    { word: 'tired of', context: 'Common frustration' },
    { word: 'annoying', context: 'UX friction' },
    { word: 'error-prone', context: 'Reliability issue' },
    { word: 'waste of time', context: 'Efficiency problem' },
    { word: 'slow', context: 'Performance issue' },
    { word: 'complicated', context: 'Complexity barrier' },
    { word: 'forgetting', context: 'Memory/attention issue' }
  ];
  
  for (const { word, context } of painWords) {
    if (text.includes(word)) {
      indicators.push(context);
    }
  }
  
  return indicators.length > 0 ? indicators : ['General inefficiency identified'];
}

function estimateImpact(problemType) {
  const impacts = {
    'clipboard_automation': 'Saves 5-15 minutes per occurrence',
    'debugging': 'Reduces error investigation time by 50%+',
    'organization': 'Improves findability and reduce search time',
    'automation': 'Eliminates repetitive manual steps',
    'transformation': 'Reduces conversion errors',
    'monitoring': 'Enables proactive issue detection'
  };
  
  return impacts[problemType] || 'Efficiency improvement expected';
}

function describeCurrentWorkaround(problemType) {
  const workarounds = {
    'clipboard_automation': 'Manual copy/paste, risk of errors',
    'debugging': 'Manual log analysis in terminal/editor',
    'organization': 'Manual file management or external tools',
    'automation': 'Manual step execution',
    'transformation': 'Manual conversion using external tools',
    'monitoring': 'Periodic manual checks or missing monitoring'
  };
  
  return workarounds[problemType] || 'Manual workaround expected';
}

function describeInputSources(problemType) {
  const sources = {
    'clipboard_automation': ['Clipboard', 'File', 'Stdin'],
    'debugging': ['Log file', 'Stderr output', 'Error message'],
    'organization': ['File system', 'Configuration files'],
    'automation': ['CLI arguments', 'Configuration files'],
    'transformation': ['File', 'Stdin', 'API response'],
    'monitoring': ['System metrics', 'Log files', 'HTTP endpoints']
  };
  
  return sources[problemType] || ['User input', 'File'];
}

function describeProcessingSteps(problemType) {
  const steps = {
    'clipboard_automation': ['Capture input', 'Format for target', 'Write to clipboard'],
    'debugging': ['Parse error format', 'Extract key information', 'Format for readability'],
    'organization': ['Scan directory', 'Categorize items', 'Generate report'],
    'automation': ['Parse configuration', 'Execute steps', 'Report results'],
    'transformation': ['Read source', 'Parse format', 'Convert to target format', 'Output'],
    'monitoring': ['Collect metrics', 'Compare to thresholds', 'Alert if needed']
  };
  
  return steps[problemType] || ['Process input', 'Generate output'];
}

function describeOutputFormats(problemType) {
  const formats = {
    'clipboard_automation': ['Plain text', 'Markdown', 'JSON'],
    'debugging': ['Colored terminal output', 'JSON report', 'Markdown summary'],
    'organization': ['List view', 'Tree view', 'JSON export'],
    'automation': ['Exit code', 'Stdout', 'JSON status'],
    'transformation': ['Target format file', 'Stdout'],
    'monitoring': ['Console alert', 'JSON status', 'Status code']
  };
  
  return formats[problemType] || ['Stdout', 'File'];
}

function describeInterface(appType) {
  const interfaces = {
    'cli-package': 'CLI with arguments and flags',
    'script-tool': 'Simple command execution',
    'web-app': 'Web interface',
    'browser-extension': 'Browser popup UI'
  };
  
  return interfaces[appType] || 'CLI interface';
}

function identifyDependencies(problemType) {
  const deps = {
    'clipboard_automation': [' clipboard module or pbcopy/xclip'],
    'debugging': ['ANSI color codes support'],
    'organization': ['File system access (fs/path)'],
    'automation': ['Child process execution (if exec needed)'],
    'transformation': ['Parsing libraries (if structured data)'],
    'monitoring': ['HTTP client (if remote monitoring)']
  };
  
  return deps[problemType] || ['fs module'];
}

function identifyPlatformNotes(problemType) {
  const notes = {
    'clipboard_automation': 'pbcopy (macOS), xclip (Linux), clip (Windows)',
    'debugging': 'Terminal must support ANSI colors',
    'organization': 'Cross-platform path handling needed',
    'automation': 'Platform-specific commands may differ',
    'transformation': 'Encoding handling for different file types',
    'monitoring': 'Permission checks for system metrics'
  };
  
  return notes[problemType] || 'Standard Node.js runtime';
}

function identifySecurityNotes(problemType) {
  return 'No sensitive data handling in current scope. Sanitize all inputs.';
}

function calculateNoveltyScore(positive, negative) {
  // Simple scoring: positive - negative
  const score = (positive.length * 10) - (negative.length * 5);
  return Math.max(0, Math.min(100, score + 50)); // Base 50, max 100
}

/**
 * Write PRD to file
 */
async function writePRD(prd, appPath) {
  const prdPath = path.join(appPath, 'PRD.md');
  const content = `# ${prd.title}

**Created:** ${prd.createdAt}
**Author:** ${prd.author}

---

## Problem

${prd.problem.statement}

**Pain Points:**
${prd.problem.painPoints.map(p => `- ${p}`).join('\n')}

**Impact:** ${prd.problem.impact}
**Current Workaround:** ${prd.problem.currentWorkaround}

---

## Solution

**Type:** ${prd.solution.type}
**Input Sources:** ${prd.solution.inputSources.join(', ')}
**Processing Steps:**
${prd.solution.processingSteps.map(s => `1. ${s}`).join('\n')}
**Output Formats:** ${prd.solution.outputFormats.join(', ')}
**Interface:** ${prd.solution.userInterface}

---

## Success Criteria

${prd.successCriteria.map(c => `### ${c.id}: ${c.name}

- Priority: ${c.priority}
- Test: ${c.test}
`).join('\n')}

---

## Technical Notes

- **Language:** ${prd.technicalNotes.language}
- **Framework:** ${prd.technicalNotes.framework}
- **Dependencies:** ${prd.technicalNotes.dependencies.join(', ')}
- **Platform Notes:** ${prd.technicalNotes.platformNotes}
- **Security:** ${prd.technicalNotes.securityConsiderations}

---

## Novelty Assessment

**Score:** ${prd.noveltyAssessment.score}/100
**Verdict:** ${prd.noveltyAssessment.verdict}

**Positive Indicators:**
${prd.noveltyAssessment.indicators.map(i => `- ${i}`).join('\n') || '- None identified'}

**Potential Concerns:**
${prd.noveltyAssessment.concerns.map(c => `- ${c}`).join('\n') || '- None identified'}

---

## Test Plan

### Unit Tests
${prd.testPlan.unitTests.map(t => `- ${t}`).join('\n')}

### Integration Tests
${prd.testPlan.integrationTests.map(t => `- ${t}`).join('\n')}

### Manual Tests
${prd.testPlan.manualTests.map(t => `- ${t}`).join('\n')}

---

*Generated by Daily Shipper PRD Generator*
`;

  fs.writeFileSync(prdPath, content);
  return prdPath;
}

/**
 * Generate core functionality test
 */
function generateCoreTest(title, description, problemType) {
  return `Verify ${problemType} functionality works with valid input`;
}

/**
 * Generate input handling test
 */
function generateInputTest(title, description, problemType) {
  return `Verify handling of valid inputs from ${problemType === 'debugging' ? 'error logs' : 'expected sources'}`;
}

/**
 * Generate error handling test
 */
function generateErrorTest(title, description, problemType) {
  return `Verify graceful handling of empty/malformed ${problemType === 'debugging' ? 'error' : 'input'}`;
}

module.exports = {
  generatePRD,
  writePRD,
  analyzeProblemType,
  assessNovelty
};
