"use client";

import { motion } from "framer-motion";
import { Task, TaskStatus } from "@/lib/integrations/kv/tracker";
import { useMemo } from "react";

// ============================================================================
// Styles
// ============================================================================

const STATUS_CONFIG: Record<TaskStatus, { title: string; color: string; border: string }> = {
  todo: { title: "To Do", color: "text-zinc-400", border: "border-zinc-700" },
  "in-progress": { title: "In Progress", color: "text-blue-400", border: "border-blue-500/50" },
  review: { title: "Review", color: "text-purple-400", border: "border-purple-500/50" },
  done: { title: "Done", color: "text-green-400", border: "border-green-500/50" },
};

const COLUMNS: TaskStatus[] = ["todo", "in-progress", "review", "done"];

// ============================================================================
// Component
// ============================================================================

interface TaskGridProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskGrid({ tasks, onTaskClick }: TaskGridProps) {
  // Group tasks by status
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      review: [],
      done: [],
    };
    
    tasks.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });
    
    return groups;
  }, [tasks]);

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0 overflow-x-auto">
        {COLUMNS.map(status => {
          const config = STATUS_CONFIG[status];
          const columnTasks = groupedTasks[status];

          return (
            <div key={status} className="flex flex-col min-h-0">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`text-[10px] font-mono uppercase tracking-wider ${config.color}`}>
                  {config.title}
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {columnTasks.length}
                </span>
              </div>

              {/* Task List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {columnTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layoutId={`task-${task.id}`}
                    onClick={() => onTaskClick(task)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      p-3 rounded-lg bg-[#18181B] border-l-2 cursor-pointer
                      hover:bg-[#27272A] transition-colors group relative
                      ${config.border} border-y border-r border-white/5
                    `}
                  >
                    {/* Title */}
                    <p className="text-xs text-zinc-300 font-medium leading-snug line-clamp-2">
                      {task.title}
                    </p>

                    {/* Footer: Priority & Agent */}
                    <div className="flex items-center justify-between mt-2">
                      {/* Priority Dot */}
                      <div className={`
                        w-1.5 h-1.5 rounded-full
                        ${task.priority === 'urgent' ? 'bg-red-500' : 
                          task.priority === 'high' ? 'bg-orange-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}
                      `} />

                      {/* Agent Badge (if assigned) */}
                      {task.agentCodeName && (
                        <div className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-mono text-zinc-400">
                          {extractInitials(task.agentCodeName)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to extract initials (duplicated from utils to keep component self-contained for now)
// In real app, import from utils
function extractInitials(name: string): string {
  const parts = name.split('-');
  if (parts.length < 2) return name.substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
