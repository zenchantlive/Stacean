"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, Zap } from "lucide-react";

interface AtlasState {
  status: string;
  currentTask: string;
  lastUpdated: string;
  atlasOnline?: boolean;
  currentActivity?: string;
  lastHeartbeat?: string;
  _note?: string; // Present when using fallback state
}

export function AtlasPulse() {
  const [state, setState] = useState<AtlasState | null>(null);
  const [kvConnected, setKvConnected] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        
        // Check if KV is connected (_connected flag)
        setKvConnected(data._connected === true);
        
        setState({
          status: data.atlasOnline ? "Online" : "Offline",
          currentTask: data.currentActivity || data.currentTask || "Initializing...",
          lastUpdated: data.lastHeartbeat || data.lastUpdated || new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to fetch state:", err);
        setKvConnected(false);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state) return null;

  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center space-y-8">
      {/* Status Indicator */}
      <div className="relative">
        <motion.div
          animate={{
            scale: kvConnected ? [1, 1.3, 1] : [1, 1.1, 1],
            opacity: kvConnected ? [0.5, 1, 0.5] : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: kvConnected ? 2 : 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`w-24 h-24 rounded-full blur-xl opacity-20 absolute top-0 left-0 ${
            kvConnected ? "bg-[#22C55E]" : "bg-[#F97316]"
          }`}
        />
        <div className="w-16 h-16 rounded-full bg-[#18181B] border border-[#3F3F46] flex items-center justify-center z-10 relative shadow-[0_0_20px_rgba(249,115,22,0.1)]">
          <Activity size={24} className={kvConnected ? "text-[#22C55E]" : "text-[#F97316]"} />
        </div>
      </div>

      {/* Text Content */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#FAFAFA]">Atlas is {state.status}</h2>
        <div className="flex items-center justify-center space-x-2">
          <p className="text-[#71717A] font-mono text-[10px] uppercase tracking-widest">
            Cloud Sync:
          </p>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
              kvConnected
                ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
                : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}
          >
            {kvConnected ? (
              <span className="flex items-center gap-1">
                <Zap size={10} /> CONNECTED (KV)
              </span>
            ) : (
              "UNPLUGGED (LOCAL ONLY)"
            )}
          </span>
        </div>
      </div>

      {/* Current Task */}
      <div className="w-full max-w-xs p-4 glass-card" data-testid="pulse-card">
        <p className="text-xs text-[#A1A1AA] font-mono mb-2">CURRENT CONTEXT</p>
        <p className="text-[#FAFAFA]">{state.currentTask}</p>
        {kvConnected && state.lastUpdated && (
          <p className="text-[10px] text-[#71717A] mt-2 font-mono">
            Last heartbeat: {new Date(state.lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
