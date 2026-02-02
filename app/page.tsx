"use client";

import { useState, useEffect, useRef } from "react";
import { Layers, Bot, Zap, Activity, CheckSquare, Plus, Menu, X, ChevronRight, Clock, Target, Zap as ZapIcon } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
  lastActivity?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  agentCodeName?: string;
  project?: string;
  createdAt: number | string;
  updatedAt: number | string;
}

// Utility functions
const formatTime = (timestamp: number | string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const PRIORITY_COLORS = {
  urgent: { bg: 'rgba(220, 38, 38, 0.2)', border: '#DC2626', text: '#FCA5A5' },
  high: { bg: 'rgba(249, 115, 22, 0.2)', border: '#F97316', text: '#FDBA74' },
  medium: { bg: 'rgba(37, 99, 235, 0.2)', border: '#2563EB', text: '#93C5FD' },
  low: { bg: 'rgba(113, 113, 122, 0.2)', border: '#71717A', text: '#A1A1AA' },
};

const STATUS_COLORS = {
  todo: '#F97316',
  'in-progress': '#3B82F6',
  review: '#8B5CF6',
  done: '#22C55E',
};

// ============================================================================
// View: Objectives (Tasks organized by status)
// ============================================================================
function ObjectivesView({ tasks }: { tasks: Task[] }) {
  const columns = [
    { id: 'todo', label: 'To Do', color: '#F97316' },
    { id: 'in-progress', label: 'In Progress', color: '#3B82F6' },
    { id: 'review', label: 'Review', color: '#8B5CF6' },
    { id: 'done', label: 'Done', color: '#22C55E' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
      {columns.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              marginBottom: '1rem', padding: '0.75rem',
              background: `${col.color}15`, borderRadius: '10px',
              borderLeft: `3px solid ${col.color}`
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>{col.label}</span>
              <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.1)', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', color: '#A1A1AA' }}>
                {colTasks.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {colTasks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#52525B', fontSize: '0.875rem' }}>
                  No tasks
                </div>
              ) : (
                colTasks.map(task => (
                  <div 
                    key={task.id}
                    style={{ 
                      background: '#18181B', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px', padding: '1rem',
                      borderLeft: `3px solid ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]?.border || '#71717A'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: 'white', fontWeight: 500, fontSize: '0.875rem', flex: 1 }}>{task.title}</h4>
                      <span style={{ 
                        padding: '0.125rem 0.5rem', borderRadius: '4px', 
                        fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase',
                        background: PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]?.bg,
                        color: PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]?.text,
                        marginLeft: '0.5rem'
                      }}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p style={{ color: '#71717A', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{task.description}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {task.agentCodeName && (
                        <span style={{ fontSize: '0.625rem', color: '#F97316', background: 'rgba(249,115,22,0.15)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                          🤖 {task.agentCodeName}
                        </span>
                      )}
                      <span style={{ fontSize: '0.625rem', color: '#52525B', marginLeft: 'auto' }}>
                        {formatTime(task.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// View: Agents (Rich agent cards)
// ============================================================================
function AgentsView({ agents }: { agents: Agent[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
      {agents.length === 0 ? (
        <div style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: '#52525B' }}>
          <Bot size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p>No agents active</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Agents will appear here when spawned</p>
        </div>
      ) : (
        agents.map(agent => (
          <div 
            key={agent.id}
            style={{ 
              background: 'linear-gradient(135deg, #18181B 0%, #1a1a1f 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '16px', padding: '1.5rem',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Status glow */}
            <div style={{ 
              position: 'absolute', top: 0, right: 0, width: '100px', height: '100px',
              background: agent.status === 'running' ? 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)' : 'transparent',
              pointerEvents: 'none'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>{agent.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: agent.status === 'running' ? '#22C55E' : '#71717A',
                    boxShadow: agent.status === 'running' ? '0 0 8px #22C55E' : 'none'
                  }} />
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: agent.status === 'running' ? '#22C55E' : '#71717A',
                    textTransform: 'capitalize'
                  }}>
                    {agent.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Task */}
            {agent.currentTask && (
              <div style={{ 
                background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '10px', padding: '1rem', marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Target size={14} style={{ color: '#F97316' }} />
                  <span style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 500 }}>CURRENT TASK</span>
                </div>
                <p style={{ color: 'white', fontSize: '0.875rem' }}>{agent.currentTask}</p>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.625rem', marginBottom: '0.25rem' }}>
                  <Clock size={12} />
                  <span>LAST ACT</span>
                </div>
                <span style={{ color: '#A1A1AA', fontSize: '0.875rem' }}>
                  {agent.lastActivity ? formatTime(agent.lastActivity) : 'Unknown'}
                </span>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.625rem', marginBottom: '0.25rem' }}>
                  <CheckSquare size={12} />
                  <span>TASKS</span>
                </div>
                <span style={{ color: '#A1A1AA', fontSize: '0.875rem' }}>--</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================================
// View: Energy (Tasks by priority with visual intensity)
// ============================================================================
function EnergyView({ tasks }: { tasks: Task[] }) {
  const priorityOrder = ['urgent', 'high', 'medium', 'low'];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {priorityOrder.map(priority => {
        const pTasks = tasks.filter(t => t.priority === priority);
        const colors = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS];
        
        return (
          <div key={priority}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
              padding: `0 0.5rem`
            }}>
              <ZapIcon 
                size={20} 
                style={{ 
                  color: colors.border,
                  filter: priority === 'urgent' ? 'drop-shadow(0 0 8px rgba(220,38,38,0.8))' : 
                          priority === 'high' ? 'drop-shadow(0 0 6px rgba(249,115,22,0.6))' : 'none'
                }} 
              />
              <span style={{ 
                color: 'white', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.875rem',
                flex: 1
              }}>
                {priority} Energy
              </span>
              <span style={{ 
                background: colors.bg, color: colors.text,
                padding: '0.25rem 0.75rem', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 600
              }}>
                {pTasks.length} tasks
              </span>
            </div>
            
            <div style={{ 
              background: `${colors.border}10`, 
              border: `1px solid ${colors.border}30`,
              borderRadius: '16px', padding: '1rem',
              minHeight: '80px'
            }}>
              {pTasks.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#52525B', fontSize: '0.875rem' }}>
                  No {priority} priority tasks
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {pTasks.map(task => (
                    <div 
                      key={task.id}
                      style={{ 
                        background: '#18181B', border: `1px solid ${colors.border}40`,
                        borderRadius: '8px', padding: '0.5rem 0.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        maxWidth: '300px'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={task.status === "done"}
                        onChange={() => {}}
                        style={{ accentColor: colors.border, width: '14px', height: '14px' }}
                      />
                      <span style={{ color: 'white', fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// View: Live (Activity Feed)
// ============================================================================
function LiveView({ agents, tasks }: { agents: Agent[]; tasks: Task[] }) {
  // Combine agent activities and task updates into a feed
  const feed = [
    ...agents.filter(a => a.lastActivity).map(a => ({
      type: 'agent' as const,
      id: a.id,
      title: `${a.name} ${a.status === 'running' ? 'is working' : a.status}`,
      description: a.currentTask || 'No active task',
      timestamp: a.lastActivity!,
      color: a.status === 'running' ? '#22C55E' : '#71717A'
    })),
    ...tasks.map(t => ({
      type: 'task' as const,
      id: t.id,
      title: t.title,
      description: `Status: ${t.status}`,
      timestamp: t.updatedAt,
      color: STATUS_COLORS[t.status as keyof typeof STATUS_COLORS] || '#71717A'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {feed.map((item, idx) => (
        <div 
          key={`${item.type}-${item.id}`}
          style={{ 
            display: 'flex', alignItems: 'flex-start', gap: '1rem',
            padding: '1rem', background: '#18181B', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.03)',
            animation: idx === 0 ? 'pulse 2s infinite' : 'none'
          }}
        >
          <div style={{ 
            width: '10px', height: '10px', borderRadius: '50%',
            background: item.color,
            marginTop: '6px',
            boxShadow: idx === 0 ? `0 0 8px ${item.color}` : 'none'
          }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'white', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              {item.title}
            </h4>
            <p style={{ color: '#71717A', fontSize: '0.75rem' }}>{item.description}</p>
          </div>
          <span style={{ color: '#52525B', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            {formatTime(item.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================
export default function Home() {
  const [view, setView] = useState<string>("stack");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [isOnline, setIsOnline] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"focused" | "dashboard">("focused");

  // Fetch data
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/tracker/agents");
        const data = await res.json();
        setAgents(Array.isArray(data) ? data : []);
      } catch (err) { console.error("Failed to fetch agents:", err); }
    };
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        setCurrentTask(data.currentActivity || data.currentTask || "");
        setIsOnline(data.atlasOnline || data._connected || false);
      } catch (err) { console.error("Failed to fetch state:", err); }
    };
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tracker/tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) { console.error("Failed to fetch tasks:", err); }
    };

    fetchAgents(); fetchState(); fetchTasks();
    const interval = setInterval(() => { fetchAgents(); fetchState(); fetchTasks(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "stack", icon: Layers, label: "Objectives", desc: "Tasks by status" },
    { id: "lens", icon: Bot, label: "Agents", desc: "Active agents" },
    { id: "energy", icon: Zap, label: "Energy", desc: "By priority" },
    { id: "live", icon: Activity, label: "Live", desc: "Activity feed" },
  ];

  const renderView = () => {
    switch (view) {
      case "stack": return <ObjectivesView tasks={tasks} />;
      case "lens": return <AgentsView agents={agents} />;
      case "energy": return <EnergyView tasks={tasks} />;
      case "live": return <LiveView agents={agents} tasks={tasks} />;
      default: return <ObjectivesView tasks={tasks} />;
    }
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside style={{ 
      position: mobile ? 'fixed' : 'fixed',
      top: 0, left: 0, bottom: 0,
      width: mobile ? '280px' : '260px',
      background: '#18181B',
      borderRight: '1px solid rgba(255,255,255,0.05)',
      padding: '1.5rem',
      display: 'flex', flexDirection: 'column',
      zIndex: mobile ? 100 : 50,
      transform: mobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ 
          width: '44px', height: '44px', borderRadius: '12px', 
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(249,115,22,0.3)'
        }}>
          <Activity size={24} style={{ color: 'white' }} />
        </div>
        <div>
          <h1 style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>Atlas Focus</h1>
          <p style={{ fontSize: '0.7rem', color: '#71717A' }}>Mission Control</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setView(item.id); if (mobile) setSidebarOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.875rem 1rem', borderRadius: '12px',
                background: isActive ? 'rgba(249,115,22,0.15)' : 'transparent',
                border: 'none', cursor: 'pointer', marginBottom: '0.5rem',
                textAlign: 'left' as const, transition: 'all 0.2s'
              }}
            >
              <Icon 
                size={20} 
                style={{ 
                  color: isActive ? '#F97316' : '#71717A',
                }} 
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: isActive ? '#F97316' : 'white', 
                  fontWeight: isActive ? 600 : 500, 
                  fontSize: '0.875rem' 
                }}>
                  {item.label}
                </div>
                <div style={{ color: '#52525B', fontSize: '0.7rem' }}>{item.desc}</div>
              </div>
              {isActive && <ChevronRight size={16} style={{ color: '#F97316', transform: 'rotate(-90deg)' }} />}
            </button>
          );
        })}
      </nav>

      {/* Atlas Status */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', borderRadius: '14px', 
        padding: '1rem', marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ 
            width: '10px', height: '10px', borderRadius: '50%',
            background: isOnline ? '#22C55E' : '#EF4444',
            boxShadow: isOnline ? '0 0 12px #22C55E' : 'none',
            animation: isOnline ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ 
            color: isOnline ? '#22C55E' : '#EF4444', 
            fontWeight: 600, fontSize: '0.8rem' 
          }}>
            Atlas {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {currentTask && (
          <p style={{ color: '#A1A1AA', fontSize: '0.75rem', lineHeight: 1.5 }}>
            {currentTask}
          </p>
        )}
      </div>

      {/* View Toggle */}
      <button
        onClick={() => setViewMode(viewMode === "focused" ? "dashboard" : "focused")}
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', color: '#A1A1AA', fontSize: '0.75rem',
          cursor: 'pointer', width: '100%', transition: 'all 0.2s'
        }}
      >
        Switch to {viewMode === "focused" ? "Dashboard" : "Focus"} Mode
      </button>
    </aside>
  );

  // Dashboard mode (simplified)
  if (viewMode === "dashboard") {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#18181B]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white text-base">Atlas Cockpit</h1>
            </div>
          </div>
          <button
            onClick={() => setViewMode("focused")}
            style={{ padding: '0.5rem 1rem', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', color: '#F97316', cursor: 'pointer' }}
          >
            ← Focus Mode
          </button>
        </header>
        <main className="pt-20 pb-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 p-6 bg-gradient-to-r from-[#F97316]/10 to-[#EA580C]/5 border border-[#F97316]/20 rounded-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">{isOnline ? "Atlas is Online" : "Atlas is Offline"}</h2>
              <p className="text-[#A1A1AA]">{currentTask || "Ready"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-white/5 rounded-2xl p-6">
                <h3 className="font-semibold text-white text-lg mb-2">Tasks</h3>
                <p className="text-sm text-[#A1A1AA]">{tasks.length} active</p>
                <button onClick={() => setView("stack")} className="mt-4 px-4 py-2 bg-[#F97316] text-white rounded-lg text-sm">View</button>
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-white/5 rounded-2xl p-6">
                <h3 className="font-semibold text-white text-lg mb-2">Agents</h3>
                <p className="text-sm text-[#A1A1AA]">{agents.length} active</p>
                <button onClick={() => setView("lens")} className="mt-4 px-4 py-2 bg-[#3B82F6] text-white rounded-lg text-sm">View</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090B' }}>
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
            zIndex: 90, display: 'none'
          }} 
        />
      )}
      <Sidebar mobile />

      {/* Mobile Header */}
      <header style={{ 
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '60px', background: 'rgba(24,24,27,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 1rem', zIndex: 80, alignItems: 'center', justifyContent: 'space-between'
      }}>
        <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Menu size={24} style={{ color: 'white' }} />
        </button>
        <span style={{ color: 'white', fontWeight: 600 }}>Atlas Focus</span>
        <span style={{ 
          width: '10px', height: '10px', borderRadius: '50%',
          background: isOnline ? '#22C55E' : '#EF4444',
          boxShadow: isOnline ? '0 0 8px #22C55E' : 'none'
        }} />
      </header>

      {/* Main Content */}
      <main style={{ 
        marginLeft: '260px', 
        minHeight: '100vh',
        padding: '2rem',
        paddingBottom: '100px' // Space for mobile nav
      }}>
        {/* Activity Banner */}
        {currentTask && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.05) 100%)',
            border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: '14px', padding: '1rem 1.5rem',
            marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <div style={{ 
              width: '8px', height: '8px', borderRadius: '50%', 
              background: '#F97316', animation: 'pulse 2s infinite'
            }} />
            <div>
              <span style={{ color: '#F97316', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Atlas Activity</span>
              <p style={{ color: 'white', fontSize: '0.9rem', marginTop: '0.25rem' }}>{currentTask}</p>
            </div>
          </div>
        )}

        {/* View Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
            {navItems.find(i => i.id === view)?.label}
          </h2>
          <p style={{ color: '#71717A', fontSize: '0.875rem' }}>
            {navItems.find(i => i.id === view)?.desc}
          </p>
        </div>

        {/* View Content */}
        {renderView()}
      </main>

      {/* Mobile Bottom Nav */}
      <nav style={{ 
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(24,24,27,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '0.75rem 1rem 1.5rem', zIndex: 80
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: isActive ? '#F97316' : '#71717A'
                }}
              >
                <Icon size={22} />
                <span style={{ fontSize: '0.6rem' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; padding: 1rem !important; padding-bottom: 120px !important; }
          aside.desktop { display: none !important; }
          header.mobile { display: flex !important; }
          nav.mobile { display: block !important; }
          .mobile-overlay { display: block !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
