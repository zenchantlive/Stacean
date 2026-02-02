"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, CheckSquare, FileText, BookOpen, Image, Grid, Plus, ChevronRight, MoreHorizontal } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
  currentTask?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface CardData {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  detail: string;
  link: string;
  color: string;
}

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [currentTask, setCurrentTask] = useState<string>("");
  const [isOnline, setIsOnline] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

  // Card data
  const cards: CardData[] = [
    {
      id: "pulse",
      title: "Atlas Pulse",
      icon: Activity,
      summary: isOnline ? "Online • " + (currentTask || "Idle") : "Offline",
      detail: currentTask || "No current activity",
      link: "#pulse",
      color: "from-green-500/10 to-green-600/5",
    },
    {
      id: "tasks",
      title: "Tasks",
      icon: CheckSquare,
      summary: `${tasks.length} active • ${tasks.filter(t => t.status === "done").length} completed`,
      detail: tasks.length > 0 ? `Top: ${tasks[0].title}` : "No tasks yet",
      link: "/tasks",
      color: "from-orange-500/10 to-orange-600/5",
    },
    {
      id: "ledger",
      title: "The Ledger",
      icon: FileText,
      summary: "3 recent entries",
      detail: "10:23 Completed task",
      link: "#ledger",
      color: "from-blue-500/10 to-blue-600/5",
    },
    {
      id: "screenshots",
      title: "Screenshots",
      icon: Image,
      summary: "12 captures",
      detail: "Last: 10 minutes ago",
      link: "#screenshots",
      color: "from-purple-500/10 to-purple-600/5",
    },
    {
      id: "ecosystem",
      title: "Project Ecosystem",
      icon: Grid,
      summary: "3 connected projects",
      detail: "Stacean, Asset Hatch, Beads",
      link: "#ecosystem",
      color: "from-cyan-500/10 to-cyan-600/5",
    },
    {
      id: "notes",
      title: "Field Notes",
      icon: BookOpen,
      summary: "0 notes",
      detail: "Create your first note",
      link: "#notes",
      color: "from-pink-500/10 to-pink-600/5",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Persistent Header with Status */}
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
          {/* Current Activity */}
          {currentTask && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#27272A] rounded-lg">
              <span className="text-xs text-[#71717A]">Atlas:</span>
              <span className="text-sm text-white truncate max-w-[200px]">{currentTask}</span>
            </div>
          )}

          {/* Status Indicator */}
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${isOnline ? "text-green-500" : "text-red-500"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard - Unified Card Grid */}
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
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-[#71717A]">Last heartbeat:</span>
                <span className="text-xs text-[#A1A1AA]">2 min ago</span>
              </div>
            </div>
          </div>

          {/* Cards Grid - Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              const isExpanded = expandedCard === card.id;

              return (
                <Link
                  key={card.id}
                  href={card.link}
                  onClick={(e) => {
                    if (card.link.startsWith("#")) {
                      e.preventDefault();
                      setExpandedCard(isExpanded ? null : card.id);
                    }
                  }}
                  className="group relative"
                >
                  {/* Card */}
                  <div
                    className={`relative bg-gradient-to-br ${card.color} border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300 ${
                      isExpanded ? "ring-2 ring-[#F97316]/50" : ""
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-[#18181B] flex items-center justify-center border border-white/5">
                        <Icon className="w-5 h-5 text-[#F97316]" />
                      </div>
                      <button className="p-2 hover:bg-[#27272A] rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-[#71717A]" />
                      </button>
                    </div>

                    {/* Card Title */}
                    <h3 className="font-semibold text-white text-lg mb-2">{card.title}</h3>

                    {/* Card Summary */}
                    <p className="text-sm text-[#A1A1AA] mb-3">{card.summary}</p>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-sm text-[#E4E4E7]">{card.detail}</p>
                        <button className="mt-3 flex items-center gap-2 text-sm text-[#F97316] font-medium hover:text-[#FF8C42] transition-colors">
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Card Footer (Action) */}
                    <div className="mt-4 flex items-center justify-between">
                      {!isExpanded && (
                        <button className="text-xs text-[#71717A] hover:text-white transition-colors">
                          Tap for details
                        </button>
                      )}
                      {card.id === "tasks" && !isExpanded && (
                        <Link
                          href="/tasks"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Task</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h3 className="text-sm font-semibold text-[#71717A] uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A] rounded-xl text-white text-sm transition-all">
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A] rounded-xl text-white text-sm transition-all">
                <FileText className="w-4 h-4" />
                <span>Add Note</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A] rounded-xl text-white text-sm transition-all">
                <Activity className="w-4 h-4" />
                <span>Check Status</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A] rounded-xl text-white text-sm transition-all">
                <Image className="w-4 h-4" />
                <span>Capture</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
