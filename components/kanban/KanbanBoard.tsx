'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus, Settings } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { TaskModal } from '../tasks/TaskModal';
import { SSEStatusIndicator } from '../common/SSEStatusIndicator';
import { Task, TaskStatus } from '@/types/task';

interface KanbanBoardProps {
  initialTasks: Task[];
  onTaskClick?: (taskId: string) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask?: () => void;
  onSettingsClick?: () => void;
}

const COLUMNS = [
  { id: 'todo' as TaskStatus, title: 'TODO', color: '#A1A1AA' },
  { id: 'assigned' as TaskStatus, title: 'ASSIGNED', color: '#3B82F6' },
  { id: 'in_progress' as TaskStatus, title: 'IN PROGRESS', color: '#F97316' },
  { id: 'needs-you' as TaskStatus, title: 'NEEDS YOU', color: '#F59E0B' },
  { id: 'ready' as TaskStatus, title: 'READY', color: '#22C55E' },
  { id: 'review' as TaskStatus, title: 'REVIEW', color: '#8B5CF6' },
  { id: 'shipped' as TaskStatus, title: 'SHIPPED', color: '#10B981' },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'TODO', color: '#71717A' },
  { value: 'assigned', label: 'ASSIGNED', color: '#3B82F6' },
  { value: 'in_progress', label: 'IN PROGRESS', color: '#F97316' },
  { value: 'needs-you', label: 'NEEDS YOU', color: '#F59E0B' },
  { value: 'ready', label: 'READY', color: '#22C55E' },
  { value: 'review', label: 'REVIEW', color: '#8B5CF6' },
  { value: 'shipped', label: 'SHIPPED', color: '#10B981' },
];

export function KanbanBoard({
  initialTasks,
  onTaskClick,
  onTaskDelete,
  onTaskUpdate,
  onCreateTask,
  onSettingsClick,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isTouchDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync tasks when initialTasks change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Handle task update from modal
  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ));

    // Call external handler
    if (onTaskUpdate) {
      onTaskUpdate(taskId, updates);
    }

    // Update selected task if it's the one being edited
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    }
  }, [onTaskUpdate, selectedTask]);

  // Handle task click (for modal)
  const handleTaskClickInternal = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      if (onTaskClick) {
        onTaskClick(taskId);
      }
    }
  }, [tasks, onTaskClick]);

  // Handle delete with modal
  const handleTaskDeleteInternal = useCallback((taskId: string) => {
    setSelectedTask(null);
    if (onTaskDelete) {
      onTaskDelete(taskId);
    }
  }, [onTaskDelete]);

  const onDragStart = useCallback((start: { draggableId: string }) => {
    const task = tasks.find((t) => t.id === start.draggableId);
    setDraggedTask(task || null);
  }, [tasks]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      setDraggedTask(null);

      const { destination, source, draggableId } = result;

      // Dropped outside any column
      if (!destination) return;

      // Dropped in same position
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const sourceStatus = source.droppableId as TaskStatus;
      const destinationStatus = destination.droppableId as TaskStatus;

      // Find task
      const taskIndex = tasks.findIndex((t) => t.id === draggableId);
      const task = tasks[taskIndex];
      if (!task) return;

      // Create optimistic updated task
      const updatedTask = {
        ...task,
        status: destinationStatus,
        updatedAt: new Date().toISOString(),
      };

      // Optimistic UI update
      const newTasks = Array.from(tasks);
      newTasks.splice(taskIndex, 1);

      // Calculate new index in destination column
      const destinationColumnTasks = newTasks.filter(
        (t) => t.status === destinationStatus
      );
      const newIndex = Math.min(destination.index, destinationColumnTasks.length);
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
    (status: TaskStatus) => {
      return tasks.filter((t) => t.status === status);
    },
    [tasks]
  );

  const totalTasks = tasks.length;
  const completedTasks = getColumnTasks('shipped').length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onCreateTask}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent)]/30 transition-all duration-200 font-medium text-sm"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-6 min-w-0">
          <div className="flex gap-4 min-h-0 px-6 py-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                tasks={getColumnTasks(column.id)}
                onTaskClick={handleTaskClickInternal}
                onTaskDelete={handleTaskDeleteInternal}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => handleTaskUpdate(selectedTask.id, updates)}
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
