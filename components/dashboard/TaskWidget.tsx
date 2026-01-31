"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActiveTaskBar } from "./ActiveTaskBar";
import { TaskGrid } from "./TaskGrid";
import { TaskEditModal } from "./TaskEditModal";
import { Task, TaskPriority } from "@/lib/types/tracker";
import { Plus, Terminal } from "lucide-react";

export function TaskWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Quick Add State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  
  // Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState<'view' | 'edit'>('view');

  // Fetch data
  const fetchData = async () => {
    try {
      const tasksRes = await fetch('/api/tracker/tasks');
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Failed to fetch tracker data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Create Task
  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/tracker/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          assignedTo: "JORDAN",
        }),
      });

      if (res.ok) {
        setNewTaskTitle("");
        setNewTaskPriority("medium");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  // Update Task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Focus quick add input
  const focusQuickAdd = () => {
    inputRef.current?.focus();
  };

  // Handle task click - OPEN FOR EDIT (not toggle!)
  const handleTaskClick = (task: Task) => {
    setSelectedTaskId(task.id);
    setEditingTask(task);
    setEditMode('view');
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingTask(null);
  };

  const activeTasks = tasks.filter(t => t.status === 'in-progress');

  return (
    <div className="w-full h-full flex flex-col bg-[#09090B] relative overflow-hidden">
      
      {/* Top Bar: Active Tasks */}
      <div className="flex-none z-10 bg-[#09090B]/80 backdrop-blur-md border-b border-white/5 pb-2">
        <ActiveTaskBar
          activeTasks={activeTasks}
          selectedTaskId={selectedTaskId}
          onSelect={(taskId) => {
            setSelectedTaskId(taskId);
            const task = tasks.find(t => t.id === taskId);
            if (task) handleTaskClick(task);
          }}
          onCreateTask={focusQuickAdd}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 p-4 flex flex-col"
          >
            {/* Quick Add Input */}
            <form onSubmit={createTask} className="flex gap-2 mb-4 flex-none">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="New objective..."
                  className="w-full bg-[#18181B] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                />
                <Terminal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              </div>
              
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                className="bg-[#18181B] border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:border-white/20 cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
              >
                <Plus size={16} />
              </button>
            </form>

            <TaskGrid tasks={tasks} onTaskClick={handleTaskClick} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Task Edit Modal */}
      <AnimatePresence>
        {editingTask && (
          <TaskEditModal
            task={editingTask}
            mode={editMode}
            onModeChange={setEditMode}
            onClose={closeEditModal}
            onUpdate={updateTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
