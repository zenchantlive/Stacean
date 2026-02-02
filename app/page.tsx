"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, Bot, Zap, Activity, ArrowLeft, CheckSquare, Grid, LayoutGrid } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
}

// Task Display Component
function TaskDisplay({ view }: { view: string }) {
  return (
    <div className="task-display">
      <div className="task-header">
        <h2 className="text-xl font-semibold text-white">
          {view === "stack" && "Objectives"}
          {view === "lens" && "Agent Lens"}
          {view === "energy" && "Energy Map"}
        </h2>
      </div>
      <div className="task-empty">
        <CheckSquare size={48} className="text-[#52525B] mb-4" />
        <p className="text-[#A1A1AA]">No tasks yet</p>
        <p className="text-[#71717A] text-sm">Create your first objective to get started</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [viewMode, setViewMode] = useState<"focused" | "full">("focused");
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

  const focusedNavItems = [
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
          {/* View Mode Toggle */}
          <button 
            onClick={() => setViewMode(viewMode === "focused" ? "full" : "focused")}
            className="view-toggle"
            title={viewMode === "focused" ? "Switch to Full View" : "Switch to Focused View"}
          >
            {viewMode === "focused" ? <LayoutGrid size={18} /> : <LayoutGrid size={18} />}
          </button>
        </div>
        <div className="header-center">
          <span className="header-title">
            {viewMode === "focused" ? "Atlas Focus" : "Atlas Cockpit"}
          </span>
        </div>
        <div className="header-right">
          <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
        </div>
      </header>

      {/* Desktop Sidebar - Fixed Left */}
      <aside className="desktop-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Activity size={24} />
            <span>{viewMode === "focused" ? "Atlas Focus" : "Atlas"}</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {viewMode === "focused" ? (
            // Focused mode nav
            focusedNavItems.map(item => {
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
            })
          ) : (
            // Full mode nav - navigate to different widgets (scroll to section)
            <>
              <div className="nav-section-title">Widgets</div>
              <button className="sidebar-btn active">
                <Activity size={20} />
                <span>Pulse</span>
              </button>
              <button className="sidebar-btn">
                <Activity size={20} />
                <span>Screenshots</span>
              </button>
              <button className="sidebar-btn">
                <Activity size={20} />
                <span>Ledger</span>
              </button>
              <button className="sidebar-btn">
                <Activity size={20} />
                <span>Ecosystem</span>
              </button>
              <button className="sidebar-btn">
                <Activity size={20} />
                <span>Notes</span>
              </button>
              <button className="sidebar-btn">
                <CheckSquare size={20} />
                <span>Tasks</span>
              </button>
            </>
          )}
        </nav>
        
        <div className="sidebar-footer">
          <div className="view-toggle-container">
            <button 
              onClick={() => setViewMode(viewMode === "focused" ? "full" : "focused")}
              className={`toggle-btn ${viewMode === "focused" ? "active" : ""}`}
            >
              <LayoutGrid size={16} />
              <span>{viewMode === "focused" ? "Focused" : "Simple"}</span>
            </button>
            <button 
              onClick={() => setViewMode(viewMode === "full" ? "focused" : "full")}
              className={`toggle-btn ${viewMode === "full" ? "active" : ""}`}
            >
              <Grid size={16} />
              <span>{viewMode === "full" ? "Full" : "Dashboard"}</span>
            </button>
          </div>
          
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

        {/* FOCUSED MODE - Single cohesive area */}
        {viewMode === "focused" ? (
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
        ) : (
          /* FULL MODE - Widgets grid */
          <div className="widgets-grid">
            <div className="widget">
              <h3 className="widget-title">Atlas Pulse</h3>
              <p className="widget-empty">Real-time activity feed</p>
            </div>
            <div className="widget">
              <h3 className="widget-title">Screenshots</h3>
              <p className="widget-empty">No captures yet</p>
            </div>
            <div className="widget">
              <h3 className="widget-title">The Ledger</h3>
              <p className="widget-empty">Session activity log</p>
            </div>
            <div className="widget">
              <h3 className="widget-title">Project Ecosystem</h3>
              <p className="widget-empty">Connected projects</p>
            </div>
            <div className="widget">
              <h3 className="widget-title">Field Notes</h3>
              <p className="widget-empty">0 notes</p>
            </div>
            <div className="widget">
              <h3 className="widget-title">Tasks</h3>
              <p className="widget-empty">No objectives yet</p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav - Fixed Bottom */}
      <nav className="mobile-nav">
        {viewMode === "focused" ? (
          // Focused mode nav
          focusedNavItems.map(item => {
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
          })
        ) : (
          // Full mode nav
          <button onClick={() => setViewMode("focused")} className="nav-btn">
            <LayoutGrid size={22} />
            <span>Simple</span>
          </button>
        )}
      </nav>
    </div>
  );
}
