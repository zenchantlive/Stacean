"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, TaskStatus, TaskPriority, isObjective, getChildTasks, isParentReady } from '@/lib/types/tracker-new';
import { ChevronDown, ChevronRight, Check, Circle } from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// Styles
// ============================================================================

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  open: { bg: 'bg-[#6fa5a2]/10', text: 'text-[#6fa5a2]', border: 'border-[#6fa5a2]/20' },
  in_progress: { bg: 'bg-[#8ea89e]/10', text: 'text-[#8ea89e]', border: 'border-[#8ea89e]/20' },
  review: { bg: 'bg-[#b7a98a]/10', text: 'text-[#b7a98a]', border: 'border-[#b7a98a]/20' },
  done: { bg: 'bg-[#7b8b7d]/10', text: 'text-[#7b8b7d]', border: 'border-[#7b8b7d]/20' },
  tombstone: { bg: 'bg-[#5b4b47]/10', text: 'text-[#5b4b47]', border: 'border-[#5b4b47]/20' },
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-[#b46b4f]',
  high: 'bg-[#c98d6a]',
  medium: 'bg-[#b7a98a]',
  low: 'bg-[#8ea89e]',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  tombstone: 'Tombstone',
};

// ============================================================================
// Component Props
// ============================================================================

interface ObjectiveStackViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onCreateChild?: (parentId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ObjectiveStackView({ 
  tasks, 
  onTaskClick, 
  onStatusChange,
  onCreateChild 
}: ObjectiveStackViewProps) {
  // Filter out tombstone tasks
  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'tombstone'), [tasks]);

  // Get top-level objectives (Ready objectives float to top)
  const objectives = useMemo(() => {
    const topLevel = activeTasks.filter(t => !t.parentId);
    return [...topLevel].sort((a, b) => {
      const aReady = isParentReady(a.id, activeTasks);
      const bReady = isParentReady(b.id, activeTasks);
      if (aReady && !bReady) return -1;
      if (!aReady && bReady) return 1;
      return 0;
    });
  }, [activeTasks]);

  // Track expanded objectives
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());

  // Toggle expand/collapse
  const toggleExpand = (objectiveId: string) => {
    setExpandedObjectives(prev => {
      const next = new Set(prev);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
      } else {
        next.add(objectiveId);
      }
      return next;
    });
  };

  // Expand all or collapse all
  const expandAll = () => setExpandedObjectives(new Set(objectives.map(o => o.id)));
  const collapseAll = () => setExpandedObjectives(new Set());

  if (objectives.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#1d1917] border border-white/10 flex items-center justify-center mb-4">
          <Circle size={32} className="text-[#6b615a]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f2efed] mb-2">No objectives yet</h3>
        <p className="text-sm text-[#9a8f86] mb-6 max-w-xs">
          Create your first objective to start planning your work
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#f2efed]">Objectives</h2>
          <p className="text-xs text-[#9a8f86]">
            {objectives.length} objective{objectives.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-[#9a8f86] hover:text-[#f2efed] hover:bg-[#1d1917] rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-[#9a8f86] hover:text-[#f2efed] hover:bg-[#1d1917] rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Objectives Stack */}
      <div className="space-y-4">
        {objectives.map(objective => {
          const isExpanded = expandedObjectives.has(objective.id);
          const childTasks = getChildTasks(objective.id, activeTasks);
          const isReady = isParentReady(objective.id, activeTasks);
          const isObjectiveTask = isObjective(objective, activeTasks);

          return (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              childTasks={childTasks}
              isExpanded={isExpanded}
              isReady={isReady}
              isObjectiveTask={isObjectiveTask}
              onToggle={() => toggleExpand(objective.id)}
              onTaskClick={onTaskClick}
              onStatusChange={onStatusChange}
              onCreateChild={onCreateChild}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Objective Card Component
// ============================================================================

interface ObjectiveCardProps {
  objective: Task;
  childTasks: Task[];
  isExpanded: boolean;
  isReady: boolean;
  isObjectiveTask: boolean;
  onToggle: () => void;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onCreateChild?: (parentId: string) => void;
}

function ObjectiveCard({
  objective,
  childTasks,
  isExpanded,
  isReady,
  isObjectiveTask,
  onToggle,
  onTaskClick,
  onStatusChange,
  onCreateChild,
}: ObjectiveCardProps) {
  const statusConfig = STATUS_COLORS[objective.status];
  const priorityColor = PRIORITY_COLORS[objective.priority];

  // Sort child tasks by priority
  const sortedChildren = useMemo(() => {
    const priorityOrder: Record<TaskPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return [...childTasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [childTasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="task-card overflow-hidden"
    >
      {/* Objective Header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-[#25201d]/50 transition-colors"
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 pt-0.5">
          {isExpanded ? (
            <ChevronDown size={16} className="text-[#9a8f86]" />
          ) : (
            <ChevronRight size={16} className="text-[#9a8f86]" />
          )}
        </div>

        {/* Priority Indicator */}
        <div className="flex-shrink-0 pt-1">
          <div className={clsx('task-dot', `task-dot-${objective.priority}`)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[#f2efed] truncate">
              {objective.title}
            </h3>
            {/* Ready Badge */}
            {isReady && childTasks.length > 0 && (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-medium text-[#8ea89e] bg-[#8ea89e]/10 rounded-full">
                Ready
              </span>
            )}
          </div>

          {objective.description && (
            <p className="text-xs text-[#9a8f86] mb-2">
              {objective.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Chip */}
            <span className={clsx('task-chip', `task-chip-status-${objective.status}`)}>
              <Circle size={8} fill="currentColor" />
              {STATUS_LABELS[objective.status]}
            </span>

            {/* Project */}
            {objective.project && (
              <span className="text-[10px] text-[#9a8f86] font-mono">
                {objective.project}
              </span>
            )}

            {/* Child Count */}
            {childTasks.length > 0 && (
              <span className="text-[10px] text-[#9a8f86]">
                {childTasks.length} subtask{childTasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex-shrink-0">
          {objective.status === 'done' ? (
            <div className="w-6 h-6 rounded-full bg-[#7b8b7d]/20 border border-[#7b8b7d]/40 flex items-center justify-center">
              <Check size={12} className="text-[#7b8b7d]" />
            </div>
          ) : (
            <div className={clsx('w-2 h-2 rounded-full', priorityColor)} />
          )}
        </div>
      </button>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            {sortedChildren.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-[#9a8f86] mb-3">No subtasks yet</p>
                {onCreateChild && (
                  <button
                    onClick={() => onCreateChild(objective.id)}
                    className="text-sm text-[#8ea89e] hover:text-[#6fa5a2] transition-colors"
                  >
                    + Add subtask
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {sortedChildren.map(child => (
                  <ChildTaskRow
                    key={child.id}
                    task={child}
                    onTaskClick={onTaskClick}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Child Task Row Component
// ============================================================================

interface ChildTaskRowProps {
  task: Task;
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

function ChildTaskRow({ task, onTaskClick, onStatusChange }: ChildTaskRowProps) {
  const statusConfig = STATUS_COLORS[task.status];

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-[#25201d]/50 transition-colors">
      {/* Status Chip */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(task.id, task.status === 'done' ? 'open' : 'done');
        }}
        className={clsx('task-chip', `task-chip-status-${task.status}`, 'flex-shrink-0')}
      >
        {task.status === 'done' ? (
          <Check size={12} fill="currentColor" />
        ) : (
          <Circle size={8} />
        )}
        {STATUS_LABELS[task.status]}
      </button>

      {/* Content */}
      <button
        onClick={() => onTaskClick(task.id)}
        className="flex-1 text-left min-w-0"
      >
        <p className={clsx(
          'text-sm truncate',
          task.status === 'done' ? 'text-[#9a8f86] line-through' : 'text-[#f2efed]'
        )}>
          {task.title}
        </p>
      </button>

      {/* Priority Dot */}
      <div className={clsx('task-dot', `task-dot-${task.priority}`, 'flex-shrink-0')} />
    </div>
  );
}
