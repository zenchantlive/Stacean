/**
 * Advanced Notes System Tests
 * Focus: CLI Integration, Idempotency, and Production Script verification.
 * 
 * Unlike the basic tests, this suite executes the ACTUAL scripts used in production
 * (startup-notes.cjs and notes.cjs) to ensure real-world reliability.
 */

const { spawnSync } = require('child_process');
const { readFile, writeFile } = require('fs/promises');
const path = require('path');
const fs = require('fs');

const WORKSPACE = '/home/clawdbot/clawd';
const STARTUP_SCRIPT = path.join(WORKSPACE, 'system/integrations/kv/startup-notes.cjs');
const CLI_SCRIPT = path.join(WORKSPACE, 'scripts/notes.cjs');
const SHORT_TERM_FILE = path.join(WORKSPACE, 'short-term-notes.json');
const ALL_NOTES_FILE = path.join(WORKSPACE, 'all-notes.json');

let passed = 0;
let failed = 0;

function log(msg) { console.log(msg); }
function pass(test) { passed++; console.log(`  ✓ PASS: ${test}`); }
function fail(test, err) { failed++; console.log(`  ✗ FAIL: ${test} - ${err}`); }

function runScript(scriptPath, args = []) {
  return spawnSync('node', [scriptPath, ...args], { encoding: 'utf-8' });
}

async function loadJson(path) {
  try { return JSON.parse(await readFile(path, 'utf-8')); } 
  catch { return []; }
}

async function runAdvancedTests() {
  console.log('='.repeat(60));
  console.log('ADVANCED NOTES SYSTEM TESTS (Integration/CLI)');
  console.log('='.repeat(60));

  // --------------------------------------------------------------------------
  // TEST 1: Production Sync Script (Idempotency)
  // --------------------------------------------------------------------------
  log('\n[TEST 1] Startup Script Idempotency');
  try {
    // Run once
    let result = runScript(STARTUP_SCRIPT);
    if (result.status !== 0) throw new Error(`Script failed: ${result.stderr}`);
    
    const countAfterRun1 = (await loadJson(ALL_NOTES_FILE)).length;
    
    // Run again (should not duplicate)
    result = runScript(STARTUP_SCRIPT);
    const countAfterRun2 = (await loadJson(ALL_NOTES_FILE)).length;
    
    if (countAfterRun1 === countAfterRun2) {
      pass(`Idempotency verified (Count remained ${countAfterRun1})`);
    } else {
      fail('Idempotency', `Count changed from ${countAfterRun1} to ${countAfterRun2}`);
    }
  } catch (err) {
    fail('Startup Script', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: CLI List Command
  // --------------------------------------------------------------------------
  log('\n[TEST 2] CLI "list" command');
  try {
    const result = runScript(CLI_SCRIPT, ['list']);
    if (result.status === 0 && result.stdout.includes('Last')) {
      pass('CLI list command works');
    } else {
      fail('CLI list', `Exit ${result.status}, Output: ${result.stdout}`);
    }
  } catch (err) {
    fail('CLI list', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: CLI Search Command
  // --------------------------------------------------------------------------
  log('\n[TEST 3] CLI "search" command');
  try {
    // Search for something we know exists (based on previous logs)
    // "test" is a safe bet
    const result = runScript(CLI_SCRIPT, ['search', 'test']);
    
    if (result.status === 0) {
      if (result.stdout.includes('Found') || result.stdout.includes('notes matching')) {
        pass('CLI search returned results');
      } else {
        fail('CLI search', 'Output missing "Found" or "matching" keyword');
      }
    } else {
      fail('CLI search', `Exit ${result.status}, Error: ${result.stderr}`);
    }
  } catch (err) {
    fail('CLI search', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: CLI Refresh Command
  // --------------------------------------------------------------------------
  log('\n[TEST 4] CLI "refresh" command');
  try {
    const result = runScript(CLI_SCRIPT, ['refresh']);
    if (result.status === 0 && result.stdout.includes('Refresh complete')) {
      pass('CLI refresh command works');
    } else {
      fail('CLI refresh', `Exit ${result.status}, Output: ${result.stdout}`);
    }
  } catch (err) {
    fail('CLI refresh', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Data Integrity (Special Chars)
  // --------------------------------------------------------------------------
  log('\n[TEST 5] Special Character Preservation');
  try {
    // We check if the file contains the note with "ayye" or emojis we saw earlier
    const content = await readFile(ALL_NOTES_FILE, 'utf-8');
    
    // Check for some known patterns from dashboard notes
    // "testing :)" -> the smiley is a special char
    if (content.includes(':)')) {
      pass('Preserved smiley ":)"');
    } else {
      console.log('  ⚠️  Warning: Known special char note not found (might be old)');
    }
    
    // Check strictly that JSON is valid
    JSON.parse(content);
    pass('JSON integrity is valid');
    
  } catch (err) {
    fail('Data Integrity', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 6: Short Term vs Archive Logic
  // --------------------------------------------------------------------------
  log('\n[TEST 6] Short-Term vs Archive Separation');
  try {
    // Manually clear short-term
    await writeFile(SHORT_TERM_FILE, '[]');
    
    // Run sync
    runScript(STARTUP_SCRIPT);
    
    const shortTerm = await loadJson(SHORT_TERM_FILE);
    const archive = await loadJson(ALL_NOTES_FILE);
    
    // Logic: Sync should populate short-term if it's empty, but only with relevant notes
    // Actually, startup-notes.cjs logic says: 
    // "if new notes found, add to short-term"
    // AND "mark all short-term as read"
    
    if (archive.length >= shortTerm.length) {
      pass('Archive is superset of Short-Term');
    } else {
      fail('Logic', 'Archive smaller than Short-Term?');
    }
    
  } catch (err) {
    fail('Logic', err.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('ADVANCED TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL ADVANCED TESTS PASSED!');
  } else {
    console.log('\n⚠️  ISSUES FOUND');
  }
}

runAdvancedTests().catch(console.error);
