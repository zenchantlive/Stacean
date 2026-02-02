"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Bot, Zap, Activity, CheckSquare, Grid, Plus, ChevronRight, MoreHorizontal } from "lucide-react";

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

// Task Display Component (from /focused)
function TaskDisplay({ view, onClose }: { view: string; onClose?: () => void }) {
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

  const viewTitles: Record<string, string> = {
    stack: "Objectives",
    lens: "Agent Lens",
    energy: "Energy Map",
  };

  return (
    <div className="task-display" style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white' }}>
          {viewTitles[view] || "Tasks"}
        </h2>
        <span style={{ background: '#27272A', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', color: '#A1A1AA' }}>
          {sortedTasks.length} tasks
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#A1A1AA' }}>
          Loading...
        </div>
      ) : sortedTasks.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckSquare size={48} style={{ color: '#52525B', margin: '0 auto 1rem' }} />
          <p style={{ color: '#A1A1AA' }}>No tasks yet</p>
          <p style={{ color: '#71717A', fontSize: '0.875rem' }}>Create your first objective to get started</p>
          <p style={{ color: '#71717A', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Run: <code style={{ background: '#27272A', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>npm run bdx create "Task name" -p 1</code>
          </p>
        </div>
      ) : (
        <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedTasks.map(task => (
            <div 
              key={task.id} 
              className={`task-card priority-${task.priority}`}
              style={{ 
                background: 'linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}
            >
              <input
                type="checkbox"
                checked={task.status === "done"}
                onChange={() => {}}
                style={{ marginTop: '0.25rem', accentColor: '#F97316' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', fontWeight: 500, marginBottom: '0.25rem' }}>{task.title}</h3>
                {task.description && (
                  <p style={{ color: '#A1A1AA', fontSize: '0.875rem' }}>{task.description}</p>
                )}
              </div>
              <span 
                className={`task-badge priority-${task.priority}`}
                style={{ 
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  background: task.priority === 'urgent' ? '#DC2626' : 
                             task.priority === 'high' ? '#F97316' : 
                             task.priority === 'medium' ? '#2563EB' : '#71717A',
                  color: 'white'
                }}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<"focused" | "dashboard">("focused");
  const [activeFocusedView, setActiveFocusedView] = useState<string>("stack");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [isOnline, setIsOnline] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

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

  // Fetch Atlas state
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

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tracker/tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const focusedNavItems = [
    { id: "stack", icon: Layers, label: "Objectives" },
    { id: "lens", icon: Bot, label: "Agents" },
    { id: "energy", icon: Zap, label: "Energy" },
    { id: "agents", icon: Activity, label: "Live" },
  ];

  const dashboardCards = [
    { id: "tasks", title: "Tasks", icon: CheckSquare, summary: `${tasks.length} active` },
    { id: "agents", title: "Agents", icon: Bot, summary: `${agents.length} active` },
  ];

  // Focused Layout
  if (viewMode === "focused") {
    return (
      <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex' }}>
        {/* Desktop Sidebar */}
        <aside style={{ 
          width: '240px', 
          background: '#18181B', 
          borderRight: '1px solid rgba(255,255,255,0.05)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '12px', 
              background: 'linear-gradient(to bottom right, #F97316, #EA580C)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Activity size={24} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontWeight: 600, color: 'white', fontSize: '1rem' }}>Atlas Focus</h1>
              <p style={{ fontSize: '0.75rem', color: '#71717A' }}>Mission Control</p>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            {focusedNavItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveFocusedView(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: activeFocusedView === item.id ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    color: activeFocusedView === item.id ? '#F97316' : '#A1A1AA',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={20} />
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ 
                width: '8px', height: '8px', borderRadius: '50%',
                background: isOnline ? '#22C55E' : '#EF4444',
                boxShadow: isOnline ? '0 0 8px #22C55E' : 'none'
              }} />
              <span style={{ color: isOnline ? '#22C55E' : '#EF4444', fontSize: '0.875rem', fontWeight: 500 }}>
                Atlas {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {currentTask && (
              <p style={{ color: '#A1A1AA', fontSize: '0.75rem', lineHeight: 1.4 }}>
                {currentTask}
              </p>
            )}
          </div>

          {/* View Toggle */}
          <button
            onClick={() => setViewMode("dashboard")}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#A1A1AA',
              fontSize: '0.75rem',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Switch to Dashboard View
          </button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: '240px', padding: '2rem' }}>
          {/* Activity Banner */}
          {currentTask && (
            <div style={{ 
              background: 'linear-gradient(to right, rgba(249, 115, 22, 0.1), rgba(234, 88, 12, 0.05))',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '12px',
              padding: '1rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{ color: '#F97316', fontWeight: 500 }}>Atlas:</span>
              <span style={{ color: 'white' }}>{currentTask}</span>
            </div>
          )}

          {/* View Content */}
          {activeFocusedView === "agents" ? (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'white', marginBottom: '1.5rem' }}>
                Active Agents
              </h2>
              {agents.length === 0 ? (
                <p style={{ color: '#71717A' }}>No other agents active</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {agents.map(agent => (
                    <div 
                      key={agent.id}
                      style={{ 
                        background: '#18181B', 
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          width: '8px', height: '8px', borderRadius: '50%',
                          background: agent.status === 'running' ? '#22C55E' : '#71717A'
                        }} />
                        <span style={{ color: 'white', fontWeight: 500 }}>{agent.name}</span>
                      </div>
                      {agent.currentTask && (
                        <p style={{ color: '#A1A1AA', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          {agent.currentTask}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <TaskDisplay view={activeFocusedView} />
          )}
        </main>

        {/* Mobile Header */}
        <header style={{ 
          display: 'none',
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '1rem',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 600 }}>Atlas Focus</span>
            <span style={{ 
              width: '8px', height: '8px', borderRadius: '50%',
              background: isOnline ? '#22C55E' : '#EF4444'
            }} />
          </div>
        </header>

        {/* Mobile Bottom Nav */}
        <nav style={{ 
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(24, 24, 27, 0.95)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '0.75rem',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {focusedNavItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveFocusedView(item.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.25rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: activeFocusedView === item.id ? '#F97316' : '#71717A'
                  }}
                >
                  <Icon size={22} />
                  <span style={{ fontSize: '0.625rem' }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Dashboard Layout (original card grid)
  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Persistent Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#18181B]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white text-base">Atlas Cockpit</h1>
            <p className="text-xs text-[#71717A]">Mission Control</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {currentTask && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#27272A] rounded-lg">
              <span className="text-xs text-[#71717A]">Atlas:</span>
              <span className="text-sm text-white truncate max-w-[200px]">{currentTask}</span>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${isOnline ? "text-green-500" : "text-red-500"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <button
            onClick={() => setViewMode("focused")}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              borderRadius: '8px',
              color: '#F97316',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Switch to Focus Mode
          </button>
        </div>
      </header>

      <main className="pt-20 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="mb-8 p-6 bg-gradient-to-r from-[#F97316]/10 to-[#EA580C]/5 border border-[#F97316]/20 rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isOnline ? "Atlas is Online" : "Atlas is Offline"}
                </h2>
                <p className="text-[#A1A1AA] text-sm">
                  {currentTask ? `Currently working on: ${currentTask}` : "Ready for your next command"}
                </p>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Tasks Card */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#18181B] flex items-center justify-center border border-white/5">
                  <CheckSquare className="w-5 h-5 text-[#F97316]" />
                </div>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">Tasks</h3>
              <p className="text-sm text-[#A1A1AA] mb-4">{tasks.length} active tasks</p>
              <button 
                onClick={() => setActiveFocusedView("stack")}
                className="flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
              >
                <Layers className="w-4 h-4" />
                <span>View All Tasks</span>
              </button>
            </div>

            {/* Agents Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#18181B] flex items-center justify-center border border-white/5">
                  <Bot className="w-5 h-5 text-[#3B82F6]" />
                </div>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">Agents</h3>
              <p className="text-sm text-[#A1A1AA] mb-4">{agents.length} active agents</p>
              <button 
                onClick={() => setActiveFocusedView("agents")}
                className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
              >
                <Activity className="w-4 h-4" />
                <span>View Agents</span>
              </button>
            </div>

            {/* Quick Create Card */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#18181B] flex items-center justify-center border border-white/5">
                  <Plus className="w-5 h-5 text-[#22C55E]" />
                </div>
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">Quick Create</h3>
              <p className="text-sm text-[#A1A1AA] mb-4">Create a new task</p>
              <div style={{ background: '#27272A', padding: '0.75rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#A1A1AA' }}>
                npm run bdx create "Task" -p 1
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
