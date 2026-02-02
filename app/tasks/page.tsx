"use client";

import { useState, useEffect, useMemo } from "react";
import { Layers, Bot, Zap, Search, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Tasks Page - Full task management
 * 
 * Views (tabs):
 * - Objective Stack: Hierarchical task view
 * - Agent Lens: Agent-centric view
 * - Energy Map: Priority/effort matrix
 * - Search: Search all tasks
 */

type ViewType = "stack" | "lens" | "energy" | "search";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  parentId?: string;
  assignedTo?: string;
}

const VIEWS = [
  { id: "stack" as ViewType, label: "Objective Stack", icon: Layers, description: "Hierarchical view" },
  { id: "lens" as ViewType, label: "Agent Lens", icon: Bot, description: "By assignee" },
  { id: "energy" as ViewType, label: "Energy Map", icon: Zap, description: "Priority matrix" },
  { id: "search" as ViewType, label: "Search", icon: Search, description: "Find tasks" },
];

export default function TasksPage() {
  const [activeView, setActiveView] = useState<ViewType>("stack");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tracker/tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const activeTasks = filteredTasks.filter(t => 
    t.status !== "done" && t.status !== "closed"
  );

  return (
    <div className="tasks-page">
      {/* Header */}
      <header className="tasks-header">
        <div className="tasks-header-left">
          <Link href="/" className="tasks-back-btn tap-target">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="tasks-title">Tasks</h1>
          <span className="tasks-count">{activeTasks.length} active</span>
        </div>
        
        <button className="tasks-create-btn tap-target">
          <Plus size={18} />
          <span>Create Task</span>
        </button>
      </header>

      {/* View Tabs */}
      <nav className="tasks-tabs">
        {VIEWS.map(view => {
          const Icon = view.icon;
          const isActive = activeView === view.id;
          
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`tasks-tab tap-target ${isActive ? "active" : ""}`}
            >
              <Icon size={18} />
              <span className="tab-label">{view.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Search (shown when search tab is active) */}
      {activeView === "search" && (
        <div className="tasks-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Content */}
      <main className="tasks-content">
        {isLoading ? (
          <div className="tasks-loading">Loading tasks...</div>
        ) : activeTasks.length === 0 ? (
          <div className="tasks-empty">
            <p>No tasks found</p>
            <button className="tasks-create-btn-secondary tap-target">
              <Plus size={16} />
              <span>Create your first task</span>
            </button>
          </div>
        ) : (
          <div className="tasks-list">
            {activeTasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-checkbox">
                  <input type="checkbox" id={task.id} />
                </div>
                <div className="task-info">
                  <label htmlFor={task.id} className="task-title-label">
                    {task.title}
                  </label>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    <span className={`task-status status-${task.status}`}>
                      {task.status}
                    </span>
                    {task.priority && (
                      <span className="task-priority">{task.priority}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
