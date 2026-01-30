/**
 * State API Route - KV-backed state management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getState, saveState, incrementSession, DEFAULT_STATE, addLedgerEntry } from '@/lib/vercel-kv';

// Type validation helpers
function isValidBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isValidString(value: unknown): value is string {
  return typeof value === 'string';
}

export async function GET() {
  try {
    const state = await getState();
    // Return state as-is (includes _connected flag)
    return NextResponse.json(state);
  } catch (error) {
    // Fallback to default state if KV not available
    return NextResponse.json({
      ...DEFAULT_STATE,
      currentActivity: 'KV Not Connected',
      _connected: false
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawUpdates = await request.json();
    
    // Validate and sanitize updates
    const updates: Record<string, unknown> = {};
    
    if (rawUpdates.atlasOnline !== undefined && isValidBoolean(rawUpdates.atlasOnline)) {
      updates.atlasOnline = rawUpdates.atlasOnline;
    }
    if (rawUpdates.currentActivity !== undefined && isValidString(rawUpdates.currentActivity)) {
      updates.currentActivity = rawUpdates.currentActivity;
    }
    if (rawUpdates.lastHeartbeat !== undefined && isValidString(rawUpdates.lastHeartbeat)) {
      updates.lastHeartbeat = rawUpdates.lastHeartbeat;
    }
    if (rawUpdates.activeWidget !== undefined && isValidString(rawUpdates.activeWidget)) {
      updates.activeWidget = rawUpdates.activeWidget;
    }
    if (rawUpdates.pulseIntensity !== undefined && isValidNumber(rawUpdates.pulseIntensity)) {
      updates.pulseIntensity = Math.max(0, Math.min(1, rawUpdates.pulseIntensity));
    }
    if (rawUpdates.cpuLoad !== undefined && isValidNumber(rawUpdates.cpuLoad)) {
      updates.cpuLoad = Math.max(0, Math.min(100, rawUpdates.cpuLoad));
    }
    if (rawUpdates.memoryUsage !== undefined && isValidNumber(rawUpdates.memoryUsage)) {
      updates.memoryUsage = Math.max(0, Math.min(100, rawUpdates.memoryUsage));
    }
    if (rawUpdates.sessionCount !== undefined && isValidNumber(rawUpdates.sessionCount)) {
      updates.sessionCount = Math.max(0, Math.floor(rawUpdates.sessionCount));
    }
    if (rawUpdates.dockPosition !== undefined && isValidNumber(rawUpdates.dockPosition)) {
      updates.dockPosition = rawUpdates.dockPosition;
    }
    
    // Get current state to check for changes
    const current = await getState();
    const wasOnline = current.atlasOnline;
    
    await saveState(updates);
    
    // Log significant state changes to ledger
    if (updates.atlasOnline !== undefined && updates.atlasOnline !== wasOnline) {
      await addLedgerEntry({
        type: 'pulse',
        message: updates.atlasOnline ? 'Atlas came online' : 'Atlas went offline',
        metadata: { activity: updates.currentActivity }
      });
    } else if (updates.currentActivity && updates.currentActivity !== current.currentActivity) {
      await addLedgerEntry({
        type: 'session',
        message: `Started working on: ${updates.currentActivity}`,
        metadata: { activity: updates.currentActivity }
      });
    }
    
    // Increment session on first activity
    if (updates.currentActivity && current.sessionCount === 0) {
      await incrementSession();
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('State POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update state' }, { status: 500 });
  }
}