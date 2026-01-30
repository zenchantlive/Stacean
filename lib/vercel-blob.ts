/**
 * Vercel Blob Integration for Command Center
 * Stores screenshots, assets, and large data files
 */

import { put, list, del } from '@vercel/blob';

const BLOB_PREFIX = 'command-center/';

/**
 * Upload a screenshot to Blob
 */
export async function uploadScreenshot(
  imageData: Buffer,
  filename: string
): Promise<string | null> {
  try {
    const blob = await put(`${BLOB_PREFIX}screenshots/${filename}`, imageData, {
      access: 'public',
      addRandomSuffix: true,
    });
    return blob.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    return null;
  }
}

/**
 * Get list of screenshots
 */
export async function listScreenshots(limit = 20): Promise<Array<{
  url: string;
  uploadedAt: string;
  size: number;
}>> {
  try {
    const blobs = await list({
      prefix: `${BLOB_PREFIX}screenshots`,
      limit,
    });
    
    return blobs.blobs.map(b => ({
      url: b.url,
      uploadedAt: b.uploadedAt?.toISOString() || new Date().toISOString(),
      size: b.size,
    }));
  } catch (error) {
    console.error('Blob list error:', error);
    return [];
  }
}

/**
 * Upload state snapshot to Blob (for backup)
 */
export async function uploadStateSnapshot(
  stateData: Record<string, unknown>
): Promise<string | null> {
  try {
    const blob = await put(
      `${BLOB_PREFIX}snapshots/snapshot-${Date.now()}.json`,
      JSON.stringify(stateData, null, 2),
      {
        access: 'public',
      }
    );
    return blob.url;
  } catch (error) {
    console.error('Blob snapshot error:', error);
    return null;
  }
}

/**
 * Delete old screenshots (cleanup)
 */
export async function cleanupScreenshots(keepLast = 50): Promise<void> {
  try {
    const blobs = await list({
      prefix: `${BLOB_PREFIX}screenshots`,
      limit: 1000,
    });
    
    if (blobs.blobs.length > keepLast) {
      const toDelete = blobs.blobs.slice(0, blobs.blobs.length - keepLast);
      for (const blob of toDelete) {
        await del(blob.url);
      }
    }
  } catch (error) {
    console.error('Blob cleanup error:', error);
  }
}

/**
 * Get dashboard URL for Blob management
 */
export function getBlobDashboardUrl(): string {
  return 'https://vercel.com/zenchantlives-projects/blog/blob';
}