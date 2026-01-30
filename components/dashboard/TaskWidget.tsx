"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { FleetBar } from "./FleetBar";
import { TaskGrid } from "./TaskGrid";
import { TaskDeck } from "./TaskDeck";
import { TaskEditModal } from "./TaskEditModal";
import { AgentSession, Task, TaskPriority, TaskStatus } from "@/lib/types/tracker";
import { LayoutGrid, Layers, Plus, Terminal, GripVertical, Edit3, X, ChevronDown, Terminal as TerminalIcon } from "lucide-react";
import clsx from "clsx";

// Status ring colors for agents
const STATUS_RINGS: Record<string, string> = {
  idle: "border-zinc-700",
  working: "border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
  done: "border-green-500",
  error: "border-red-500",
};

export function TaskWidget() {
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'deck'>('grid');
  const [loading, setLoading] = useState(true);
  
  // Quick Add State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("medium");
  
  // Edit Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState<'view' | 'edit'>('view');

  // Fetch data
  const fetchData = async () => {
    try {
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/tracker/agents'),
        fetch('/api/tracker/tasks')
      ]);
      
      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();
      
      setAgents(Array.isArray(agentsData) ? agentsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error("Failed to fetch tracker data:", err);
    } finally {
      setLoading(false);
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

  // Reorder Tasks
  const reorderTasks = useCallback((newOrder: Task[]) => {
    setTasks(newOrder);
    // Persist order changes
    newOrder.forEach((task, index) => {
      if (task.status === 'todo') {
        updateTask(task.id, { priority: index === 0 ? 'urgent' : index < 3 ? 'high' : task.priority });
      }
    });
  }, []);

  // Handle Deck Action (Pause/Resume/Stop Agent)
  const handleDeckAction = async (action: 'pause' | 'stop' | 'resume') => {
    if (!selectedAgentId) return;

    try {
      let updates = {};
      if (action === 'pause') {
        updates = { status: 'idle', currentAction: 'Paused by user' };
      } else if (action === 'resume') {
        updates = { status: 'working', currentAction: 'Resuming task...' };
      } else if (action === 'stop') {
        updates = { status: 'idle', currentAction: 'Stopped by user', currentTaskId: null };
      }

      await fetch(`/api/tracker/agents/${selectedAgentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update agent:", err);
    }
  };

  // Handle agent selection
  const handleAgentSelect = (id: string) => {
    if (selectedAgentId === id) {
      setViewMode(prev => prev === 'deck' ? 'grid' : 'deck');
    } else {
      setSelectedAgentId(id);
      setViewMode('deck');
    }
  };

  // Handle task click - OPEN FOR EDIT (not toggle!)
  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setEditMode('view');
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingTask(null);
  };

  // Get selected agent data
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const selectedTask = selectedAgent?.currentTaskId 
    ? tasks.find(t => t.id === selectedAgent.currentTaskId) 
    : undefined;

  // Get queued tasks (unassigned or assigned to JORDAN)
  const queuedTasks = tasks.filter(t => 
    t.status === 'todo' && (!t.assignedTo || t.assignedTo === 'JORDAN')
  ).sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#09090B] relative overflow-hidden">
      
      {/* Top Bar: Fleet & Controls */}
      <div className="flex-none z-10 bg-[#09090B]/80 backdrop-blur-md border-b border-white/5 pb-2">
        <FleetBar 
          agents={agents} 
          selectedId={selectedAgentId} 
          onSelect={handleAgentSelect} 
        />
        
        {/* View Toggle */}
        <div className="absolute top-4 right-4 flex gap-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <LayoutGrid size={16} />
          </button>
          <button 
            onClick={() => setViewMode('deck')}
            disabled={!selectedAgentId}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              viewMode === 'deck' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-30'
            )}
          >
            <Layers size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
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
          ) : (
            <motion.div
              key="deck"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 flex flex-col"
            >
              {selectedAgent ? (
                <div className="flex-1 flex flex-col">
                  {/* Current Task - Large Display */}
                  {selectedTask && (
                    <div className="p-6 border-b border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
                          Active Task
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {selectedAgent.codeName}
                        </span>
                      </div>
                      <TaskDeck 
                        agent={selectedAgent} 
                        task={selectedTask}
                        onAction={handleDeckAction}
                        onTaskUpdate={updateTask}
                      />
                    </div>
                  )}
                  
                  {/* Queued Tasks - Drag & Drop List */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        Queued Tasks
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {queuedTasks.length} pending
                      </span>
                    </div>
                    
                    {queuedTasks.length > 0 ? (
                      <Reorder.Group 
                        axis="y" 
                        values={queuedTasks} 
                        onReorder={reorderTasks}
                        className="space-y-2"
                      >
                        {queuedTasks.map(task => (
                          <Reorder.Item
                            key={task.id}
                            value={task}
                            whileDrag={{ scale: 1.02 }}
                            className="bg-[#18181B] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical size={14} className="text-zinc-600 group-hover:text-zinc-400 cursor-grab" />
                              <div className="flex-1">
                                <p className="text-sm text-white font-medium">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={clsx(
                                    "text-[10px] px-1.5 py-0.5 rounded",
                                    task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                                    task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-blue-500/10 text-blue-400'
                                  )}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleTaskClick(task)}
                                className="text-zinc-500 hover:text-white transition-colors"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    ) : (
                      <div className="text-center py-8 text-zinc-600 font-mono text-xs">
                        No queued tasks
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col p-6">
                  {/* Agent Info Card - When no active task */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-md text-center">
                      {/* Large Agent Avatar */}
                      <div className={`
                        w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center
                        bg-[#18181B] border-2
                        ${STATUS_RINGS[selectedAgent!.status] || STATUS_RINGS.idle}
                      `}>
                        <span className="text-3xl font-bold font-mono text-zinc-400">
                          {selectedAgent!.initials}
                        </span>
                      </div>

                      <h2 className="text-2xl font-medium text-white mb-2">
                        {selectedAgent!.codeName}
                      </h2>

                      <p className="text-zinc-500 text-sm mb-8">
                        {selectedAgent!.status === 'idle' 
                          ? "Ready for new task assignment"
                          : selectedAgent!.status === 'working'
                          ? "Currently processing..."
                          : "Task completed"}
                      </p>

                      {/* Current Action */}
                      {selectedAgent!.currentAction && (
                        <div className="bg-[#18181B] border border-white/10 rounded-xl p-4 mb-6">
                          <div className="flex items-center gap-2 mb-2 text-zinc-500">
                            <TerminalIcon size={14} />
                            <span className="text-[10px] font-mono uppercase">Current Action</span>
                          </div>
                          <p className="text-cyan-200 text-sm">{selectedAgent!.currentAction}</p>
                        </div>
                      )}

                      {/* Assign Task Button */}
                      <button 
                        onClick={() => {
                          // Focus on first todo task
                          const firstTodo = queuedTasks[0];
                          if (firstTodo) handleTaskClick(firstTodo);
                        }}
                        disabled={queuedTasks.length === 0}
                        className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mx-auto"
                      >
                        <Plus size={16} />
                        Assign Task from Queue
                      </button>
                    </div>
                  </div>

                  {/* Queued Tasks - Still show below */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                        Queued Tasks
                      </span>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {queuedTasks.length} pending
                      </span>
                    </div>
                    
                    {queuedTasks.length > 0 ? (
                      <Reorder.Group 
                        axis="y" 
                        values={queuedTasks} 
                        onReorder={reorderTasks}
                        className="space-y-2"
                      >
                        {queuedTasks.map(task => (
                          <Reorder.Item
                            key={task.id}
                            value={task}
                            whileDrag={{ scale: 1.02 }}
                            className="bg-[#18181B] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <GripVertical size={14} className="text-zinc-600 group-hover:text-zinc-400 cursor-grab" />
                              <div className="flex-1">
                                <p className="text-sm text-white font-medium">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={clsx(
                                    "text-[10px] px-1.5 py-0.5 rounded",
                                    task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' :
                                    task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-blue-500/10 text-blue-400'
                                  )}>
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleTaskClick(task)}
                                className="text-zinc-500 hover:text-white transition-colors"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    ) : (
                      <div className="text-center py-8 text-zinc-600 font-mono text-xs">
                        No queued tasks
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
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
