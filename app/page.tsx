"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Menu,
  Target,
  X,
  Zap,
} from "lucide-react";

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

const PRIORITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  urgent: { bg: "rgba(220, 38, 38, 0.2)", border: "#DC2626", text: "#FCA5A5" },
  high: { bg: "rgba(249, 115, 22, 0.2)", border: "#F97316", text: "#FDBA74" },
  medium: { bg: "rgba(37, 99, 235, 0.2)", border: "#2563EB", text: "#93C5FD" },
  low: { bg: "rgba(113, 113, 122, 0.2)", border: "#71717A", text: "#A1A1AA" },
};

const STATUS_COLORS: Record<string, string> = {
  todo: "#F97316",
  "in-progress": "#3B82F6",
  review: "#8B5CF6",
  done: "#22C55E",
};

const formatTime = (timestamp: number | string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
  right,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="section">
      <button className="section-header" onClick={() => setOpen(!open)}>
        <div className="section-title">
          <span className="section-dot" />
          <span>{title}</span>
          {typeof count === "number" && (
            <span className="section-count">{count}</span>
          )}
        </div>
        <div className="section-right">
          {right}
          {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

function ObjectivesView({ tasks }: { tasks: Task[] }) {
  const columns = [
    { id: "todo", label: "To Do", color: "#F97316" },
    { id: "in-progress", label: "In Progress", color: "#3B82F6" },
    { id: "review", label: "Review", color: "#8B5CF6" },
    { id: "done", label: "Done", color: "#22C55E" },
  ];

  return (
    <div className="kanban">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <CollapsibleSection
            key={col.id}
            title={col.label}
            count={colTasks.length}
            right={<span className="pill" style={{ borderColor: col.color }} />}
          >
            <div className="task-col">
              {colTasks.length === 0 ? (
                <div className="empty">No tasks</div>
              ) : (
                colTasks.map((task) => {
                  const p = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.low;
                  return (
                    <div
                      key={task.id}
                      className="task-card"
                      style={{ borderLeft: `3px solid ${p.border}` }}
                    >
                      <div className="task-top">
                        <h4>{task.title}</h4>
                        <span className="badge" style={{ background: p.bg, color: p.text }}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && <p>{task.description}</p>}
                      <div className="task-meta">
                        {task.agentCodeName && (
                          <span className="agent-tag">🤖 {task.agentCodeName}</span>
                        )}
                        <span className="muted">{formatTime(task.updatedAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );
}

function AgentsView({ agents, derived }: { agents: Agent[]; derived: boolean }) {
  return (
    <CollapsibleSection
      title={derived ? "Assigned Agents (Derived)" : "Active Agents"}
      count={agents.length}
      right={
        derived ? <span className="badge-outline">Derived</span> : undefined
      }
    >
      <div className="agent-grid">
        {agents.length === 0 ? (
          <div className="empty">No agents active</div>
        ) : (
          agents.map((agent) => (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <div className="agent-icon">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="agent-name">{agent.name}</div>
                  <div className={`agent-status ${agent.status}`}>
                    <span className="dot" />
                    {agent.status}
                  </div>
                </div>
              </div>
              {agent.currentTask && (
                <div className="agent-task">
                  <Target size={14} />
                  <span>{agent.currentTask}</span>
                </div>
              )}
              <div className="agent-stats">
                <div>
                  <Clock size={12} />
                  {agent.lastActivity ? formatTime(agent.lastActivity) : "Unknown"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}

function EnergyView({ tasks }: { tasks: Task[] }) {
  const priorities = ["urgent", "high", "medium", "low"];
  return (
    <div className="energy">
      {priorities.map((p) => {
        const pTasks = tasks.filter((t) => t.priority === p);
        const colors = PRIORITY_COLORS[p] || PRIORITY_COLORS.low;
        return (
          <CollapsibleSection
            key={p}
            title={`${p.toUpperCase()} Energy`}
            count={pTasks.length}
            right={<Zap size={16} style={{ color: colors.border }} />}
          >
            <div className="energy-band" style={{ borderColor: colors.border }}>
              {pTasks.length === 0 ? (
                <div className="empty">No {p} tasks</div>
              ) : (
                <div className="energy-list">
                  {pTasks.map((task) => (
                    <div key={task.id} className="energy-chip">
                      <input type="checkbox" readOnly checked={task.status === "done"} />
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );
}

function LiveView({ agents, tasks, derived }: { agents: Agent[]; tasks: Task[]; derived: boolean }) {
  const feed = [
    ...agents
      .filter((a) => a.lastActivity)
      .map((a) => ({
        id: a.id,
        type: "agent" as const,
        title: `${a.name} ${a.status}`,
        description: a.currentTask || "No active task",
        timestamp: a.lastActivity!,
        color: a.status === "running" ? "#22C55E" : "#71717A",
      })),
    ...tasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      title: t.title,
      description: `Status: ${t.status}`,
      timestamp: t.updatedAt,
      color: STATUS_COLORS[t.status] || "#71717A",
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  return (
    <CollapsibleSection
      title={derived ? "Live Feed (Derived)" : "Live Feed"}
      count={feed.length}
      right={derived ? <span className="badge-outline">Derived</span> : undefined}
    >
      <div className="live-feed">
        {feed.map((item) => (
          <div key={`${item.type}-${item.id}`} className="live-item">
            <span className="live-dot" style={{ background: item.color }} />
            <div className="live-content">
              <div className="live-title">{item.title}</div>
              <div className="live-desc">{item.description}</div>
            </div>
            <span className="muted">{formatTime(item.timestamp)}</span>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export default function Home() {
  const [view, setView] = useState("stack");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tracker/tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      }
    };

    fetchAgents();
    fetchState();
    fetchTasks();
    const interval = setInterval(() => {
      fetchAgents();
      fetchState();
      fetchTasks();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const derivedAgents = useMemo(() => {
    const map = new Map<string, Agent>();
    tasks.forEach((t) => {
      if (!t.agentCodeName) return;
      if (!map.has(t.agentCodeName)) {
        map.set(t.agentCodeName, {
          id: t.agentCodeName,
          name: t.agentCodeName,
          status: "assigned",
          currentTask: t.title,
          lastActivity: String(t.updatedAt),
        });
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  const useDerivedAgents = agents.length === 0 && derivedAgents.length > 0;

  const navItems = [
    { id: "stack", icon: Layers, label: "Objectives", desc: "Tasks by status" },
    { id: "lens", icon: Bot, label: "Agents", desc: "Active or assigned" },
    { id: "energy", icon: Zap, label: "Energy", desc: "By priority" },
    { id: "live", icon: Activity, label: "Live", desc: "Activity feed" },
  ];

  const renderView = () => {
    switch (view) {
      case "stack":
        return <ObjectivesView tasks={tasks} />;
      case "lens":
        return (
          <AgentsView agents={useDerivedAgents ? derivedAgents : agents} derived={useDerivedAgents} />
        );
      case "energy":
        return <EnergyView tasks={tasks} />;
      case "live":
        return (
          <LiveView agents={useDerivedAgents ? derivedAgents : agents} tasks={tasks} derived={useDerivedAgents} />
        );
      default:
        return <ObjectivesView tasks={tasks} />;
    }
  };

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Activity size={20} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="title">Atlas</div>
              <div className="subtitle">Mission Control</div>
            </div>
          )}
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Collapse sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => setView(item.id)}
              >
                <Icon size={18} />
                {!sidebarCollapsed && (
                  <div>
                    <div className="nav-title">{item.label}</div>
                    <div className="nav-desc">{item.desc}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="status">
          <div className={`status-dot ${isOnline ? "online" : "offline"}`} />
          {!sidebarCollapsed && (
            <div>
              <div className="status-title">Atlas {isOnline ? "Online" : "Offline"}</div>
              <div className="status-desc">{currentTask || "Idle"}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="mobile-header">
        <button onClick={() => setSidebarOpen(true)} className="icon-btn">
          <Menu size={20} />
        </button>
        <span>Atlas</span>
        <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
      </header>

      {/* Mobile sidebar */}
      <aside className={`mobile-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="mobile-top">
          <span>Atlas</span>
          <button onClick={() => setSidebarOpen(false)} className="icon-btn">
            <X size={18} />
          </button>
        </div>
        <nav className="nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <div>
                  <div className="nav-title">{item.label}</div>
                  <div className="nav-desc">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      <main className={`main ${sidebarCollapsed ? "wide" : ""}`}>
        {currentTask && (
          <div className="banner">
            <div className="banner-dot" />
            <div>
              <div className="banner-label">Atlas Activity</div>
              <div className="banner-text">{currentTask}</div>
            </div>
          </div>
        )}
        <div className="view-header">
          <h2>{navItems.find((i) => i.id === view)?.label}</h2>
          <p>{navItems.find((i) => i.id === view)?.desc}</p>
        </div>
        {renderView()}
      </main>

      <nav className="mobile-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-item ${active ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <style>{`
        .app { min-height: 100vh; background: #09090B; }
        .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #18181B; border-right: 1px solid rgba(255,255,255,0.05); padding: 1.5rem; display: flex; flex-direction: column; z-index: 40; }
        .sidebar.collapsed { width: 72px; padding: 1rem 0.5rem; }
        .sidebar-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
        .logo { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg,#F97316,#EA580C); display: flex; align-items: center; justify-content: center; color: white; }
        .title { color: white; font-weight: 700; font-size: 0.9rem; }
        .subtitle { color: #71717A; font-size: 0.7rem; }
        .collapse-btn { margin-left: auto; background: rgba(255,255,255,0.08); border: 0; color: #A1A1AA; border-radius: 8px; padding: 0.25rem; cursor: pointer; }
        .nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.9rem; border-radius: 12px; border: 0; background: transparent; color: white; cursor: pointer; text-align: left; }
        .nav-item.active { background: rgba(249,115,22,0.15); color: #F97316; }
        .nav-title { font-weight: 600; font-size: 0.85rem; }
        .nav-desc { color: #71717A; font-size: 0.7rem; }
        .status { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status-dot.online { background: #22C55E; box-shadow: 0 0 10px #22C55E; }
        .status-dot.offline { background: #EF4444; }
        .status-title { color: white; font-weight: 600; font-size: 0.8rem; }
        .status-desc { color: #71717A; font-size: 0.7rem; }

        .main { margin-left: 260px; padding: 2rem; min-height: 100vh; }
        .main.wide { margin-left: 72px; }
        .banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-radius: 12px; background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.25); margin-bottom: 1.5rem; }
        .banner-dot { width: 8px; height: 8px; border-radius: 50%; background: #F97316; animation: pulse 2s infinite; }
        .banner-label { color: #F97316; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
        .banner-text { color: white; font-size: 0.9rem; }
        .view-header h2 { color: white; font-size: 1.5rem; margin-bottom: 0.25rem; }
        .view-header p { color: #71717A; font-size: 0.85rem; }

        .section { margin-bottom: 1rem; }
        .section-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; color: white; cursor: pointer; }
        .section-title { display: flex; align-items: center; gap: 0.5rem; }
        .section-dot { width: 6px; height: 6px; background: #F97316; border-radius: 50%; }
        .section-count { margin-left: 0.5rem; background: rgba(255,255,255,0.1); padding: 0.1rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; color: #A1A1AA; }
        .section-right { display: flex; align-items: center; gap: 0.5rem; color: #A1A1AA; }
        .section-body { padding: 0.75rem 0.25rem; }

        .kanban { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
        .task-col { display: flex; flex-direction: column; gap: 0.75rem; }
        .task-card { background: #18181B; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 0.9rem; }
        .task-card h4 { color: white; font-size: 0.85rem; font-weight: 600; }
        .task-card p { color: #71717A; font-size: 0.75rem; margin-top: 0.4rem; }
        .task-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .badge { font-size: 0.6rem; padding: 0.15rem 0.5rem; border-radius: 6px; text-transform: uppercase; font-weight: 700; }
        .task-meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        .agent-tag { font-size: 0.6rem; background: rgba(249,115,22,0.15); color: #F97316; padding: 0.1rem 0.4rem; border-radius: 4px; }
        .muted { color: #52525B; font-size: 0.7rem; }
        .empty { padding: 1rem; text-align: center; color: #52525B; font-size: 0.8rem; }

        .agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .agent-card { background: #18181B; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 1rem; }
        .agent-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .agent-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(59,130,246,0.2); display: flex; align-items: center; justify-content: center; color: #93C5FD; }
        .agent-name { color: white; font-weight: 600; }
        .agent-status { font-size: 0.7rem; color: #A1A1AA; display: flex; align-items: center; gap: 0.4rem; }
        .agent-status .dot { width: 6px; height: 6px; border-radius: 50%; background: #71717A; }
        .agent-status.running .dot { background: #22C55E; box-shadow: 0 0 8px #22C55E; }
        .agent-task { display: flex; align-items: center; gap: 0.4rem; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2); padding: 0.6rem; border-radius: 8px; color: white; font-size: 0.8rem; }
        .agent-stats { display: flex; gap: 0.5rem; margin-top: 0.6rem; color: #71717A; font-size: 0.7rem; }
        .agent-stats div { display: flex; align-items: center; gap: 0.3rem; }

        .energy { display: flex; flex-direction: column; gap: 0.75rem; }
        .energy-band { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; }
        .energy-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .energy-chip { display: flex; align-items: center; gap: 0.4rem; background: #18181B; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.4rem 0.6rem; color: white; font-size: 0.75rem; }

        .live-feed { display: flex; flex-direction: column; gap: 0.6rem; }
        .live-item { display: flex; align-items: flex-start; gap: 0.6rem; background: #18181B; border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 0.75rem; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 0.35rem; }
        .live-title { color: white; font-size: 0.85rem; font-weight: 600; }
        .live-desc { color: #71717A; font-size: 0.75rem; }

        .badge-outline { border: 1px solid rgba(255,255,255,0.2); color: #A1A1AA; padding: 0.1rem 0.4rem; border-radius: 6px; font-size: 0.65rem; }
        .pill { width: 8px; height: 8px; border-radius: 50%; border: 2px solid; }

        .mobile-header, .mobile-nav, .mobile-sidebar, .overlay { display: none; }
        .icon-btn { background: rgba(255,255,255,0.05); border: 0; border-radius: 8px; padding: 0.35rem; color: white; }

        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { margin-left: 0; padding: 1rem; padding-bottom: 6rem; }
          .mobile-header { display: flex; position: fixed; top: 0; left: 0; right: 0; height: 56px; align-items: center; justify-content: space-between; padding: 0 1rem; background: rgba(24,24,27,0.95); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 60; }
          .mobile-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(24,24,27,0.95); border-top: 1px solid rgba(255,255,255,0.05); padding: 0.6rem 0.8rem 1rem; justify-content: space-around; z-index: 60; }
          .mobile-item { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; color: #71717A; background: none; border: 0; }
          .mobile-item.active { color: #F97316; }
          .mobile-sidebar { display: block; position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #18181B; padding: 1rem; transform: translateX(-100%); transition: transform 0.2s ease; z-index: 70; }
          .mobile-sidebar.open { transform: translateX(0); }
          .mobile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; color: white; }
          .overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 65; }
          .view-header { margin-top: 3.5rem; }
        }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
