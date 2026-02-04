import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig = {
  todo: { label: 'TODO', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  assigned: { label: 'ASSIGNED', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  in_progress: { label: 'IN PROGRESS', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  'needs-you': { label: 'NEEDS YOU', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ready: { label: 'READY', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  review: { label: 'REVIEW', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  shipped: { label: 'SHIPPED', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.todo;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-medium",
        config.color,
        sizeClasses
      )}
    >
      {config.label}
    </span>
  );
}
