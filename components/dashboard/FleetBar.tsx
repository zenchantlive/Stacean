"use client";

import { motion } from "framer-motion";
import { AgentSession, AgentStatus } from "@/lib/types/tracker";

// ============================================================================
// Styles
// ============================================================================

const STATUS_RINGS: Record<AgentStatus, string> = {
  idle: "border-zinc-700",
  working: "border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
  done: "border-green-500",
  error: "border-red-500",
};

// ============================================================================
// Component
// ============================================================================

interface FleetBarProps {
  agents: AgentSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FleetBar({ agents, selectedId, onSelect }: FleetBarProps) {
  // Sort agents: YOU first, then Working, then others
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.codeName === "YOU") return -1;
    if (b.codeName === "YOU") return 1;
    
    // Working comes before Idle
    if (a.status === 'working' && b.status !== 'working') return -1;
    if (b.status === 'working' && a.status !== 'working') return 1;
    
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="w-full h-20 flex items-center px-2 space-x-4 overflow-x-auto no-scrollbar mask-linear-fade">
      {/* YOU (Main Session) - always present visually if not in list */}
      <AgentAvatar 
        agent={{
          id: "main-session",
          codeName: "YOU",
          initials: "ME",
          status: "working", // Always working?
          heartbeat: Date.now(),
          createdAt: 0,
          updatedAt: 0,
          context: { logs: [] }
        }}
        isSelected={selectedId === "main-session"}
        onClick={() => onSelect("main-session")}
      />

      {/* Separator */}
      <div className="h-8 w-[1px] bg-white/10" />

      {/* Sub Agents */}
      {sortedAgents.filter(a => a.codeName !== "YOU").map(agent => (
        <AgentAvatar
          key={agent.id}
          agent={agent}
          isSelected={selectedId === agent.id}
          onClick={() => onSelect(agent.id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Sub-Component: Avatar
// ============================================================================

function AgentAvatar({ 
  agent, 
  isSelected, 
  onClick 
}: { 
  agent: AgentSession; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const isWorking = agent.status === 'working';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="relative group flex flex-col items-center justify-center space-y-1"
    >
      {/* Avatar Circle */}
      <div className={`
        relative w-12 h-12 rounded-full flex items-center justify-center
        bg-[#18181B] border-2 transition-all duration-300
        ${isSelected ? "bg-white/10 scale-110" : "hover:bg-white/5"}
        ${STATUS_RINGS[agent.status]}
      `}>
        {/* Initials */}
        <span className={`text-xs font-bold font-mono ${isSelected ? "text-white" : "text-zinc-400"}`}>
          {agent.initials}
        </span>

        {/* Pulse Effect if Working */}
        {isWorking && (
          <span className="absolute inset-0 rounded-full border-2 border-cyan-500 animate-ping opacity-20" />
        )}
      </div>

      {/* Name Label */}
      <span className={`text-[9px] font-mono uppercase tracking-wide transition-colors ${
        isSelected ? "text-white" : "text-zinc-600 group-hover:text-zinc-500"
      }`}>
        {agent.codeName}
      </span>
    </motion.button>
  );
}
