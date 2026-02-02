"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { TaskWidget } from "@/components/dashboard/TaskWidget";
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
        <button className={`tab ${activeView === "stack" ? "active" : ""}`} onClick={() => setActiveView("stack")}>
          <Layers size={18} /> Objectives
        </button>
        <button className={`tab ${activeView === "lens" ? "active" : ""}`} onClick={() => setActiveView("lens")}>
          <Bot size={18} /> Agents
        </button>
        <button className={`tab ${activeView === "energy" ? "active" : ""}`} onClick={() => setActiveView("energy")}>
          <Zap size={18} /> Energy
        </button>
        <button className={`tab ${activeView === "agents" ? "active" : ""}`} onClick={() => setActiveView("agents")}>
          <Activity size={18} /> Live
        </button>
      </nav>

      {/* CONTENT */}
      <main className="app-content">
        {/* Current Atlas Activity */}
        {currentTask && (
          <div className="current-activity">
            <span className="activity-label">Atlas is doing:</span>
            <span className="activity-value">{currentTask}</span>
          </div>
        )}

        {/* Task Widget with all views */}
        <TaskWidget isActive={true} />

        {/* Agents Panel */}
        {activeView === "agents" && (
          <div className="agents-panel">
            <h2>Active Agents</h2>
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
        )}
      </main>
    </div>
  );
}
