/**
 * App Builder - Generate app spec from selected trend
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../templates');

async function generateSpec(trend) {
  // Determine best tech stack and app type
  const decision = makeTechDecision(trend);

  const spec = {
    trend: {
      id: trend.id,
      title: trend.title,
      description: trend.description,
      tags: trend.tags
    },
    language: decision.language,
    appType: decision.appType,
    framework: decision.framework,
    files: decision.files,
    tests: decision.tests,
    deployment: decision.deployment
  };

  return spec;
}

/**
 * Decide tech stack based on trend description
 */
function makeTechDecision(trend) {
  const desc = trend.description.toLowerCase();

  // Browser extension
  if (desc.includes('extension') || desc.includes('browser') || desc.includes('chrome')) {
    return {
      language: 'JavaScript',
      appType: 'browser-extension',
      framework: 'Vanilla JS + Manifest V3',
      files: [
        'manifest.json',
        'popup.html',
        'content.js',
        'background.js',
        'icons/icon16.png',
        'icons/icon48.png',
        'icons/icon128.png'
      ],
      tests: ['test manifest validity', 'test popup renders'],
      deployment: 'Chrome Web Store (free)'
    };
  }

  // CLI tool
  if (desc.includes('cli') || desc.includes('command line') || desc.includes('tool')) {
    // Prefer Ruby for CLI (Jordan's preference), fall back to Node
    const useRuby = desc.includes('git') || desc.includes('commit') || desc.includes('lint');

    if (useRuby) {
      return {
        language: 'Ruby',
        appType: 'cli-gem',
        framework: 'Thor CLI',
        files: [
          'lib/cli.rb',
          'lib/generator.rb',
          'spec/cli_spec.rb',
          'README.md',
          'LICENSE',
          'Gemfile'
        ],
        tests: ['bundle exec rspec'],
        deployment: 'RubyGems.org'
      };
    }

    return {
      language: 'JavaScript',
      appType: 'cli-package',
      framework: 'Commander.js',
      files: [
        'src/index.js',
        'src/generator.js',
        'test/index.test.js',
        'README.md',
        'LICENSE',
        'package.json'
      ],
      tests: ['npm test'],
      deployment: 'npm registry'
    };
  }

  // Web app with UI
  if (desc.includes('app') || desc.includes('gui') || desc.includes('dashboard')) {
    // Prefer Next.js (serverless, Vercel, Jordan's preference)
    return {
      language: 'JavaScript',
      appType: 'web-app',
      framework: 'Next.js + Tailwind CSS',
      files: [
        'app/page.tsx',
        'components/Button.tsx',
        'components/Input.tsx',
        'lib/api.ts',
        'styles/globals.css',
        'README.md',
        'LICENSE',
        'package.json',
        'tsconfig.json',
        'next.config.js'
      ],
      tests: ['npm run test'],
      deployment: 'Vercel (free tier)'
    };
  }

  // Default: simple script or tool
  return {
    language: 'JavaScript',
    appType: 'script-tool',
    framework: 'Vanilla JS',
    files: [
      'index.js',
      'README.md',
      'LICENSE'
    ],
    tests: ['node index.js --test'],
    deployment: 'GitHub (run directly)'
  };
}

module.exports = { generateSpec };
