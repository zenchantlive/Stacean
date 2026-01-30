"use client";

import { motion } from "framer-motion";
import { AgentSession, Task, TaskStatus } from "@/lib/types/tracker";
import { Pause, XCircle, Terminal, Clock, FileCode, CheckCircle2, Play } from "lucide-react";
import { useState } from "react";

// ============================================================================
// Component
// ============================================================================

interface TaskDeckProps {
  agent: AgentSession;
  task?: Task; // Current task if any
  onAction: (action: 'pause' | 'stop' | 'resume') => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskDeck({ agent, task, onAction, onTaskUpdate }: TaskDeckProps) {
  const [showLogs, setShowLogs] = useState(false);

  const isWorking = agent.status === 'working';
  const isPaused = agent.status === 'idle' && agent.currentTaskId;

  return (
    <div className="w-full h-full flex items-center justify-center p-6 relative perspective-1000">
      
      {/* Background Cards (Visual Stack Effect) */}
      <div className="absolute top-8 w-[85%] h-[60%] bg-zinc-800/30 rounded-2xl blur-[1px] transform translate-y-4 scale-95" />
      <div className="absolute top-6 w-[90%] h-[65%] bg-zinc-800/50 rounded-2xl transform translate-y-2 scale-98" />

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={agent.id}
        className="relative w-full max-w-md h-[75%] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header: Task Title */}
        <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
              Current Objective
            </span>
            <div className={`
              px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1.5
              ${agent.status === 'working' ? 'bg-cyan-500/10 text-cyan-400' : 
                agent.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-500'}
            `}>
              {agent.status === 'working' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              {agent.status}
            </div>
          </div>
          
          <h2 className="text-xl font-medium text-white leading-tight">
            {task ? task.title : "Idle / Awaiting Orders"}
          </h2>
        </div>

        {/* Body: Logs or Context */}
        <div className="flex-1 p-5 overflow-y-auto no-scrollbar font-mono text-xs text-zinc-400 space-y-2 relative bg-[#0A0A0A]">
          {showLogs ? (
            <div className="space-y-1">
              {agent.context.logs.length === 0 ? (
                <span className="text-zinc-600 italic">// No logs yet...</span>
              ) : (
                agent.context.logs.slice().reverse().map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-zinc-600">[{i}]</span>
                    <span className="break-all">{log}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
               {/* Current Action */}
               <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                 <div className="flex items-center gap-2 mb-1 text-zinc-500">
                   <Clock size={12} />
                   <span className="text-[10px] uppercase">Last Action</span>
                 </div>
                 <p className="text-cyan-200">
                   {agent.currentAction || "Standing by..."}
                 </p>
               </div>

               {/* Stats / Metadata */}
               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-zinc-900/50 rounded-lg p-3 border border-white/5">
                   <div className="flex items-center gap-2 mb-1 text-zinc-500">
                     <FileCode size={12} />
                     <span className="text-[10px] uppercase">Files</span>
                   </div>
                   <span className="text-white">0</span>
                 </div>
                 <div className="bg-zinc-900/50 rounded-lg p-3 border border-white/5">
                   <div className="flex items-center gap-2 mb-1 text-zinc-500">
                     <Terminal size={12} />
                     <span className="text-[10px] uppercase">Commands</span>
                   </div>
                   <span className="text-white">0</span>
                 </div>
               </div>
            </div>
          )}
          
          {/* Toggle Log View */}
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="absolute bottom-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-full shadow-lg transition-colors border border-white/10"
          >
             <Terminal size={14} />
          </button>
        </div>

        {/* Footer: Controls */}
        <div className="p-4 border-t border-white/5 bg-zinc-900/80 backdrop-blur flex items-center justify-between gap-3">
           {isWorking ? (
             <button 
               onClick={() => onAction('pause')}
               className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors font-medium text-xs"
             >
               <Pause size={14} /> Pause
             </button>
           ) : (
             <button 
               onClick={() => onAction('resume')}
               className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl transition-colors font-medium text-xs"
             >
               <Play size={14} /> Resume
             </button>
           )}
           
           <button 
             onClick={() => onAction('stop')}
             className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl transition-colors font-medium text-xs border border-red-500/20"
           >
             <XCircle size={14} /> Stop
           </button>

           {task && (
             <button 
               onClick={() => onTaskUpdate(task.id, { status: 'done' })}
               className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-3 rounded-xl transition-colors font-medium text-xs border border-green-500/20"
             >
               <CheckCircle2 size={14} /> Done
             </button>
           )}
        </div>

      </motion.div>
    </div>
  );
}
