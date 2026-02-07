'use client';

import React, { useState } from 'react';
import { Droppable as _Droppable } from '@hello-pangea/dnd';
const Droppable = _Droppable as any; // eslint-disable-line
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
  color: string;
  onTaskClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
}

export function KanbanColumn({ id, title, tasks, color, onTaskClick, onTaskDelete }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col w-full min-w-[280px] max-w-[350px] bg-[var(--bg-primary)] rounded-xl h-full transition-all duration-300",
        "hover:shadow-lg"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-[var(--bg-tertiary)] flex justify-between items-center sticky top-0 bg-[var(--bg-primary)] z-10 rounded-t-xl backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div className="relative">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <div
              className="absolute inset-0 rounded-full opacity-50 animate-ping"
              style={{ backgroundColor: color }}
            />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider">
            {title}
          </h3>
        </div>

        {/* Task Count Badge */}
        <span className="relative inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-xs font-bold font-mono text-[var(--text-primary)]">
          {tasks.length}
          {tasks.length > 0 && (
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
          )}
        </span>
      </div>

      {/* Droppable Area */}
      <Droppable
        droppableId={id}
        type="TASK"
        direction="vertical"
      >
        {(provided: any, snapshot: any) => {
          const isOver = snapshot.isDraggingOver;

          return (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "flex-1 p-3 overflow-y-auto min-h-[150px] rounded-b-xl transition-all duration-300",
                "scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-transparent",
                isOver && "bg-[var(--bg-secondary)]/30 ring-2 ring-[var(--accent)]/30 ring-inset"
              )}
            >
              {/* Tasks */}
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    onClick={onTaskClick}
                    onDelete={onTaskDelete}
                  />
                ))}
              </div>

              {/* Drop Placeholder */}
              {provided.placeholder}

              {/* Empty State */}
              {tasks.length === 0 && !isOver && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--bg-tertiary)] flex items-center justify-center mb-3">
                    <span className="text-2xl">+</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Drop tasks here
                  </p>
                </div>
              )}

              {/* Drag Over State */}
              {isOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)]/50 backdrop-blur-sm rounded-b-xl animate-in fade-in">
                  <div className="bg-[var(--accent)] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-[var(--accent)]/30">
                    Drop to {title}
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </Droppable>
    </div>
  );
}
