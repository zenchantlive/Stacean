"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { TaskWidget } from "@/components/dashboard/TaskWidget";
import { AgentLensView } from "@/components/dashboard/views/AgentLensView";
import { ObjectiveStackView } from "@/components/dashboard/views/ObjectiveStackView";
import { EnergyMapView } from "@/components/dashboard/views/EnergyMapView";
import { CheckSquare, FolderKanban, Bot, Layers, Zap, Activity, ArrowLeft } from "lucide-react";

type ViewType = "stack" | "lens" | "energy" | "agents";

interface Agent {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
  lastActivity?: string;
}

export default function FocusedPage() {
  const [activeView, setActiveView] = useState<ViewType>("stack");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");

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
  }, []);

  // Fetch current task from Atlas state
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        setCurrentTask(data.currentActivity || data.currentTask || "");
      } catch (err) {
        console.error("Failed to fetch state:", err);
      }
    };
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const views = [
    { id: "stack" as ViewType, label: "Objectives", icon: Layers, component: <ObjectiveStackView /> },
    { id: "lens" as ViewType, label: "Agents", icon: Bot, component: <AgentLensView /> },
    { id: "energy" as ViewType, label: "Energy", icon: Zap, component: <EnergyMapView /> },
    { id: "agents" as ViewType, label: "Live", icon: Activity, component: <AgentsPanel agents={agents} currentTask={currentTask} /> },
  ];

  const activeViewConfig = views.find(v => v.id === activeView);

  return (
    <div className="app">
      <Header />
      
      {/* BACK TO FULL DASHBOARD */}
      <div className="back-link">
        <Link href="/" className="back-btn">
          <ArrowLeft size={16} />
          Full Dashboard
        </Link>
      </div>

      {/* TABS */}
      <nav className="app-tabs">
        {views.map(view => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              className={`tab ${activeView === view.id ? "active" : ""}`}
              onClick={() => setActiveView(view.id)}
            >
              <Icon size={18} />
              {view.label}
            </button>
          );
        })}
      </nav>

      {/* CONTENT */}
      <main className="app-content">
        {activeView === "agents" ? (
          <AgentsPanel agents={agents} currentTask={currentTask} />
        ) : (
          <div className="focused-view">
            {/* Current Atlas Activity */}
            {currentTask && (
              <div className="current-activity">
                <span className="activity-label">Atlas is doing:</span>
                <span className="activity-value">{currentTask}</span>
              </div>
            )}
            
            {/* Task View */}
            <TaskWidget isActive={true} />
          </div>
        )}
      </main>
    </div>
  );
}

// Agents Panel Component
function AgentsPanel({ agents, currentTask }: { agents: Agent[]; currentTask: string }) {
  return (
    <div className="agents-panel">
      <h2>Active Agents</h2>
      
      {currentTask && (
        <div className="current-atlas">
          <div className="atlas-header">
            <Activity size={20} />
            <span>Atlas</span>
          </div>
          <div className="atlas-activity">
            {currentTask || "Idle"}
          </div>
        </div>
      )}

      <div className="agents-list">
        {agents.length === 0 ? (
          <p className="no-agents">No other agents active</p>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <div className="agent-status">
                <span className={`status-dot ${agent.status}`} />
                <span className="agent-name">{agent.name}</span>
              </div>
              {agent.currentTask && (
                <p className="agent-task">{agent.currentTask}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
