/**
 * Simple file lock implementation for Node.js
 * Prevents concurrent writes to the same file
 */

import { promises as fs } from 'fs';
import path from 'path';

export class FileLock {
  private lockFilePath: string;
  private lockFd: Awaited<ReturnType<typeof fs.open>> | null = null;

  constructor(filePath: string) {
    this.lockFilePath = `${filePath}.lock`;
  }

  /**
   * Acquire lock with timeout
   */
  async acquire(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        this.lockFd = await fs.open(this.lockFilePath, 'wx'); // Exclusive create
        return; // Lock acquired
      } catch (error) {
        // Lock exists, wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if lock is stale (older than 2 minutes)
        try {
          const stats = await fs.stat(this.lockFilePath);
          const lockAge = Date.now() - stats.mtimeMs;
          if (lockAge > 120000) { // 2 minutes
            // Stale lock, remove it
            await fs.unlink(this.lockFilePath);
          }
        } catch {
          // Ignore stat errors
        }
      }
    }

    throw new Error(`Failed to acquire lock after ${timeoutMs}ms`);
  }

  /**
   * Release lock
   */
  async release(): Promise<void> {
    if (this.lockFd !== null) {
      await this.lockFd.close();
      this.lockFd = null;
      try {
        await fs.unlink(this.lockFilePath);
      } catch {
        // Ignore unlink errors
      }
    }
  }

  /**
   * Check if lock is held
   */
  isLocked(): boolean {
    return this.lockFd !== null;
  }
}
