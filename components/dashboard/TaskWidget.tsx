"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TaskTrackerNav, TaskTrackerHeader } from "./tracker-nav/TaskTrackerNav";
import { ObjectiveStackView } from "./views/ObjectiveStackView";
import { AgentLensView } from "./views/AgentLensView";
import { EnergyMapView } from "./views/EnergyMapView";
import { CreateTaskSheet } from "./CreateTaskSheet";
import { Task, TaskStatus, ViewType, AgentSession, TaskPriority } from "@/lib/types/tracker-new";
import { normalizeStatus, NEW_TO_LEGACY_STATUS } from "@/lib/utils/tracker-mapping";
import "@/lib/styles/task-tracker-theme.css";

// ============================================================================
// Helpers
// ============================================================================

function normalizeTask(raw: any): Task {
  return {
    ...raw,
    status: normalizeStatus(raw.status),
  } as Task;
}

// ============================================================================
// Component
// ============================================================================

interface TaskWidgetProps {
  isActive?: boolean;
}

export function TaskWidget({ isActive = false }: TaskWidgetProps) {
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("objective-stack");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      fetchTasks();
      fetchAgents();
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
    setIsCreateOpen(true);
  };

  const handleSubmitTask = async (payload: {
    title: string;
    description: string;
    priority: TaskPriority;
    project: string;
    parentId?: string;
  }) => {
    try {
      const res = await fetch("/api/tracker/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          project: payload.project,
          parentId: payload.parentId,
          assignedTo: "JORDAN",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to create task:", err);
      throw err; // Re-throw so CreateTaskSheet can handle the error
    }
    fetchTasks();
  };

  return (
    <div className="task-tracker relative w-full h-full min-h-screen bg-[#0f0d0c] text-[#f2efed] overflow-hidden">
      {/* Aurora backdrop */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#6fa5a2]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#b46b4f]/10 blur-[120px]" />

      {isActive && (
        <TaskTrackerNav
          currentView={currentView}
          onViewChange={setCurrentView}
          onCreateTask={handleCreateTask}
        />
      )}

      <CreateTaskSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleSubmitTask}
      />

      <div className="relative flex flex-col min-h-screen md:pl-16">
        <TaskTrackerHeader
          currentView={currentView}
          onCreateTask={handleCreateTask}
        />

        <main className="flex-1 pb-6 md:pb-6 pt-20 md:pt-0">
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
