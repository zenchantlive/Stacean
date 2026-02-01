"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Bot, Clock, Activity } from "lucide-react";
import { AgentSession, Task, TaskStatus, STATUS_LABELS } from "@/lib/types/tracker-new";

// ============================================================================
// Styles
// ============================================================================

const STATUS_COLOR: Record<TaskStatus, string> = {
  open: "text-[#6fa5a2] bg-[#6fa5a2]/10 border-[#6fa5a2]/20",
  in_progress: "text-[#8ea89e] bg-[#8ea89e]/10 border-[#8ea89e]/20",
  review: "text-[#b7a98a] bg-[#b7a98a]/10 border-[#b7a98a]/20",
  done: "text-[#7b8b7d] bg-[#7b8b7d]/10 border-[#7b8b7d]/20",
  tombstone: "text-[#5b4b47] bg-[#5b4b47]/10 border-[#5b4b47]/20",
};

// ============================================================================
// Component Props
// ============================================================================

interface AgentLensViewProps {
  agents: AgentSession[];
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AgentLensView({ agents, tasks, onTaskClick }: AgentLensViewProps) {
  if (!agents.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-[#1d1917] border border-white/10 flex items-center justify-center mb-4">
          <Bot size={32} className="text-[#6b615a]" />
        </div>
        <h3 className="text-lg font-semibold text-[#f2efed] mb-2">No active agents</h3>
        <p className="text-sm text-[#9a8f86] max-w-xs">Agents will appear here when they start working.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const currentTask = tasks.find((t) => t.id === agent.currentTaskId);
          const status = (currentTask?.status || "open") as TaskStatus;
          const statusLabel = STATUS_LABELS[status];

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="task-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1d1917] border border-white/10 flex items-center justify-center text-[#8ea89e]">
                      <Bot size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#f2efed]">{agent.codeName}</p>
                      <p className="text-[11px] text-[#9a8f86]">{agent.status}</p>
                    </div>
                  </div>
                </div>
                {currentTask && (
                  <span className={clsx("task-chip", STATUS_COLOR[status])}>
                    {statusLabel}
                  </span>
                )}
              </div>

              <div className="flex-1">
                {currentTask ? (
                  <button
                    onClick={() => onTaskClick(currentTask.id)}
                    className="w-full text-left"
                  >
                    <p className="text-xs uppercase tracking-wide text-[#9a8f86] mb-1">Current Task</p>
                    <p className="text-sm text-[#f2efed] leading-snug">
                      {currentTask.title}
                    </p>
                  </button>
                ) : (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#9a8f86] mb-1">Current Task</p>
                    <p className="text-sm text-[#6b615a]">Awaiting assignment</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#9a8f86]">
                <div className="flex items-center gap-1">
                  <Activity size={12} />
                  <span>{agent.currentAction || "No recent action"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{new Date(agent.heartbeat).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
