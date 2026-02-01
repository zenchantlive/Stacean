#!/usr/bin/env node

/**
 * Daily Shipper - Main Entry Point
 *
 * Full workflow: X Trend → Concept → PRD → TDD → Tracer Bullet → Build → Test → PR
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PROJECT_ROOT = '/home/clawdbot/clawd/skills/daily-shipper';
const LOG_FILE = path.join(PROJECT_ROOT, 'logs/daily_ship.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  console.log(entry);
  fs.appendFileSync(LOG_FILE, entry, { flag: 'a' });
}

const logsDir = path.join(PROJECT_ROOT, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

async function main() {
  log('=== Daily Shipper Started (Real X Trends) ===');

  try {
    log('Step 1: Scanning X for AI/tech trends...');
    const { scanTrends } = require('./trend_scanner');
    const trends = await scanTrends();

    if (!trends || trends.length === 0) {
      log('No trends found. Aborting.');
      return;
    }

    log(`Found ${trends.length} trends from ${trends[0]?.source || 'unknown'}.`);

    log('Step 2: Selecting winning trend with novelty assessment...');
    const { selectTrend } = require('./selector');
    const selected = selectTrend(trends);
    if (!selected) {
      log('No suitable trend found. Aborting.');
      return;
    }

    const noveltyScore = selected.noveltyAssessment?.score || 0;
    log(`Selected: ${selected.title} (Score: ${selected.finalScore?.toFixed(2) || 'N/A'}, Novelty: ${noveltyScore})`);

    log('Step 3: Generate app concepts (model)...');
    let concept;
    if (process.env.CONCEPT_JSON) {
      concept = JSON.parse(process.env.CONCEPT_JSON);
      log('Using injected concept JSON');
    } else {
      const { pickBestConcept } = require('./concept_generator');
      concept = await pickBestConcept(selected);
    }

    if (!concept || !concept.appName || !(concept.uiPages || []).length) {
      log('Concept failed quality check. Aborting.');
      return;
    }

    if (!passesQualityGate(concept)) {
      log('Quality gate failed. Aborting (no low-quality apps).');
      return;
    }

    log(`Concept: ${concept.appName}`);

    log('Step 4: Generate PRD...');
    const { generatePRD, writePRD } = require('./prd_generator');
    const spec = { trend: selected, language: 'JavaScript', appType: 'web-app' };
    const prd = generatePRD(spec);

    const TEMP_DIR = '/tmp/daily-shipper';
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const repoName = generateRepoName(concept.appName);
    const appPath = path.join(TEMP_DIR, repoName);
    fs.mkdirSync(appPath, { recursive: true });

    log('Step 5: Build real web app from concept...');
    const { buildWebApp } = require('./web_app_builder');
    await buildWebApp(appPath, concept);

    await writePRD(prd, appPath);

    log('Step 6: Install deps + run tests...');
    execSync('npm install', { cwd: appPath, stdio: 'ignore' });
    const { runFullTestSuite } = require('./test_runner');
    const testResult = await runFullTestSuite(prd, appPath);
    log(`Tests: ${testResult.testResults?.summary?.passed || 0}/${testResult.testResults?.summary?.total || 0} passed`);

    log('Step 7: Create GitHub repo and PR...');
    const { pushToGitHubWithPR } = require('./github_pusher');
    const pushResult = await pushToGitHubWithPR(appPath, prd);
    if (!pushResult.success) {
      log(`GitHub push/PR failed: ${pushResult.error}`);
      return;
    }

    log(`GitHub repo created: ${pushResult.repoUrl}`);
    log(`PR created: ${pushResult.prUrl || 'Pending'}`);

    log('Step 8: Notify...');
    const summary = `
🚀 **Daily App Shipped**

**App:** ${concept.appName}
**Repo:** ${pushResult.repoUrl}
**PR:** ${pushResult.prUrl || 'Pending'}
**Tests:** ${testResult.testResults?.summary?.passed || 0}/${testResult.testResults?.summary?.total || 0}

Trend: ${selected.title}

Built via: X Scan → Concept → PRD → TDD → Build → Test → PR
`.trim();

    log(`NOTIFICATION:\n${summary}`);
    fs.writeFileSync(path.join(PROJECT_ROOT, 'last_shipped.txt'), summary);

    log('=== Daily Shipper Complete ===');

  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
  }
}

function passesQualityGate(concept) {
  const fields = concept.dataFields || [];
  const uiPages = concept.uiPages || [];
  const desc = concept.appDescription || '';
  const nonTrivial = concept.nonTrivialityCheck || '';

  return (
    concept.appName &&
    desc.length > 40 &&
    fields.length >= 3 &&
    uiPages.length >= 3 &&
    /not a script|not trivial|non-trivial/i.test(nonTrivial)
  );
}

function generateRepoName(title) {
  const timestamp = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const baseName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${baseName}-${timestamp}`.substring(0, 100);
}

if (require.main === module) {
  main().catch(err => {
    log(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
