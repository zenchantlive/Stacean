import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'sm' | 'md';
}

const priorityConfig = {
  low: {
    label: 'LOW',
    icon: null,
    color: 'bg-green-500/10 text-green-400 border-green-500/20',
    dot: 'bg-green-500',
  },
  medium: {
    label: 'MEDIUM',
    icon: null,
    color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    dot: 'bg-yellow-500',
  },
  high: {
    label: 'HIGH',
    icon: AlertTriangle,
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dot: 'bg-orange-500',
  },
  urgent: {
    label: 'URGENT',
    icon: Zap,
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-500',
  },
};

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  // Defensive check: fall back to 'medium' if priority is invalid or undefined
  // This prevents crashes when API returns malformed task data
  const validPriority = priority in priorityConfig ? priority : 'medium';
  const config = priorityConfig[validPriority];
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-semibold",
        config.color,
        sizeClasses
      )}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {Icon && <Icon size={size === 'sm' ? 10 : 12} />}
      <span>{config.label}</span>
    </span>
  );
}
