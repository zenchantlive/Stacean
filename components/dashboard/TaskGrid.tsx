"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Task, TaskPriority, TaskStatus } from "@/lib/types/tracker";
import { ChevronDown, Check, Pencil, Tag, AlignLeft, Flag } from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Styles
// ============================================================================

const STATUS_CONFIG: Record<TaskStatus, { title: string; color: string; border: string }> = {
  todo: { title: "To Do", color: "text-zinc-400", border: "border-zinc-700" },
  "in-progress": { title: "In Progress", color: "text-blue-400", border: "border-blue-500/50" },
  review: { title: "Review", color: "text-purple-400", border: "border-purple-500/50" },
  done: { title: "Done", color: "text-green-400", border: "border-green-500/50" },
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const COLUMNS: TaskStatus[] = ["todo", "in-progress", "review", "done"];

// ============================================================================
// Component
// ============================================================================

interface TaskGridProps {
  tasks: Task[];
  selectedTaskId: string | null;
  selectedProject: string | null;
  onSelect: (taskId: string | null) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskGrid({ tasks, selectedTaskId, selectedProject, onSelect, onUpdateTask }: TaskGridProps) {
  const filteredTasks = selectedProject 
    ? tasks.filter(t => t.project === selectedProject)
    : tasks;
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      "in-progress": [],
      review: [],
      done: [],
    };

    filteredTasks.forEach(task => {
      if (groups[task.status]) groups[task.status].push(task);
    });

    // Sort within each group by priority
    const priorityOrder: Record<TaskPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    for (const status of COLUMNS) {
      groups[status].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return groups;
  }, [tasks, selectedProject]);

  const expandedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : undefined;
  const [editData, setEditData] = useState<Partial<Task>>({});

  useEffect(() => {
    if (expandedTask) {
      setEditData({
        title: expandedTask.title,
        description: expandedTask.description || "",
        status: expandedTask.status,
        priority: expandedTask.priority,
      });
    } else {
      setEditData({});
    }
  }, [expandedTask]);

  const handleSave = () => {
    if (!expandedTask) return;
    onUpdateTask(expandedTask.id, editData);
  };

  const handleComplete = () => {
    if (!expandedTask) return;
    onUpdateTask(expandedTask.id, { status: "done" });
  };

  return (
    <div className="flex-1 w-full h-full overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar">
        {COLUMNS.map(status => {
          const config = STATUS_CONFIG[status];
          const columnTasks = groupedTasks[status];

          return (
            <div key={status} className="flex flex-col gap-3">
              {/* Section Header */}
              <div className="flex items-center justify-between px-1">
                <span className={`text-[10px] font-mono uppercase tracking-wider ${config.color}`}>
                  {config.title}
                </span>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {columnTasks.length}
                </span>
              </div>

              {/* Playlist List */}
              <div className="space-y-3">
                {columnTasks.map(task => {
                  const isExpanded = selectedTaskId === task.id;

                  return (
                    <motion.div
                      key={task.id}
                      layout
                      className={clsx(
                        "rounded-xl border border-white/10 bg-[#18181B] overflow-hidden",
                        isExpanded ? "border-white/20" : "hover:border-white/20"
                      )}
                    >
                      <button
                        onClick={() => onSelect(isExpanded ? null : task.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        <div className={clsx(
                          "w-2 h-2 rounded-full",
                          task.priority === "urgent" ? "bg-red-500" :
                          task.priority === "high" ? "bg-orange-500" :
                          task.priority === "medium" ? "bg-yellow-500" : "bg-blue-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{task.title}</p>
                          {task.currentAction && (
                            <p className="text-[11px] text-zinc-500 truncate">{task.currentAction}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "text-[10px] px-2 py-1 rounded-full border border-white/10",
                            config.color
                          )}>
                            {config.title}
                          </span>
                          <ChevronDown className={clsx(
                            "text-zinc-500 transition-transform",
                            isExpanded && "rotate-180"
                          )} size={16} />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && expandedTask && (
                          <motion.div
                            key={`expanded-${task.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10 px-4 py-4 space-y-4"
                          >
                            <div className="grid grid-cols-1 gap-3">
                              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2">
                                <Tag size={12} /> Title
                              </label>
                              <input
                                type="text"
                                value={editData.title || ""}
                                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full bg-[#0F0F10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2">
                                <AlignLeft size={12} /> Description
                              </label>
                              <textarea
                                value={editData.description || ""}
                                onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                className="w-full bg-[#0F0F10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2 mb-2">
                                  <Pencil size={12} /> Status
                                </label>
                                <select
                                  value={(editData.status as TaskStatus) || task.status}
                                  onChange={e => setEditData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                                  className="w-full bg-[#0F0F10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                                >
                                  {STATUS_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest flex items-center gap-2 mb-2">
                                  <Flag size={12} /> Priority
                                </label>
                                <select
                                  value={(editData.priority as TaskPriority) || task.priority}
                                  onChange={e => setEditData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                                  className="w-full bg-[#0F0F10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                                >
                                  {PRIORITY_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                onClick={() => onSelect(null)}
                                className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleComplete}
                                className="px-3 py-2 rounded-lg text-xs text-white bg-white/10 hover:bg-white/20 flex items-center gap-1"
                              >
                                <Check size={12} /> Complete
                              </button>
                              <button
                                onClick={handleSave}
                                className="px-3 py-2 rounded-lg text-xs text-white bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center gap-1"
                              >
                                <Check size={12} /> Save
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
