'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, Settings } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { TaskModal } from '../tasks/TaskModal';
import { SSEStatusIndicator } from '../common/SSEStatusIndicator';
import type { Task, TaskStatus } from '@/types/task';

interface KanbanBoardProps {
  initialTasks: Task[];
  onTaskClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask?: () => void;
  onSettingsClick?: () => void;
}

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'todo', title: 'TODO', color: '#A1A1AA' },
  { id: 'assigned', title: 'ASSIGNED', color: '#3B82F6' },
  { id: 'in_progress', title: 'IN PROGRESS', color: '#F97316' },
  { id: 'needs-you', title: 'NEEDS YOU', color: '#F59E0B' },
  { id: 'ready', title: 'READY', color: '#22C55E' },
  { id: 'review', title: 'REVIEW', color: '#8B5CF6' },
  { id: 'shipped', title: 'SHIPPED', color: '#10B981' },
];

const PRIORITY_COLORS: Record<NonNullable<Task['priority']>, string> = {
  urgent: 'var(--priority-urgent, #EF4444)',
  high: 'var(--priority-high, #F97316)',
  medium: 'var(--priority-medium, #3B82F6)',
  low: 'var(--priority-low, #71717A)',
};

// Wrapper to avoid React 18 types incompatibility with @hello-pangea/dnd
const TypedDragDropContext = DragDropContext as any; // eslint-disable-line

function DesktopBoard({
  columns,
  getColumnTasks,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onTaskDelete,
}: {
  columns: Column[];
  getColumnTasks: (status: TaskStatus) => Task[];
  onDragStart: (start: { draggableId: string }) => void;
  onDragEnd: (result: DropResult) => void;
  onTaskClick: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
}): React.ReactElement {
  return (
    <TypedDragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex-1 overflow-x-auto pb-6 min-w-0">
        <div className="flex gap-4 min-h-0 px-6 py-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              tasks={getColumnTasks(column.id)}
              onTaskClick={onTaskClick}
              onTaskDelete={onTaskDelete}
            />
          ))}
        </div>
      </div>
    </TypedDragDropContext>
  );
}

export function KanbanBoard({
  initialTasks,
  onTaskClick,
  onTaskDelete,
  onTaskUpdate,
  onCreateTask,
  onSettingsClick,
}: KanbanBoardProps): React.ReactElement {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Detect mobile device
  useEffect(() => {
    const checkMobile = (): void => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return (): void => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Sync tasks when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Mobile: tap to open status selector
  const handleTaskTap = useCallback((taskId: string): void => {
    const task = tasks.find((t): boolean => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      onTaskClick?.(taskId);
    }
  }, [tasks, onTaskClick]);

  // Handle task status change (for mobile, called from modal)
  const handleTaskStatusChange = useCallback((taskId: string, newStatus: TaskStatus): void => {
    setTasks((prev): Task[] => prev.map((t): Task => 
      t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));

    if (onTaskUpdate) {
      onTaskUpdate(taskId, { status: newStatus });
    }
  }, [onTaskUpdate]);

  const onDragStart = useCallback((start: { draggableId: string }): void => {
    const task = tasks.find((t): boolean => t.id === start.draggableId);
    setDraggedTask(task ?? null);
  }, [tasks]);

  const onDragEnd = useCallback(
    (result: DropResult): void => {
      setDraggedTask(null);

      const { destination, draggableId } = result;

      // Dropped outside any column
      if (!destination) return;

      const destinationStatus = destination.droppableId as TaskStatus;

      // Find task
      const taskIndex = tasks.findIndex((t): boolean => t.id === draggableId);
      const task = tasks[taskIndex];
      if (!task) return;

      // Optimistic UI update
      const updatedTask: Task = {
        ...task,
        status: destinationStatus,
        updatedAt: new Date().toISOString(),
      };

      const newTasks = Array.from(tasks);
      newTasks.splice(taskIndex, 1);
      newTasks.splice(taskIndex, 0, updatedTask);

      setTasks(newTasks);

      // Call update handler
      if (onTaskUpdate) {
        onTaskUpdate(task.id, { status: destinationStatus });
      }
    },
    [tasks, onTaskUpdate]
  );

  const getColumnTasks = useCallback(
    (status: TaskStatus): Task[] => tasks.filter((t): boolean => t.status === status),
    [tasks]
  );

  const totalTasks = tasks.length;
  const completedTasks = getColumnTasks('shipped').length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Scroll to column
  const scrollToColumn = useCallback((columnId: string): void => {
    const el = columnRefs.current.get(columnId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Mobile column render - memoized
  const mobileColumns = useMemo((): React.ReactNode => {
    return (
      <div className="flex flex-col gap-4">
        {COLUMNS.map((column): React.ReactNode => (
          <div 
            key={column.id}
            className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden"
            ref={(el: HTMLDivElement | null): void => {
              if (el) columnRefs.current.set(column.id, el);
              else columnRefs.current.delete(column.id);
            }}
          >
            {/* Column Header - touch friendly */}
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 bg-[var(--bg-tertiary)] touch-manipulation"
              onClick={(): void => scrollToColumn(column.id)}
              aria-label={`Go to ${column.title} column`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span className="font-semibold text-sm uppercase tracking-wider text-[var(--text-primary)]">
                  {column.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[var(--bg-primary)] px-2 py-0.5 rounded-full text-xs font-bold">
                  {getColumnTasks(column.id).length}
                </span>
                <span className="text-[var(--text-muted)]" aria-hidden="true">→</span>
              </div>
            </button>
            
            {/* Tasks - full width cards */}
            <div className="p-3 space-y-3">
              {getColumnTasks(column.id).map((task): React.ReactNode => (
                <div
                  key={task.id}
                  onClick={(): void => handleTaskTap(task.id)}
                  onKeyDown={(e: React.KeyboardEvent): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTaskTap(task.id);
                    }
                  }}
                  className="bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--bg-tertiary)] cursor-pointer active:bg-[var(--bg-hover)] transition-all touch-manipulation"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Task: ${task.title}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                      {task.title}
                    </h4>
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: PRIORITY_COLORS[task.priority ?? 'low']
                      }}
                    />
                  </div>
                  {task.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--bg-tertiary)]">
                    <div className="flex items-center gap-2">
                      {task.agentCodeName && (
                        <span className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded text-[var(--text-secondary)]">
                          {task.agentCodeName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      Tap to change status →
                    </span>
                  </div>
                </div>
              ))}
              {getColumnTasks(column.id).length === 0 && (
                <div className="text-center py-6 text-[var(--text-muted)] text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [getColumnTasks, handleTaskTap, scrollToColumn]);

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--bg-tertiary)] bg-[var(--bg-primary)]/50 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          {/* Progress Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Progress
              </span>
              <div className="w-48 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--bg-tertiary)]" />
                <span className="font-medium">{totalTasks}</span>
                <span className="text-[var(--text-muted)]">tasks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">{completedTasks}</span>
                <span className="text-[var(--text-muted)]">done</span>
              </div>
            </div>
          </div>

          {/* SSE Status */}
          <div className="flex items-center gap-3">
            <SSEStatusIndicator />
          </div>
        </div>

        {/* Action Buttons - touch friendly */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSettingsClick}
            className="p-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 touch-manipulation"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            type="button"
            onClick={onCreateTask}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/30 transition-all duration-200 font-medium text-sm touch-manipulation"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      {/* Mobile Quick Nav */}
      {isMobile && (
        <div className="md:hidden px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--bg-tertiary)]">
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Kanban columns">
            {COLUMNS.map((col): React.ReactNode => (
              <button
                key={col.id}
                type="button"
                onClick={(): void => scrollToColumn(col.id)}
                className="flex-shrink-0 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-full text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap touch-manipulation"
                role="tab"
                aria-label={`${col.title} column with ${getColumnTasks(col.id).length} tasks`}
              >
                {col.title} ({getColumnTasks(col.id).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Board Content */}
      {isMobile ? (
        // Mobile: Stacked column view (no drag-drop)
        <div className="flex-1 overflow-y-auto p-3">
          {mobileColumns}
        </div>
      ) : (
        // Desktop: Drag-drop Kanban
        <DesktopBoard
          columns={COLUMNS}
          getColumnTasks={getColumnTasks}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onTaskClick={handleTaskTap}
          onTaskDelete={onTaskDelete}
        />
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={(): void => setSelectedTask(null)}
          onUpdate={(updates): void => onTaskUpdate?.(selectedTask.id, updates)}
          onStatusChange={(taskId, newStatus): void => handleTaskStatusChange(taskId, newStatus as TaskStatus)}
        />
      )}

      {/* Dragging Overlay (desktop only) */}
      {!isMobile && draggedTask && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-24 bg-black/10 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent)] rounded-xl p-4 shadow-2xl max-w-md pointer-events-auto transform animate-in zoom-in-95 slide-in-from-top-8 duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-[var(--text-primary)]">
                Moving task
              </h4>
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
            </div>
            <p className="text-[var(--text-secondary)]">{draggedTask.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Drag to a column to move this task
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

KanbanBoard.displayName = 'KanbanBoard';