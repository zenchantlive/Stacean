// Beads API Client - Enhanced with Caching
// Adds in-memory caching to avoid excessive process spawning

import {
  listIssues as listIssuesUncached,
  getIssue as getIssueUncached,
  createIssue as createIssueUncached,
  updateIssue as updateIssueUncached,
  closeIssue as closeIssueUncached,
  deleteIssue as deleteIssueUncached
} from './client';
import type { BeadsIssue } from './mapper';

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_TTL_MS = 5000; // 5 second cache TTL
const MAX_CACHE_SIZE = 100; // Maximum cached items

// ============================================================================
// Cache Store
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const taskCache = new Map<string, CacheEntry<BeadsIssue[]>>();
const singleTaskCache = new Map<string, CacheEntry<BeadsIssue>>();

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Get cached data if valid
 */
function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  return null;
}

/**
 * Set cache entry
 */
function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });

  // Prune cache if too large
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    const oldestKey = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    cache.delete(oldestKey);
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  taskCache.clear();
  singleTaskCache.clear();
}

// ============================================================================
// Cached Operations
// ============================================================================

/**
 * List all issues with caching
 */
export async function listIssues(options: {
  status?: string;
  type?: string;
  assignee?: string;
  limit?: number;
} = {}): Promise<BeadsIssue[]> {
  const cacheKey = `list:${JSON.stringify(options)}`;

  // Check cache first
  const cached = getCached<BeadsIssue[]>(taskCache, cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from Beads
  const tasks = await listIssuesUncached(options);

  // Cache the result
  setCached(taskCache, cacheKey, tasks);

  return tasks;
}

/**
 * Get a single issue by ID with caching
 */
export async function getIssue(id: string): Promise<BeadsIssue | null> {
  const cached = getCached<BeadsIssue>(singleTaskCache, id);
  if (cached !== null) {
    return cached;
  }

  const task = await getIssueUncached(id);
  if (task !== null) {
    setCached(singleTaskCache, id, task);
  }

  return task;
}

/**
 * Create a new issue (no cache - writes are always fresh)
 */
export async function createIssue(params: {
  title: string;
  description?: string;
  priority?: number;
  assignee?: string;
  labels?: string[];
}): Promise<BeadsIssue> {
  const task = await createIssueUncached(params);

  // Invalidate caches
  taskCache.clear();
  singleTaskCache.delete(task.id);

  return task;
}

/**
 * Update an existing issue (invalidates cache)
 */
export async function updateIssue(id: string, params: {
  title?: string;
  description?: string;
  priority?: number;
  status?: string;
  assignee?: string;
  labels?: string[];
}): Promise<BeadsIssue> {
  const task = await updateIssueUncached(id, params);

  // Invalidate caches
  taskCache.clear();
  singleTaskCache.delete(id);

  return task;
}

/**
 * Close an issue (invalidates cache)
 */
export async function closeIssue(id: string, reason?: string): Promise<BeadsIssue> {
  const task = await closeIssueUncached(id, reason);

  // Invalidate caches
  taskCache.clear();
  singleTaskCache.delete(id);

  return task;
}

/**
 * Delete an issue (invalidates cache)
 */
export async function deleteIssue(id: string): Promise<{ success: boolean }> {
  const result = await deleteIssue(id);

  // Invalidate caches
  taskCache.clear();
  singleTaskCache.delete(id);

  return result;
}

// ============================================================================
// Export original types
// ============================================================================

export { BeadsError } from './client';
export type { BeadsIssue } from './mapper';
