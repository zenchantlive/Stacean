'use client';

import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Clock, User, MoreVertical } from 'lucide-react';
import { PriorityBadge } from '../common/PriorityBadge';
import { StatusBadge } from '../common/StatusBadge';

interface TaskCardProps {
  task: any;
  index: number;
  onClick?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, index, onClick, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={(e) => {
            // Don't trigger onClick if clicking delete button
            if ((e.target as HTMLElement).closest('.delete-btn')) return;
            onClick && onClick(task.id);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "group relative bg-[var(--bg-secondary)] p-4 rounded-xl mb-3 cursor-pointer border border-[var(--bg-tertiary)] transition-all duration-200",
            "hover:shadow-lg hover:shadow-[var(--accent)]/10 hover:scale-[1.02]",
            snapshot.isDragging ? "opacity-70 rotate-2 scale-105 shadow-2xl" : "",
            "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-transparent before:via-[var(--accent-light)] before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
          )}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' : undefined,
          }}
        >
          {/* Drag Handle - only visible on hover */}
          <div
            {...provided.dragHandleProps}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 cursor-grab",
              "group-hover:opacity-100"
            )}
          >
            <div className="w-6 h-8 flex items-center justify-center gap-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--bg-tertiary)]">
              <div className="w-1 h-4 rounded-full bg-[var(--text-muted)]" />
              <div className="w-1 h-4 rounded-full bg-[var(--text-muted)]" />
            </div>
          </div>

          {/* Content */}
          <div className="pl-10 space-y-3">
            {/* Header */}
            <div className="flex justify-between items-start gap-3">
              <h4
                className={cn(
                  "font-semibold text-[var(--text-primary)] text-sm leading-snug line-clamp-2",
                  "group-hover:text-[var(--accent)] transition-colors"
                )}
              >
                {task.title}
              </h4>
              <div className="flex items-center gap-1.5">
                <PriorityBadge priority={task.priority || 'medium'} size="sm" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(task.id);
                  }}
                  className="delete-btn p-1 rounded-md hover:bg-red-500/20 text-[var(--text-muted)] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical size={14} />
                </button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-1 border-t border-[var(--bg-tertiary)]/50">
              <div className="flex items-center gap-2">
                {task.agentCodeName && (
                  <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] px-2 py-1 rounded-md border border-[var(--bg-tertiary)]">
                    <User size={10} className="text-[var(--text-muted)]" />
                    <span className="font-medium text-[var(--text-secondary)]">
                      {task.agentCodeName}
                    </span>
                  </div>
                )}
                <StatusBadge status={task.status} size="sm" />
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <Clock size={10} />
                <span className="font-medium text-[var(--text-muted)]">
                  {new Date(task.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Priority border */}
          <div
            className={cn(
              "absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-colors duration-300",
              task.priority === 'urgent' && 'bg-red-500',
              task.priority === 'high' && 'bg-orange-500',
              task.priority === 'medium' && 'bg-yellow-500',
              (!task.priority || task.priority === 'low') && 'bg-green-500'
            )}
          />
        </div>
      )}
    </Draggable>
  );
}
