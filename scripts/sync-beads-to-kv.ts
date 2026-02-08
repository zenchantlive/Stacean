#!/usr/bin/env tsx
/**
 * Beads → KV Sync Script
 * 
 * Reads all open issues from Beads and syncs them to KV (Upstash Redis).
 * This enables real-time task visibility on Vercel deployment.
 * 
 * Usage:
 *   npx tsx scripts/sync-beads-to-kv.ts
 *   npm run bd:sync
 * 
 * Add to package.json:
 *   "bd:sync": "npx tsx scripts/sync-beads-to-kv.ts"
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { kv as realKv } from '@vercel/kv';
import { randomUUID } from 'crypto';

/**
 * Load environment variables from .env.local
 */
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex);
          let value = trimmed.substring(eqIndex + 1);
          // Remove surrounding quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}

// Load env vars before any other imports
loadEnv();

// Types matching the Beads issue format (includes custom workflow statuses)
interface BeadsIssue {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'done' | 'blocked' | 'closed' | 'agent_working' | 'needs_jordan' | 'changes_requested' | 'ready_to_commit' | 'in_review' | 'pushed';
  priority: number;
  issue_type: string;
  assignee?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
  labels?: string[];
}

// Priority mapping: Beads (0=urgent, 3=low) → KV (urgent, high, medium, low)
const BEADS_PRIORITY_MAP = ['urgent', 'high', 'medium', 'low'];

// Status mapping: Beads → KV (6-status workflow)
// Workflow: TODO → IN_PROGRESS → NEEDS_YOU → REVIEW → READY → SHIPPED
const BEADS_STATUS_MAP: Record<BeadsIssue['status'], string> = {
  'open': 'todo',
  'in_progress': 'in_progress',
  'done': 'shipped',
  'blocked': 'needs-you',           // consolidated: blocked → needs-you
  'closed': 'shipped',
  'agent_working': 'in_progress',   // consolidated: agent_working → in_progress
  'needs_jordan': 'needs-you',
  'changes_requested': 'in_progress', // consolidated: back to work
  'ready_to_commit': 'ready',
  'in_review': 'review',
  'pushed': 'shipped',              // consolidated: pushed → shipped
};

/**
 * Fetch all open issues from Beads CLI
 */
function fetchBeadsIssues(): BeadsIssue[] {
  console.log('📦 Fetching issues from Beads...');

  try {
    const output = execSync('bd list --json', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: 30000,
    });

    const issues = JSON.parse(output);
    const openIssues = Array.isArray(issues)
      ? issues.filter((i: BeadsIssue) => i.status !== 'closed')
      : [];
    console.log(`   Found ${openIssues.length} active issues in Beads`);
    return openIssues;
  } catch (error) {
    console.error('❌ Failed to fetch from Beads:', error);
    return [];
  }
}

/**
 * Convert Beads issue to KV task format
 */
function beadToKVTask(bead: BeadsIssue) {
  return {
    id: bead.id,
    title: bead.title,
    description: bead.description || '',
    status: BEADS_STATUS_MAP[bead.status] || 'todo',
    priority: BEADS_PRIORITY_MAP[bead.priority] || 'medium',
    assignedTo: bead.assignee || 'JORDAN',
    agentCodeName: bead.labels?.find(l => l.startsWith('agent:'))?.replace('agent:', ''),
    project: bead.id.split('-')[0] || 'stacean',
    context: {
      files: [],
      logs: [],
    },
    createdAt: new Date(bead.created_at).getTime(),
    updatedAt: new Date(bead.updated_at).getTime(),
  };
}

/**
 * Sync all Beads issues to KV
 */
async function syncToKV(issues: BeadsIssue[]) {
  console.log('🚀 Syncing to KV (Upstash)...');

  const prefix = 'tracker:task:';
  let synced = 0;
  let skipped = 0;

  for (const issue of issues) {
    try {
      const task = beadToKVTask(issue);
      const key = `${prefix}${issue.id}`;

      // Store task in KV
      await realKv.set(key, task);
      synced++;

      console.log(`   ✅ ${issue.id}: ${task.title.substring(0, 40)}...`);
    } catch (error) {
      console.error(`   ❌ Failed to sync ${issue.id}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Sync complete: ${synced} synced, ${skipped} failed`);
  return { synced, skipped };
}

/**
 * Clean up closed/resolved tasks from KV
 */
async function cleanupClosedTasks(issues: BeadsIssue[]) {
  console.log('🧹 Cleaning up closed tasks from KV...');

  try {
    // Get all task keys
    const pattern = 'tracker:task:*';
    const keys = await realKv.keys(pattern);

    if (keys.length === 0) {
      console.log('   No tasks in KV to clean up');
      return;
    }

    const openIssueIds = new Set(issues.map(i => i.id));
    let removed = 0;

    for (const key of keys) {
      // Extract issue ID from key (tracker:task:clawd-abc123 → clawd-abc123)
      const issueId = key.replace('tracker:task:', '');

      if (!openIssueIds.has(issueId)) {
        await realKv.del(key);
        removed++;
        console.log(`   🗑️  Removed ${issueId}`);
      }
    }

    console.log(`   Removed ${removed} closed tasks from KV`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🔄 Beads → KV Sync Starting...\n');

  // Check KV credentials
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('❌ KV credentials not found. Run: npx vercel env pull');
    process.exit(1);
  }

  // Fetch from Beads
  const issues = fetchBeadsIssues();

  if (issues.length === 0) {
    console.log('⚠️  No open issues in Beads. Nothing to sync.');
    return;
  }

  // Sync to KV
  await syncToKV(issues);

  // Clean up closed tasks
  await cleanupClosedTasks(issues);

  console.log('\n✨ Sync complete! Tasks are now visible on Vercel.');
}

// Run if called directly
main().catch(console.error);