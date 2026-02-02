"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { TaskWidget } from "@/components/dashboard/TaskWidget";
import { Bot, Layers, Zap, Activity, ArrowLeft } from "lucide-react";

type ViewType = "stack" | "lens" | "energy" | "agents";

interface Agent {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
}

export default function FocusedPage() {
  const [activeView, setActiveView] = useState<ViewType>("stack");
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
    { id: "stack" as ViewType, icon: Layers, label: "Objectives" },
    { id: "lens" as ViewType, icon: Bot, label: "Agents" },
    { id: "energy" as ViewType, icon: Zap, label: "Energy" },
    { id: "agents" as ViewType, icon: Activity, label: "Live" },
  ];

  return (
    <div className="app-container">
      {/* Aurora Background */}
      <div className="aurora top-[-50px] left-[-50px]" />
      <div className="aurora bottom-[-100px] right-[-50px] opacity-50" />

      {/* Mobile: Horizontal scroll with snap */}
      <main className="md:hidden w-full h-full flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <Header isOnline={isOnline} currentTask={currentTask} />
        
        {/* Back Link */}
        <div className="px-4 pt-20">
          <Link href="/" className="back-btn">
            <ArrowLeft size={16} />
            Full Dashboard
          </Link>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
          {/* Current Activity */}
          {currentTask && (
            <div className="current-activity mb-4">
              <span className="activity-label">Atlas:</span>
              <span className="activity-value">{currentTask}</span>
            </div>
          )}

          {/* Views */}
          {activeView === "stack" && <TaskWidget isActive={true} />}
          {activeView === "lens" && <TaskWidget isActive={true} />}
          {activeView === "energy" && <TaskWidget isActive={true} />}
          
          {/* Live Agents Panel */}
          {activeView === "agents" && (
            <div className="agents-panel">
              <h2 className="text-lg font-semibold mb-4">Active Agents</h2>
              {agents.length === 0 ? (
                <p className="no-agents">No other agents active</p>
              ) : (
                agents.map(agent => (
                  <div key={agent.id} className="agent-card mb-2">
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
          )}
        </div>

        {/* Sticky Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#18181B]/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 z-50 safe-area-pb">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                  activeView === item.id
                    ? "bg-[#F97316] text-white"
                    : "text-[#71717A] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* Desktop: Grid layout with sticky top nav */}
      <main className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 relative z-10 overflow-y-auto h-full pb-32">
        {/* Sticky Top Nav */}
        <nav className="fixed top-0 left-0 right-0 h-16 bg-[#18181B]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-2">
            <Link href="/" className="back-btn">
              <ArrowLeft size={16} />
              Full
            </Link>
            <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-semibold text-white">Atlas Focus</span>
          </div>
          
          <div className="flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    activeView === item.id 
                      ? "bg-[#F97316]/20 text-[#F97316]" 
                      : "text-[#71717A] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Grid */}
        <div className="col-span-full pt-20">
          {/* Current Activity Banner */}
          {currentTask && (
            <div className="current-activity mb-6 max-w-2xl">
              <span className="activity-label">Atlas is doing:</span>
              <span className="activity-value">{currentTask}</span>
            </div>
          )}

          {/* Main Content Area */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Task Widget */}
            <div className="col-span-2 xl:col-span-2">
              {activeView === "stack" && <TaskWidget isActive={true} />}
              {activeView === "lens" && <TaskWidget isActive={true} />}
              {activeView === "energy" && <TaskWidget isActive={true} />}
              {activeView === "agents" && (
                <div className="widget">
                  <h2 className="text-lg font-semibold mb-4">Active Agents</h2>
                  {agents.length === 0 ? (
                    <p className="no-agents">No other agents active</p>
                  ) : (
                    <div className="grid gap-3">
                      {agents.map(agent => (
                        <div key={agent.id} className="agent-card">
                          <div className="agent-status">
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
              )}
            </div>

            {/* Side Panel - Atlas Status */}
            <div className="widget">
              <h3 className="text-sm font-medium text-[#71717A] mb-4">Atlas Status</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className={`status-indicator ${isOnline ? "online" : "offline"}`} />
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
              {currentTask && (
                <div className="text-sm">
                  <span className="text-[#71717A]">Current: </span>
                  <span className="text-white">{currentTask}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
