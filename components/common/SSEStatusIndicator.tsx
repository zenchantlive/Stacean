'use client';

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function SSEStatusIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    // Simulate connection
    const connect = () => {
      setStatus('connecting');
      setTimeout(() => {
        setStatus('connected');
      }, 1500);
    };

    connect();

    // Simulate reconnection after 30 seconds
    const reconnectInterval = setInterval(() => {
      setIsReconnecting(true);
      setStatus('reconnecting');
      setTimeout(() => {
        setIsReconnecting(false);
        setStatus('connected');
      }, 2000);
    }, 30000);

    return () => clearInterval(reconnectInterval);
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
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-300',
        config.bgColor,
        isReconnecting && 'animate-pulse'
      )}
    >
      <Icon size={14} className={cn(config.animate, status === 'reconnecting' && 'animate-bounce')} />
      <span className={config.color}>{config.text}</span>
      {status === 'connected' && (
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-50 animate-ping"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
        </div>
      )}
    </div>
  );
}
