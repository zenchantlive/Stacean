/**
 * Tracer Bullet Builder - Minimal working implementation
 *
 * Builds a thin slice that proves the entire system works
 */

const fs = require('fs');
const path = require('path');

async function buildTracerBullet(prd, spec) {
  const problemType = analyzeProblemType(prd);
  return generateTracerBullet(prd, spec, problemType);
}

function generateTracerBullet(prd, spec, problemType) {
  const title = prd.title.replace(/"/g, '\\"');
  const problem = prd.problem.statement.replace(/"/g, '\\"');

  switch (problemType) {
    case 'debugging':
      return generateDebuggingTracerBullet(title, problem);
    case 'organization':
      return generateOrganizationTracerBullet(title, problem);
    default:
      return generateGenericTracerBullet(title, problem);
  }
}

function generateDebuggingTracerBullet(title, problem) {
  return `#!/usr/bin/env node

/**
 * ${title}
 * ${problem}
 */

const fs = require('fs');
const { execSync } = require('child_process');

const C = {
  reset: '\\x1b[0m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  cyan: '\\x1b[36m',
  gray: '\\x1b[90m'
};

function formatErrorLog(text) {
  return text.split('\\n').map(line => {
    if (/error|exception|failed|undefined|cannot/i.test(line)) return C.red + line + C.reset;
    if (/\\/[\\w/.-]*\\.[\\w]+:\\d+/.test(line)) return C.blue + line + C.reset;
    if (/:\\d+:\\d+/.test(line)) return C.yellow + line + C.reset;
    if (/https?:\\/\\//.test(line)) return C.cyan + line + C.reset;
    return C.gray + line + C.reset;
  }).join('\\n');
}

function getErrorSource(source) {
  if (!source || source === 'demo') {
    return \`Error: Cannot read undefined
    at module.js:42:15
    Error: Something went wrong\`;
  }
  if (source === '-') return fs.readFileSync(0, 'utf-8');
  if (fs.existsSync(source)) return fs.readFileSync(source, 'utf-8');
  return source;
}

function copyToClipboard(text) {
  try {
    const p = process.platform;
    if (p === 'darwin') execSync('echo "' + text.replace(/"/g, '\\\\"') + '" | pbcopy');
    else if (p === 'linux') execSync('printf "%s" "' + text.replace(/"/g, '\\\\"') + '" | xclip');
    return true;
  } catch (e) { return false; }
}

function main() {
  const args = process.argv.slice(2);
  const source = args.find(a => !a.startsWith('--')) || 'demo';
  const copy = args.includes('--copy');
  const raw = args.includes('--raw');
  const help = args.includes('--help');

  if (help) {
    console.log('\\n\\x1b[36m' + '${title}' + '\\x1b[0m');
    console.log('\\x1b[90m' + '${problem}' + '\\x1b[0m');
    console.log('\\nUsage: node index.js [source] [--copy] [--raw] [--help]');
    console.log('Source: file path, - for stdin, or demo\\n');
    return;
  }

  const errorText = getErrorSource(source);
  const formatted = raw ? errorText : formatErrorLog(errorText);

  console.log('\\n\\x1b[36m📋 ' + '${title}' + '\\x1b[0m\\n');
  console.log(formatted);
  console.log('\\n\\x1b[90m--- Source: ' + source + '\\x1b[0m');
  console.log('\\x1b[32m✅ Formatted successfully\\x1b[0m\\n');

  if (copy) {
    const ok = copyToClipboard(formatted);
    console.log(ok ? '\\x1b[32m📋 Copied!\\x1b[0m' : '\\x1b[33m⚠️ Failed\\x1b[0m');
  }
  console.log('\\x1b[90mDone.\\x1b[0m');
}

main();
`;
}

function generateOrganizationTracerBullet(title, problem) {
  return `#!/usr/bin/env node

/**
 * ${title}
 * ${problem}
 */

const fs = require('fs');
const path = require('path');

const C = {
  reset: '\\x1b[0m',
  green: '\\x1b[32m',
  cyan: '\\x1b[36m',
  gray: '\\x1b[90m'
};

function main() {
  console.log('\\n\\x1b[36m📋 ' + '${title}' + '\\x1b[0m');
  console.log('\\x1b[90m' + '${problem}' + '\\x1b[0m');
  console.log('\\n\\x1b[32m✅ Tracer bullet executed\\x1b[0m');
  console.log('\\x1b[90mDone.\\x1b[0m');
}

main();
`;
}

function generateGenericTracerBullet(title, problem) {
  return `#!/usr/bin/env node

/**
 * ${title}
 * ${problem}
 */

const fs = require('fs');
const path = require('path');

const C = {
  reset: '\\x1b[0m',
  green: '\\x1b[32m',
  cyan: '\\x1b[36m',
  gray: '\\x1b[90m'
};

function main() {
  console.log('\\n\\x1b[36m📋 ' + '${title}' + '\\x1b[0m');
  console.log('\\x1b[90m' + '${problem}' + '\\x1b[0m');
  console.log('\\n\\x1b[32m✅ Tracer bullet executed\\x1b[0m');
  console.log('\\x1b[90mDone.\\x1b[0m');
}

main();
`;
}

function analyzeProblemType(prd) {
  const text = `${prd.title} ${prd.problem.statement}`.toLowerCase();
  if (text.includes('copy') || text.includes('clipboard')) return 'clipboard_automation';
  if (text.includes('error') || text.includes('log') || text.includes('debug')) return 'debugging';
  if (text.includes('organize') || text.includes('manage') || text.includes('rename') || text.includes('file')) return 'organization';
  if (text.includes('automate') || text.includes('workflow')) return 'automation';
  if (text.includes('convert') || text.includes('transform')) return 'transformation';
  if (text.includes('monitor') || text.includes('watch')) return 'monitoring';
  return 'general';
}

async function writeTracerBullet(implementation, appPath, spec) {
  const filepath = path.join(appPath, 'index.js');
  fs.writeFileSync(filepath, implementation);
  return filepath;
}

module.exports = { buildTracerBullet, writeTracerBullet };
