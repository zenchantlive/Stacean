"use client";

import { motion } from "framer-motion";
import { Task } from "@/lib/types/tracker";
import { Clock, ChevronDown, Play, MoreHorizontal } from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Component
// ============================================================================

interface ActiveTaskBarProps {
  activeTasks: Task[];
  selectedTaskId: string | null;
  onSelect: (taskId: string) => void;
  onCreateTask: () => void;
}

export function ActiveTaskBar({ 
  activeTasks, 
  selectedTaskId, 
  onSelect,
  onCreateTask 
}: ActiveTaskBarProps) {
  return (
    <div className="w-full flex items-center gap-3 px-2 py-2 overflow-x-auto no-scrollbar">
      {/* Create Task Button */}
      <button
        onClick={onCreateTask}
        className="flex-shrink-0 flex items-center gap-2 bg-[#18181B] border border-white/10 hover:border-white/20 rounded-xl px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition-colors"
      >
        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
          <Play size={12} className="ml-0.5" />
        </span>
        <span>New Task</span>
      </button>

      {/* Active Tasks List */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {activeTasks.length === 0 ? (
          <div className="flex-shrink-0 text-[10px] text-zinc-600 font-mono">
            No active tasks
          </div>
        ) : (
          activeTasks.map(task => (
            <ActiveTaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              onClick={() => onSelect(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Active Task Card
// ============================================================================

interface ActiveTaskCardProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
}

function ActiveTaskCard({ task, isSelected, onClick }: ActiveTaskCardProps) {
  const priorityColors = {
    urgent: 'border-red-500 bg-red-500/5',
    high: 'border-orange-500 bg-orange-500/5',
    medium: 'border-yellow-500 bg-yellow-500/5',
    low: 'border-blue-500 bg-blue-500/5',
  };

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "flex-shrink-0 flex items-center gap-3 rounded-xl border-l-2 px-4 py-2.5 transition-colors text-left",
        priorityColors[task.priority],
        isSelected 
          ? "bg-white/10 border-white/20" 
          : "hover:bg-white/5 border-transparent"
      )}
    >
      {/* Status Indicator */}
      <div className={clsx(
        "w-2 h-2 rounded-full animate-pulse",
        task.priority === 'urgent' ? 'bg-red-500' :
        task.priority === 'high' ? 'bg-orange-500' :
        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
      )} />

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white font-medium truncate max-w-[200px]">
          {task.title}
        </p>
        {task.currentAction && (
          <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
            {task.currentAction}
          </p>
        )}
      </div>

      {/* Expand Icon */}
      <ChevronDown 
        size={14} 
        className={clsx(
          "text-zinc-500 transition-transform",
          isSelected && "rotate-180"
        )}
      />
    </motion.button>
  );
}