// Beads CLI Client
// Wraps `bd` commands with proper TypeScript types and error handling

import { exec } from 'child_process';
import { promisify } from 'util';
import type { BeadsIssue } from './mapper';

const execAsync = promisify(exec);

// ============================================================================
// Configuration
// ============================================================================

const BEADS_EXEC = 'bd';
const TIMEOUT_MS = 30000; // 30 second timeout

// ============================================================================
// Error Handling
// ============================================================================

export class BeadsError extends Error {
  constructor(
    message: string,
    public readonly exitCode?: number,
    public readonly stderr?: string
  ) {
    super(message);
    this.name = 'BeadsError';
  }
}

/**
 * Execute `bd` command and return parsed JSON output
 */
async function execBeads(args: string[]): Promise<any> {
  try {
    const { stdout, stderr } = await execAsync(
      `${BEADS_EXEC} ${args.join(' ')}`,
      {
        timeout: TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    );

    if (stderr) {
      console.warn(`Beads warning: ${stderr}`);
    }

    return JSON.parse(stdout);
  } catch (error) {
    if (error && typeof error === 'object' && 'killed' in error) {
      throw new BeadsError(
        `Beads command timed out after ${TIMEOUT_MS}ms`,
        124 // Timeout exit code
      );
    }

    const execError = error as { code?: number; stderr?: string; message: string };

    throw new BeadsError(
      execError.message || 'Unknown beads error',
      execError.code,
      execError.stderr
    );
  }
}

// ============================================================================
// Task Operations
// ============================================================================

/**
 * List all issues with optional filters
 */
export async function listIssues(options: {
  status?: string;
  type?: string;
  assignee?: string;
  limit?: number;
} = {}): Promise<BeadsIssue[]> {
  const args = ['list', '--json'];

  if (options.status) args.push('--status', options.status);
  if (options.type) args.push('--type', options.type);
  if (options.assignee) args.push('--assignee', options.assignee);
  if (options.limit) args.push('--limit', options.limit.toString());

  const result = await execBeads(args);
  return Array.isArray(result) ? result : [];
}

/**
 * Get a single issue by ID
 */
export async function getIssue(id: string): Promise<BeadsIssue> {
  const args = ['show', id, '--json'];
  const result = await execBeads(args);

  // `bd show --json` returns an array with one element
  return Array.isArray(result) && result[0] ? result[0] : null;
}

/**
 * Create a new issue
 */
export async function createIssue(params: {
  title: string;
  description?: string;
  priority?: number; // 0-4
  assignee?: string;
  labels?: string[];
}): Promise<BeadsIssue> {
  const args = ['create', `"${params.title}"`, '--json'];

  if (params.priority !== undefined) args.push('-p', params.priority.toString());
  if (params.assignee) args.push('--assignee', params.assignee);
  if (params.description) args.push('--description', `"${params.description}"`);
  if (params.labels && params.labels.length > 0) {
    args.push('--labels', params.labels.join(','));
  }

  const result = await execBeads(args);
  return Array.isArray(result) && result[0] ? result[0] : result;
}

/**
 * Update an existing issue
 */
export async function updateIssue(id: string, params: {
  title?: string;
  description?: string;
  priority?: number;
  status?: string;
  assignee?: string;
  labels?: string[];
}): Promise<BeadsIssue> {
  const args = ['update', id, '--json'];

  if (params.title) args.push('--title', `"${params.title}"`);
  if (params.description) args.push('--description', `"${params.description}"`);
  if (params.priority !== undefined) args.push('--priority', params.priority.toString());
  if (params.status) args.push('--status', params.status);
  if (params.assignee) args.push('--assignee', params.assignee);
  if (params.labels) args.push('--labels', params.labels.join(','));

  const result = await execBeads(args);
  return Array.isArray(result) && result[0] ? result[0] : result;
}

/**
 * Close an issue
 */
export async function closeIssue(id: string, reason?: string): Promise<BeadsIssue> {
  const args = ['close', id, '--json'];

  if (reason) args.push('--reason', `"${reason}"`);

  const result = await execBeads(args);
  return Array.isArray(result) && result[0] ? result[0] : result;
}

/**
 * Delete an issue
 */
export async function deleteIssue(id: string): Promise<{ success: boolean }> {
  const args = ['delete', id, '--json'];
  const result = await execBeads(args);
  return { success: result?.success || false };
}

// ============================================================================
// Agent Operations
// ============================================================================

/**
 * Get issues with agent-specific data
 */
export async function getAgentIssues(agentCodeName: string): Promise<BeadsIssue[]> {
  const issues = await listIssues();
  return issues.filter(issue =>
    issue.labels?.includes(`agent:${agentCodeName}`)
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if `bd` is installed and accessible
 */
export async function checkBeadsAvailable(): Promise<boolean> {
  try {
    await execAsync('bd --version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Beads version
 */
export async function getBeadsVersion(): Promise<string> {
  const { stdout } = await execAsync('bd --version', { timeout: 5000 });
  return stdout.trim();
}
