#!/usr/bin/env node

/**
 * Atlas Tasks CLI - Beads Integration
 *
 * Allows Atlas to manage tasks and agents via Beads CLI.
 * Uses `bd` commands instead of Vercel KV API.
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ============================================================================
// Configuration
// ============================================================================

const BEADS_EXEC = 'bd';
const TIMEOUT_MS = 30000;
const CWD = '/home/clawdbot/clawd';

// ============================================================================
// Beads CLI Helpers
// ============================================================================

/**
 * Execute `bd` command and return parsed JSON output
 */
async function execBeads(args) {
  try {
    const { stdout, stderr } = await execAsync(
      `${BEADS_EXEC} ${args.join(' ')}`,
      {
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024,
        cwd: CWD,
      }
    );

    if (stderr && !stderr.includes('Warning:')) {
      console.warn(`Beads warning: ${stderr}`);
    }

    return JSON.parse(stdout);
  } catch (error) {
    const execError = error;
    throw new Error(execError.message || 'Beads error');
  }
}

// ============================================================================
// Task Commands
// ============================================================================

/**
 * List all tasks
 */
async function listTasks(options = {}) {
  try {
    const tasks = await execBeads(['list', '--json']);

    // Filter by status if specified
    const filtered = options.status
      ? tasks.filter(t => t.status === options.status)
      : tasks;

    // Sort by priority then created_at
    const sorted = filtered.sort((a, b) => {
      const priorityDiff = a.priority - b.priority;
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at) - new Date(b.created_at);
    });

    if (sorted.length === 0) {
      console.log(`\n📋 No tasks found${options.status ? ` (status: ${options.status})` : ''}`);
      return;
    }

    console.log(`\n📋 Tasks (${sorted.length} total):\n`);

    sorted.forEach(task => {
      const statusIcon = {
        'todo': '⬜',
        'in-progress': '🔵',
        'review': '🟣',
        'done': '✅',
      }[task.status] || '⬜';

      const priorityIcon = {
        0: '🔴', // P0 - urgent
        1: '🟠', // P1 - high
        2: '🟡', // P2 - medium
        3: '🔵', // P3 - low
        4: '🔵', // P4 - low
      }[task.priority] || '🟡';

      const statusLabel = task.status.replace('-', ' ').toUpperCase();
      const date = new Date(task.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      console.log(`${statusIcon} ${task.title}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Status: ${statusLabel} ${priorityIcon} Priority: P${task.priority}`);
      if (task.assignee) console.log(`   Assigned: ${task.assignee}`);
      if (task.labels && task.labels.some(l => l.startsWith('agent:'))) {
        const agentLabel = task.labels.find(l => l.startsWith('agent:'));
        console.log(`   Agent: ${agentLabel?.replace('agent:', '')}`);
      }
      console.log();
    });
  } catch (error) {
    console.error(`Failed to list tasks: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create a new task
 */
async function createTask(title, options = {}) {
  try {
    const args = ['create', `"${title}"`, '--json'];

    if (options.priority !== undefined) args.push('-p', options.priority.toString());
    if (options.assignee && options.assignee !== 'JORDAN') args.push('--assignee', options.assignee);
    if (options.description) args.push('--description', `"${options.description}"`);
    if (options.agentCodeName) {
      args.push('--labels', `agent:${options.agentCodeName}`);
    }

    const result = await execBeads(args);
    const task = Array.isArray(result) && result[0] ? result[0] : result;

    console.log(`\n✅ Task created:\n`);
    console.log(`   Title: ${task.title}`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Priority: P${task.priority}\n`);

    return task;
  } catch (error) {
    console.error(`Failed to create task: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Update a task
 */
async function updateTask(id, options = {}) {
  try {
    const args = ['update', id, '--json'];

    if (options.status) args.push('--status', options.status);
    if (options.priority !== undefined) args.push('--priority', options.priority.toString());
    if (options.title) args.push('--title', `"${options.title}"`);

    if (args.length <= 2) {
      console.error('❌ No update options provided');
      showHelp();
      process.exit(1);
    }

    const result = await execBeads(args);
    const task = Array.isArray(result) && result[0] ? result[0] : result;

    console.log(`\n✅ Task updated:\n`);
    console.log(`   Title: ${task.title}`);
    console.log(`   Status: ${task.status.toUpperCase()}`);
    console.log(`   Priority: P${task.priority}\n`);

    return task;
  } catch (error) {
    console.error(`Failed to update task: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Mark a task as done
 */
async function markDone(id) {
  try {
    const result = await execBeads(['close', id, '--json']);
    const task = Array.isArray(result) && result[0] ? result[0] : result;

    console.log(`\n✅ Task marked as done:\n`);
    console.log(`   ${task.title}\n`);

    return task;
  } catch (error) {
    console.error(`Failed to mark task as done: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Delete a task
 */
async function deleteTask(id) {
  try {
    const result = await execBeads(['delete', id, '--json']);

    console.log(`\n🗑️  Task deleted (ID: ${id})\n`);
  } catch (error) {
    console.error(`Failed to delete task: ${error.message}`);
    process.exit(1);
  }
}

// ============================================================================
// CLI Parser
// ============================================================================

function parseArgs(args) {
  const options = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        options[key] = args[i + 1];
        i++;
      } else {
        options[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  return { options, positional };
}

function showHelp() {
  console.log(`
Atlas Fleet Commander CLI (Beads Integration)
Usage:
  node scripts/tasks.cjs list [--status <status>]
  node scripts/tasks.cjs add <title> [--priority <level>]
  node scripts/tasks.cjs done <id>
  node scripts/tasks.cjs update <id> [--status <status>]
  node scripts/tasks.cjs delete <id>

Commands:
  list          Show all tasks
  add           Create a new task
  done          Mark a task as complete
  update        Update task properties
  delete        Remove a task

Options:
  --status      Filter by status (todo, in-progress, review, done)
  --priority    Set priority (0=P0 urgent, 1=P1 high, 2=P2 medium, 3=P3 low)
  --description Set task description
  --assignee    Assign to agent or user (default: JORDAN)

Examples:
  node scripts/tasks.cjs list
  node scripts/tasks.cjs add "Fix dashboard bug" --priority 1
  node scripts/tasks.cjs update clawd-a1b2 --status in-progress
  node scripts/tasks.cjs done clawd-a1b2

Note: Priority 0-4 maps to urgent/medium/low in dashboard.
Be 0-2 days (P0-P1) for urgent/high priority tasks.
  `);
}

// ============================================================================
// Main
// ============================================================================

const args = process.argv.slice(2);
const { options, positional } = parseArgs(args);

const command = positional[0];

if (!command) {
  showHelp();
  process.exit(1);
}

switch (command) {
  case 'list':
    listTasks(options);
    break;

  case 'add':
    if (!positional[1]) { console.error('❌ Missing title'); process.exit(1); }
    createTask(positional[1], options);
    break;

  case 'update':
    if (!positional[1]) { console.error('❌ Missing ID'); process.exit(1); }
    updateTask(positional[1], options);
    break;

  case 'done':
    if (!positional[1]) { console.error('❌ Missing ID'); process.exit(1); }
    markDone(positional[1]);
    break;

  case 'delete':
    if (!positional[1]) { console.error('❌ Missing ID'); process.exit(1); }
    deleteTask(positional[1]);
    break;

  default:
    console.error(`❌ Unknown command: ${command}\n`);
    showHelp();
    process.exit(1);
}
