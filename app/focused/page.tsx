"use client";

import "../focused.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Bot, Zap, Activity, ArrowLeft, CheckSquare } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt: number | string;
  updatedAt: number | string;
}

// Simple inline Task Display (since TaskWidget has broken internal nav)
function TaskDisplay({ view }: { view: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...tasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3;
    return aPriority - bPriority;
  });

  return (
    <div className="task-display">
      <div className="task-header">
        <h2 className="text-xl font-semibold text-white">
          {view === "stack" && "Objectives"}
          {view === "lens" && "Agent Lens"}
          {view === "energy" && "Energy Map"}
        </h2>
        <span className="task-count">{sortedTasks.length}</span>
      </div>
      {loading ? (
        <div className="task-loading">
          <p className="text-[#A1A1AA]">Loading...</p>
        </div>
      ) : sortedTasks.length === 0 ? (
        <div className="task-empty">
          <CheckSquare size={48} className="text-[#52525B] mb-4" />
          <p className="text-[#A1A1AA]">No tasks yet</p>
          <p className="text-[#71717A] text-sm">Create your first objective to get started</p>
        </div>
      ) : (
        <div className="task-list">
          {sortedTasks.map(task => (
            <div key={task.id} className={`task-card priority-${task.priority}`}>
              <div className="task-main">
                <input
                  type="checkbox"
                  checked={task.status === "shipped"}
                  onChange={() => {/* TODO: Toggle task status */}}
                  className="task-checkbox"
                />
                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                </div>
                <span className={`task-badge priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FocusedPage() {
  const [activeView, setActiveView] = useState<string>("stack");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [isOnline, setIsOnline] = useState(false);

  // Fetch agent data
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

  // Fetch current task from Atlas state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        setCurrentTask(data.currentActivity || data.currentTask || "");
        setIsOnline(data.atlasOnline || data._connected || false);
      } catch (err) {
        console.error("Failed to fetch state:", err);
      }
    };
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "stack", icon: Layers, label: "Objectives" },
    { id: "lens", icon: Bot, label: "Agents" },
    { id: "energy", icon: Zap, label: "Energy" },
    { id: "agents", icon: Activity, label: "Live" },
  ];

  return (
    <div className="focused-layout">
      {/* Mobile Header - Fixed Top */}
      <header className="mobile-header">
        <div className="header-left">
          <Link href="/" className="back-link">
            <ArrowLeft size={18} />
            <span className="back-text">Back</span>
          </Link>
        </div>
        <div className="header-center">
          <span className="header-title">Atlas Focus</span>
        </div>
        <div className="header-right">
          <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
        </div>
      </header>

      {/* Desktop Sidebar - Fixed Left */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <Activity size={24} />
            <span>Atlas Focus</span>
          </Link>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`sidebar-btn ${activeView === item.id ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="atlas-status">
            <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
            <span>Atlas {isOnline ? "Online" : "Offline"}</span>
          </div>
          {currentTask && (
            <p className="current-task">{currentTask}</p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="focused-content">
        {/* Current Activity Banner */}
        {currentTask && (
          <div className="activity-banner">
            <span className="activity-label">Atlas:</span>
            <span className="activity-value">{currentTask}</span>
          </div>
        )}

        {/* View Content */}
        <div className="view-container">
          {activeView === "agents" ? (
            <div className="agents-view">
              <h2 className="view-title">Active Agents</h2>
              {agents.length === 0 ? (
                <p className="empty-state">No other agents active</p>
              ) : (
                <div className="agents-grid">
                  {agents.map(agent => (
                    <div key={agent.id} className="agent-card">
                      <div className="agent-header">
                        <span className={`status-dot ${agent.status}`} />
                        <span className="agent-name">{agent.name}</span>
                      </div>
                      {agent.currentTask && (
                        <p className="agent-task">{agent.currentTask}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <TaskDisplay view={activeView} />
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav - Fixed Bottom */}
      <nav className="mobile-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`nav-btn ${activeView === item.id ? "active" : ""}`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
