"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TaskTrackerNav, TaskTrackerHeader } from "./tracker-nav/TaskTrackerNav";
import { ObjectiveStackView } from "./views/ObjectiveStackView";
import { AgentLensView } from "./views/AgentLensView";
import { EnergyMapView } from "./views/EnergyMapView";
import { Task, TaskStatus, ViewType, AgentSession } from "@/lib/types/tracker-new";
import "@/lib/styles/task-tracker-theme.css";

// ============================================================================
// Helpers
// ============================================================================

type LegacyStatus = "todo" | "in-progress" | "review" | "done" | "tombstone";

const LEGACY_TO_NEW_STATUS: Record<string, TaskStatus> = {
  todo: "open",
  "in-progress": "in_progress",
  review: "review",
  done: "done",
  tombstone: "tombstone",
  open: "open",
  in_progress: "in_progress",
};

const NEW_TO_LEGACY_STATUS: Record<TaskStatus, LegacyStatus> = {
  open: "todo",
  in_progress: "in-progress",
  review: "review",
  done: "done",
  tombstone: "tombstone",
};

function normalizeStatus(status: string): TaskStatus {
  return LEGACY_TO_NEW_STATUS[status] || "open";
}

function normalizeTask(raw: any): Task {
  return {
    ...raw,
    status: normalizeStatus(raw.status),
  } as Task;
}

// ============================================================================
// Component
// ============================================================================

export function TaskWidget() {
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("objective-stack");

  const tasks = useMemo(() => rawTasks.map(normalizeTask), [rawTasks]);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const tasksRes = await fetch("/api/tracker/tasks");
      const tasksData = await tasksRes.json();
      setRawTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Failed to fetch tracker tasks:", err);
    }
  };

  // Fetch agents
  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/tracker/agents");
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tracker agents:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAgents();
    const interval = setInterval(() => {
      fetchTasks();
      fetchAgents();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update Task (status only for now)
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: NEW_TO_LEGACY_STATUS[status] }),
      });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCreateTask = () => {
    // TODO: wire Task Creation Flow (clawd-e1f)
    console.info("Create Task flow pending");
  };

  return (
    <div className="task-tracker relative w-full h-full min-h-screen bg-[#0f0d0c] text-[#f2efed]">
      <TaskTrackerNav
        currentView={currentView}
        onViewChange={setCurrentView}
        onCreateTask={handleCreateTask}
      />

      <div className="flex flex-col min-h-screen md:pl-16">
        <TaskTrackerHeader
          currentView={currentView}
          onCreateTask={handleCreateTask}
        />

        <main className="flex-1 pb-24 md:pb-6">
          <AnimatePresence mode="wait">
            {currentView === "objective-stack" && (
              <motion.div
                key="objective-stack"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <ObjectiveStackView
                  tasks={tasks}
                  onTaskClick={handleTaskSelect}
                  onStatusChange={updateTaskStatus}
                />
              </motion.div>
            )}

            {currentView === "agent-lens" && (
              <motion.div
                key="agent-lens"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <AgentLensView
                  agents={agents}
                  tasks={tasks}
                  onTaskClick={handleTaskSelect}
                />
              </motion.div>
            )}

            {currentView === "energy-map" && (
              <motion.div
                key="energy-map"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <EnergyMapView tasks={tasks} onTaskClick={handleTaskSelect} />
              </motion.div>
            )}

            {currentView === "search" && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex items-center justify-center text-center p-8"
              >
                <div className="max-w-sm">
                  <h3 className="text-lg font-semibold text-[#f2efed] mb-2">Search</h3>
                  <p className="text-sm text-[#9a8f86]">Search + filters will live here.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
