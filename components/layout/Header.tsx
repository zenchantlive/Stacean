"use client";

import { Activity } from "lucide-react";

interface HeaderProps {
  isOnline?: boolean;
  currentTask?: string;
}

export function Header({ isOnline = false, currentTask = "" }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#18181B]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-50 safe-area-pt">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
          <Activity size={18} className="text-white" />
        </div>
        <span className="font-semibold text-white text-sm">Atlas Cockpit</span>
      </div>
      
      <div className="flex items-center gap-3">
        {currentTask && (
          <span className="hidden sm:block text-xs text-[#71717A] truncate max-w-[120px]">
            {currentTask}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <span className={`status-dot ${isOnline ? "online" : "offline"}`} />
          <span className="text-xs text-[#71717A]">{isOnline ? "Online" : "Offline"}</span>
        </div>
      </div>
    </header>
  );
}
