'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

interface SSEStatusIndicatorProps {
  onTaskUpdate?: () => void;
}

export function SSEStatusIndicator({ onTaskUpdate }: SSEStatusIndicatorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setStatus('connecting');

    try {
      const es = new EventSource('/api/events/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log('[SSE] Connection established');
        setStatus('connected');
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'tasks.updated') {
            console.log('[SSE] Tasks updated:', data.data);
            setLastUpdate(new Date().toLocaleTimeString());
            
            // Trigger parent callback to refresh tasks
            if (onTaskUpdate) {
              onTaskUpdate();
            }
          }
        } catch (err) {
          console.error('[SSE] Error parsing message:', err);
        }
      };

      es.onerror = (err) => {
        console.error('[SSE] Connection error:', err);
        setStatus('reconnecting');
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err);
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const statusConfig = {
    connecting: {
      icon: Loader2,
      text: 'CONNECTING...',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
      animate: 'animate-spin',
    },
    connected: {
      icon: Wifi,
      text: 'LIVE',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20',
      animate: '',
    },
    reconnecting: {
      icon: WifiOff,
      text: 'RECONNECTING...',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20',
      animate: 'animate-pulse',
    },
    disconnected: {
      icon: WifiOff,
      text: 'OFFLINE',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20',
      animate: '',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300 bg-[var(--bg-tertiary)] border-[var(--bg-tertiary)]">
        <Icon size={14} className={cn(config.animate, status === 'reconnecting' && 'animate-bounce')} />
        <span className={config.color}>{config.text}</span>
        {status === 'connected' && (
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-green-400 opacity-50 animate-ping"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
          </div>
        )}
      </div>
      {lastUpdate && (
        <div className="hidden lg:block text-xs text-[var(--text-muted)]">
          Updated {lastUpdate}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
