"use client";

import { useState, useEffect } from "react";
import { CheckSquare, FileText, BookOpen, Activity, Plus, Search, Filter } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/lib/types/tracker";

interface AgentSession {
  id: string;
  codeName: string;
  initials: string;
  currentTaskId?: string;
  status: string;
  currentAction?: string;
}

type TabType = "tasks" | "projects" | "notes" | "ledger";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<AgentSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tracker/tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/tracker/agents");
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch agents:", err);
      }
    };
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks by search query
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Priority order
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    return aPriority - bPriority;
  });

  // Task status update
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      // Refetch tasks
      const res = await fetch("/api/tracker/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-l-4 border-red-500";
      case "high": return "border-l-4 border-orange-500";
      case "medium": return "border-l-4 border-yellow-500";
      case "low": return "border-l-4 border-green-500";
      default: return "border-l-4 border-gray-500";
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "todo": return "bg-gray-500/20 text-gray-400";
      case "in-progress": return "bg-blue-500/20 text-blue-400";
      case "review": return "bg-yellow-500/20 text-yellow-400";
      case "done": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  // Tab content renderers
  const renderTasksTab = () => (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] w-4 h-4" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#18181B] border border-[#27272A] rounded-lg text-white text-sm placeholder-[#71717A] focus:outline-none focus:border-[#F97316]"
          />
        </div>
        <button className="p-2.5 bg-[#18181B] border border-[#27272A] rounded-lg text-[#A1A1AA] hover:text-white hover:border-[#3F3F46] transition-colors">
          <Filter className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="p-2.5 bg-[#F97316] border border-[#F97316] rounded-lg text-white hover:bg-[#EA580C] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[#71717A]">Loading tasks...</div>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckSquare className="w-12 h-12 text-[#52525B] mb-4" />
          <p className="text-[#A1A1AA] text-center mb-1">No tasks yet</p>
          <p className="text-[#71717A] text-sm text-center">Create your first task to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-[#18181B] border border-[#27272A] rounded-lg p-4 hover:border-[#3F3F46] transition-all ${getPriorityColor(task.priority)}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === "done"}
                  onChange={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")}
                  className="mt-1 w-5 h-5 rounded border-2 border-[#52525B] bg-transparent cursor-pointer checked:bg-[#F97316] checked:border-[#F97316]"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-medium ${task.status === "done" ? "text-[#71717A] line-through" : "text-white"}`}>
                      {task.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadgeColor(task.status)}`}>
                      {task.status.replace("-", " ")}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-[#A1A1AA] line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#71717A]">
                    {task.assignedTo && (
                      <span className="px-2 py-0.5 bg-[#27272A] rounded">{task.assignedTo}</span>
                    )}
                    {task.agentCodeName && (
                      <span className="px-2 py-0.5 bg-[#F97316]/20 text-[#F97316] rounded">{task.agentCodeName}</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${task.priority === "urgent" ? "bg-red-500/20 text-red-400" : task.priority === "high" ? "bg-orange-500/20 text-orange-400" : task.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Projects</h2>
        <button className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-medium hover:bg-[#EA580C] transition-colors">
          New Project
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Stacean (Atlas Cockpit)", "Asset Hatch", "Beads Tracker"].map((project, idx) => (
          <div key={idx} className="bg-[#18181B] border border-[#27272A] rounded-lg p-6 hover:border-[#3F3F46] transition-all cursor-pointer">
            <FileText className="w-8 h-8 text-[#F97316] mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">{project}</h3>
            <p className="text-sm text-[#71717A]">{tasks.filter(t => t.project?.toLowerCase().includes(project.toLowerCase().split(" ")[0].toLowerCase())).length} active tasks</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Field Notes</h2>
        <button className="px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-medium hover:bg-[#EA580C] transition-colors">
          New Note
        </button>
      </div>
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-12 h-12 text-[#52525B] mb-4" />
        <p className="text-[#A1A1AA] text-center mb-1">No notes yet</p>
        <p className="text-[#71717A] text-sm text-center">Create field notes to track observations and ideas</p>
      </div>
    </div>
  );

  const renderLedgerTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Activity Ledger</h2>
        <button className="px-4 py-2 bg-[#18181B] text-[#A1A1AA] rounded-lg text-sm font-medium hover:text-white hover:bg-[#27272A] transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {[
          { time: "10:23", action: "Completed task: Fix login bug", agent: "Atlas" },
          { time: "10:21", action: "Started research on 2D game tech", agent: "Atlas" },
          { time: "10:19", action: "Created task: Update dependencies", agent: "Jordan" },
          { time: "10:15", action: "Added field note: Review analytics", agent: "Jordan" },
        ].map((entry, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-[#18181B] border border-[#27272A] rounded-lg p-4">
            <Activity className="w-4 h-4 text-[#F97316] mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{entry.action}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#71717A]">
                <span>{entry.time}</span>
                <span>•</span>
                <span>{entry.agent}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090B] pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#18181B]/90 backdrop-blur-xl border-b border-white/5 flex items-center px-4 z-50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#F97316]" />
          <span className="font-semibold text-white text-sm">Tasks</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: "tasks" as TabType, icon: CheckSquare, label: "Tasks", count: tasks.length },
            { id: "projects" as TabType, icon: FileText, label: "Projects", count: 3 },
            { id: "notes" as TabType, icon: BookOpen, label: "Notes", count: 0 },
            { id: "ledger" as TabType, icon: Activity, label: "Ledger", count: 4 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#F97316] text-white"
                    : "bg-[#18181B] text-[#A1A1AA] hover:text-white hover:bg-[#27272A]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    activeTab === tab.id ? "bg-white/20" : "bg-[#3F3F46]"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "tasks" && renderTasksTab()}
        {activeTab === "projects" && renderProjectsTab()}
        {activeTab === "notes" && renderNotesTab()}
        {activeTab === "ledger" && renderLedgerTab()}
      </main>

      {/* Create Task Sheet */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-[#27272A]">
              <h3 className="text-lg font-semibold text-white">Create New Task</h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: Implement task creation
                setIsCreateOpen(false);
              }}
              className="p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Task title..."
                  className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-white text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Description</label>
                <textarea
                  placeholder="Task description..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-white text-sm focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Priority</label>
                <select className="w-full px-3 py-2 bg-[#09090B] border border-[#27272A] rounded-lg text-white text-sm focus:outline-none focus:border-[#F97316]">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 px-4 py-2 bg-[#18181B] border border-[#27272A] rounded-lg text-white text-sm font-medium hover:bg-[#27272A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm font-medium hover:bg-[#EA580C] transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
