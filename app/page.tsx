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
  active: "#3B82F6",
  "needs-you": "#8B5CF6",
  ready: "#F59E0B",
  shipped: "#22C55E",
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
    { id: "todo", label: "📝 Todo", color: "#F97316" },
    { id: "active", label: "🔨 Active", color: "#3B82F6" },
    { id: "needs-you", label: "👤 Needs You", color: "#8B5CF6" },
    { id: "ready", label: "📦 Ready", color: "#F59E0B" },
    { id: "shipped", label: "✅ Shipped", color: "#22C55E" },
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

function AgentsView({ agents, derived, tasks }: { agents: Agent[]; derived: boolean; tasks: Task[] }) {
  const getAgentData = (agentName: string) => {
    const agentTasks = tasks.filter((t) => t.agentCodeName === agentName);
    const counts = agentTasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    
    // Find current active task
    const activeTask = agentTasks.find(t => t.status === 'active');
    // Find tasks needing review
    const needsReview = agentTasks.filter(t => t.status === 'needs-you');
    // Find recently shipped (last 3)
    const shipped = agentTasks
      .filter(t => t.status === 'shipped')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
    
    return {
      counts: {
        todo: counts["todo"] || 0,
        active: counts["active"] || 0,
        needs: counts["needs-you"] || 0,
        ready: counts["ready"] || 0,
        shipped: counts["shipped"] || 0,
      },
      activeTask,
      needsReview,
      shipped,
    };
  };

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
          agents.map((agent) => {
            const data = getAgentData(agent.name);
            return (
              <div key={agent.id} className="agent-card">
                <div className="agent-header">
                  <div className="agent-icon">
                    <Bot size={18} />
                  </div>
                  <div className="agent-header-text">
                    <div className="agent-name">{agent.name}</div>
                    <div className={`agent-status ${agent.status}`}>
                      <span className="dot" />
                      {agent.status}
                    </div>
                  </div>
                </div>
                
                {/* Currently Doing */}
                {data.activeTask && (
                  <div className="agent-section">
                    <div className="agent-section-title">
                      <Target size={12} />
                      Currently Doing
                    </div>
                    <div className="agent-task-highlight">
                      {data.activeTask.title}
                    </div>
                  </div>
                )}
                
                {/* Needs Your Review */}
                {data.needsReview.length > 0 && (
                  <div className="agent-section">
                    <div className="agent-section-title urgent">
                      <span className="urgent-dot" />
                      Needs Your Review ({data.needsReview.length})
                    </div>
                    <div className="agent-task-list">
                      {data.needsReview.slice(0, 2).map(t => (
                        <div key={t.id} className="agent-task-item">{t.title}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recently Shipped */}
                {data.shipped.length > 0 && (
                  <div className="agent-section">
                    <div className="agent-section-title shipped">
                      <CheckSquare size={12} />
                      Recently Shipped ({data.counts.shipped})
                    </div>
                    <div className="agent-task-list">
                      {data.shipped.map(t => (
                        <div key={t.id} className="agent-task-item shipped">{t.title}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Status Breakdown */}
                <div className="agent-metadata">
                  <span className="meta-pill todo">Todo: {data.counts.todo}</span>
                  <span className="meta-pill active">Active: {data.counts.active}</span>
                  <span className="meta-pill needs">Needs You: {data.counts.needs}</span>
                  <span className="meta-pill ready">Ready: {data.counts.ready}</span>
                  <span className="meta-pill shipped">Shipped: {data.counts.shipped}</span>
                </div>
                
                <div className="agent-stats">
                  <div>
                    <Clock size={12} />
                    {agent.lastActivity ? formatTime(agent.lastActivity) : "Unknown"}
                  </div>
                </div>
              </div>
            );
          })
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
                      <input type="checkbox" readOnly checked={task.status === "shipped"} />
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
  // Group items by time period
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());

  const getTimeGroup = (timestamp: string) => {
    const date = new Date(timestamp);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateOnly.getTime() === today.getTime()) return "today";
    if (dateOnly.getTime() === yesterday.getTime()) return "yesterday";
    if (dateOnly >= thisWeekStart) return "thisWeek";
    return "older";
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Build feed items
  const allItems = [
    ...agents
      .filter((a) => a.lastActivity)
      .map((a) => ({
        id: `agent-${a.id}`,
        type: "agent" as const,
        title: a.name,
        subtitle: a.status === "running" ? "Currently active" : "Idle",
        description: a.currentTask,
        timestamp: a.lastActivity!,
        color: a.status === "running" ? "#22C55E" : "#71717A",
        icon: Bot,
      })),
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      type: "task" as const,
      title: t.title,
      subtitle: `Moved to ${t.status}`,
      description: t.agentCodeName ? `via ${t.agentCodeName}` : undefined,
      timestamp: t.updatedAt,
      color: STATUS_COLORS[t.status] || "#71717A",
      icon: CheckSquare,
    })),
  ].sort((a, b) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime());

  const groups = {
    today: allItems.filter(i => getTimeGroup(String(i.timestamp)) === "today"),
    yesterday: allItems.filter(i => getTimeGroup(String(i.timestamp)) === "yesterday"),
    thisWeek: allItems.filter(i => getTimeGroup(String(i.timestamp)) === "thisWeek"),
    older: allItems.filter(i => getTimeGroup(String(i.timestamp)) === "older"),
  };

  const renderGroup = (title: string, items: typeof allItems, emptyMessage?: string) => {
    if (items.length === 0 && !emptyMessage) return null;
    return (
      <div className="feed-group">
        <div className="feed-group-header">{title}</div>
        {items.length === 0 ? (
          <div className="feed-empty">{emptyMessage}</div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="feed-item">
                <div className="feed-item-dot" style={{ background: item.color }} />
                <div className="feed-item-icon">
                  <Icon size={14} style={{ color: item.color }} />
                </div>
                <div className="feed-item-content">
                  <div className="feed-item-title">
                    {item.title}
                    <span className="feed-item-subtitle">{item.subtitle}</span>
                  </div>
                  {item.description && (
                    <div className="feed-item-desc">{item.description}</div>
                  )}
                </div>
                <div className="feed-item-time">{formatRelativeTime(String(item.timestamp))}</div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <CollapsibleSection
      title="Activity Feed"
      count={allItems.length}
      right={derived ? <span className="badge-outline">Derived</span> : undefined}
    >
      <div className="live-feed">
        {renderGroup("Today", groups.today, "No activity today")}
        {renderGroup("Yesterday", groups.yesterday)}
        {renderGroup("Earlier This Week", groups.thisWeek)}
        {renderGroup("Older", groups.older)}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

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
          <AgentsView agents={useDerivedAgents ? derivedAgents : agents} derived={useDerivedAgents} tasks={tasks} />
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
                onClick={() => {
                  if (item.href) {
                    window.location.href = item.href;
                  } else {
                    setView(item.id);
                  }
                }}
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
                  if (item.href) {
                    window.location.href = item.href;
                    setSidebarOpen(false);
                  } else {
                    setView(item.id);
                    setSidebarOpen(false);
                  }
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
        <div className="content-wrapper">
          <div className="content-inner">
            {currentTask && (
              <div className="banner">
                <div className="banner-dot" />
                <div>
                  <div className="banner-label">Atlas Activity</div>
                  <div className="banner-text">{currentTask}</div>
                </div>
              </div>
            )}
            
            {/* Pipeline Stats Header */}
            <div className="pipeline-stats">
              <button className="stat-box" onClick={() => setView("stack")}>
                <span className="stat-count" style={{ color: "#F97316" }}>{tasks.filter(t => t.status === 'todo').length}</span>
                <span className="stat-label">Todo</span>
              </button>
              <button className="stat-box" onClick={() => setView("stack")}>
                <span className="stat-count" style={{ color: "#3B82F6" }}>{tasks.filter(t => t.status === 'active').length}</span>
                <span className="stat-label">Active</span>
              </button>
              <button className="stat-box urgent" onClick={() => setView("stack")}>
                <span className="stat-count" style={{ color: "#8B5CF6" }}>{tasks.filter(t => t.status === 'needs-you').length}</span>
                <span className="stat-label">Needs You</span>
              </button>
              <button className="stat-box" onClick={() => setView("stack")}>
                <span className="stat-count" style={{ color: "#F59E0B" }}>{tasks.filter(t => t.status === 'ready').length}</span>
                <span className="stat-label">Ready</span>
              </button>
              <button className="stat-box" onClick={() => setView("stack")}>
                <span className="stat-count" style={{ color: "#22C55E" }}>{tasks.filter(t => t.status === 'shipped').length}</span>
                <span className="stat-label">Shipped</span>
              </button>
            </div>

            <div className="view-header">
              <div className="view-header-left">
                <h2>{navItems.find((i) => i.id === view)?.label}</h2>
                <p>{navItems.find((i) => i.id === view)?.desc}</p>
              </div>
            </div>
            {renderView()}
          </div>
        </div>
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

        .main { margin-left: 260px; padding: 1.5rem; min-height: 100vh; }
        .main.wide { margin-left: 72px; }
        .content-wrapper { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; }
        .content-inner { width: 100%; max-width: 1400px; }
        .banner { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-radius: 12px; background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.25); margin-bottom: 1.5rem; }
        .banner-dot { width: 8px; height: 8px; border-radius: 50%; background: #F97316; animation: pulse 2s infinite; }
        .banner-label { color: #F97316; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; }
        .banner-text { color: white; font-size: 0.9rem; }
        .view-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .view-header-left h2 { color: white; font-size: 1.5rem; margin-bottom: 0.25rem; }
        .view-header-left p { color: #71717A; font-size: 0.85rem; }
        .chat-btn { display: flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #F97316, #EA580C); color: white; border: 0; padding: 0.65rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .chat-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); }

        .pipeline-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin: 1rem 0 1.25rem; }
        .stat-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 0.8rem 0.9rem; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 0.3rem; }
        .stat-box:hover { border-color: rgba(249,115,22,0.4); }
        .stat-box.urgent { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.08); }
        .stat-count { font-size: 1.3rem; font-weight: 700; }
        .stat-label { color: #A1A1AA; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; }

        .section { margin-bottom: 1rem; }
        .section-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; color: white; cursor: pointer; }
        .section-title { display: flex; align-items: center; gap: 0.5rem; }
        .section-dot { width: 6px; height: 6px; background: #F97316; border-radius: 50%; }
        .section-count { margin-left: 0.5rem; background: rgba(255,255,255,0.1); padding: 0.1rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; color: #A1A1AA; }
        .section-right { display: flex; align-items: center; gap: 0.5rem; color: #A1A1AA; }
        .section-body { padding: 0.75rem 0.25rem; }

        .kanban { display: grid; grid-template-columns: repeat(5, 260px); gap: 0.75rem; justify-content: center; }
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
        .agent-header-text { flex: 1; }
        .agent-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(59,130,246,0.2); display: flex; align-items: center; justify-content: center; color: #93C5FD; }
        .agent-name { color: white; font-weight: 600; }
        .agent-status { font-size: 0.7rem; color: #A1A1AA; display: flex; align-items: center; gap: 0.4rem; }
        .agent-status .dot { width: 6px; height: 6px; border-radius: 50%; background: #71717A; }
        .agent-status.running .dot { background: #22C55E; box-shadow: 0 0 8px #22C55E; }
        .agent-section { margin-bottom: 0.75rem; padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 8px; }
        .agent-section-title { display: flex; align-items: center; gap: 0.4rem; font-size: 0.65rem; text-transform: uppercase; color: #A1A1AA; margin-bottom: 0.4rem; font-weight: 600; letter-spacing: 0.02em; }
        .agent-section-title.urgent { color: #8B5CF6; }
        .agent-section-title.shipped { color: #22C55E; }
        .urgent-dot { width: 6px; height: 6px; background: #8B5CF6; border-radius: 50%; animation: pulse 2s infinite; }
        .agent-task-highlight { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); padding: 0.5rem; border-radius: 6px; color: white; font-size: 0.8rem; font-weight: 500; }
        .agent-task-list { display: flex; flex-direction: column; gap: 0.3rem; }
        .agent-task-item { font-size: 0.75rem; color: #A1A1AA; padding: 0.25rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .agent-task-item:last-child { border-bottom: none; }
        .agent-task-item.shipped { color: #7b8b7d; }
        .agent-task { display: flex; align-items: center; gap: 0.4rem; background: rgba(249,115,22,0.1); border: 1px solid rgba(249,115,22,0.2); padding: 0.6rem; border-radius: 8px; color: white; font-size: 0.8rem; }
        .agent-metadata { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.6rem 0; }
        .meta-pill { font-size: 0.6rem; padding: 0.15rem 0.45rem; border-radius: 6px; background: rgba(255,255,255,0.08); color: #A1A1AA; }
        .meta-pill.todo { background: rgba(113,113,122,0.2); color: #A1A1AA; }
        .meta-pill.active { background: rgba(59,130,246,0.2); color: #93C5FD; }
        .meta-pill.needs { background: rgba(139,92,246,0.2); color: #C4B5FD; }
        .meta-pill.ready { background: rgba(245,158,11,0.2); color: #FDBA74; }
        .meta-pill.shipped { background: rgba(34,197,94,0.2); color: #86EFAC; }
        .agent-stats { display: flex; gap: 0.5rem; margin-top: 0.6rem; color: #71717A; font-size: 0.7rem; }
        .agent-stats div { display: flex; align-items: center; gap: 0.3rem; }

        .energy { display: flex; flex-direction: column; gap: 0.75rem; }
        .energy-band { border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0.8rem; }
        .energy-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .energy-chip { display: flex; align-items: center; gap: 0.4rem; background: #18181B; border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 0.4rem 0.6rem; color: white; font-size: 0.75rem; }

        .live-feed { display: flex; flex-direction: column; gap: 1rem; }
        .feed-group { border-left: 2px solid rgba(255,255,255,0.1); padding-left: 1rem; }
        .feed-group-header { font-size: 0.7rem; text-transform: uppercase; color: #52525B; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .feed-empty { color: #52525B; font-size: 0.75rem; font-style: italic; padding: 0.5rem 0; }
        .feed-item { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.6rem; background: #18181B; border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 0.4rem; }
        .feed-item:last-child { margin-bottom: 0; }
        .feed-item-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 0.35rem; }
        .feed-item-icon { width: 24px; height: 24px; border-radius: 6px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .feed-item-content { flex: 1; min-width: 0; }
        .feed-item-title { color: white; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 0.4rem; }
        .feed-item-subtitle { color: #71717A; font-size: 0.7rem; font-weight: 400; }
        .feed-item-desc { color: #52525B; font-size: 0.7rem; margin-top: 0.2rem; }
        .feed-item-time { color: #52525B; font-size: 0.65rem; flex-shrink: 0; white-space: nowrap; }
        .live-item { display: flex; align-items: flex-start; gap: 0.6rem; background: #18181B; border: 1px solid rgba(255,255,255,0.04); border-radius: 10px; padding: 0.75rem; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 0.35rem; }
        .live-title { color: white; font-size: 0.85rem; font-weight: 600; }
        .live-desc { color: #71717A; font-size: 0.75rem; }

        .badge-outline { border: 1px solid rgba(255,255,255,0.2); color: #A1A1AA; padding: 0.1rem 0.4rem; border-radius: 6px; font-size: 0.65rem; }
        .pill { width: 8px; height: 8px; border-radius: 50%; border: 2px solid; }

        .mobile-header, .mobile-nav, .mobile-sidebar, .overlay { display: none; }
        .icon-btn { background: rgba(255,255,255,0.05); border: 0; border-radius: 8px; padding: 0.35rem; color: white; }

        @media (max-width: 1400px) {
          .kanban { grid-template-columns: repeat(3, 260px); }
        }
        @media (max-width: 1100px) {
          .kanban { grid-template-columns: repeat(2, 260px); }
        }
        @media (max-width: 900px) {
          .kanban { grid-template-columns: minmax(280px, 1fr); justify-content: stretch; }
        }
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .main { margin-left: 0; padding: 0.75rem; padding-bottom: 5rem; }
          .content-wrapper { max-width: 100%; align-items: stretch; }
          .content-inner { max-width: 100%; }
          .pipeline-stats { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          .stat-box { padding: 0.6rem; }
          .stat-count { font-size: 1.1rem; }
          .kanban { display: flex; flex-direction: column; gap: 1rem; }
          .task-col { width: 100%; }
          .agent-grid { grid-template-columns: 1fr; }
          .mobile-header { display: flex; position: fixed; top: 0; left: 0; right: 0; height: 56px; align-items: center; justify-content: space-between; padding: 0 0.75rem; background: rgba(24,24,27,0.95); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 60; }
          .mobile-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(24,24,27,0.95); border-top: 1px solid rgba(255,255,255,0.05); padding: 0.5rem 0.5rem 1rem; justify-content: space-around; z-index: 60; }
          .mobile-item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; color: #71717A; background: none; border: 0; font-size: 0.7rem; }
          .mobile-item.active { color: #F97316; }
          .mobile-sidebar { display: block; position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #18181B; padding: 1rem; transform: translateX(-100%); transition: transform 0.2s ease; z-index: 70; }
          .mobile-sidebar.open { transform: translateX(0); }
          .mobile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; color: white; }
          .overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 65; }
          .view-header { flex-direction: column; align-items: stretch; gap: 0.75rem; margin-top: 4rem; }
          .view-header-left h2 { font-size: 1.25rem; }
          .chat-btn { justify-content: center; width: 100%; padding: 0.75rem; }
          .banner { margin-top: 0.5rem; }
          .feed-group { border-left: none; padding-left: 0; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem; }
        }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
