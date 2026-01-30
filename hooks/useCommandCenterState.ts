/**
 * Command Center State Hook - Uses Vercel KV
 * React hook for real-time state management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface CommandCenterState {
  atlasOnline: boolean;
  lastHeartbeat: string;
  currentActivity: string;
  activeWidget: string;
  pulseIntensity: number;
  cpuLoad: number;
  memoryUsage: number;
  sessionCount: number;
  lastSessionAt: string;
  theme: 'warm-industrial' | 'deep-zinc' | 'light-mode';
  dockPosition: number;
}

const DEFAULT_STATE: CommandCenterState = {
  atlasOnline: true,
  lastHeartbeat: new Date().toISOString(),
  currentActivity: 'Initializing',
  activeWidget: 'pulse',
  pulseIntensity: 1.0,
  cpuLoad: 0,
  memoryUsage: 0,
  sessionCount: 0,
  lastSessionAt: new Date().toISOString(),
  theme: 'warm-industrial',
  dockPosition: 0,
};

export function useCommandCenterState() {
  const [state, setState] = useState<CommandCenterState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial state
  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setState(data);
        }
      } catch (err) {
        // KV not available, use local state
        console.log('Using local state (KV not connected)');
      } finally {
        setLoading(false);
      }
    }
    fetchState();
  }, []);

  // Update state
  const updateState = useCallback(async (updates: Partial<CommandCenterState>) => {
    setState(prev => ({ ...prev, ...updates }));
    
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      // KV not available, state remains local
    }
  }, []);

  // Heartbeat
  const heartbeat = useCallback(async (activity: string) => {
    await updateState({
      atlasOnline: true,
      currentActivity: activity,
      lastHeartbeat: new Date().toISOString(),
    });
  }, [updateState]);

  return {
    state,
    loading,
    error,
    updateState,
    heartbeat,
  };
}