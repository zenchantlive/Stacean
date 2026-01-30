"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MissionCardProps {
  title: string;
  progress: number; // 0-100
  status: "active" | "paused" | "complete";
  lastUpdate: string;
}

export function MissionCard({ title, progress, status, lastUpdate }: MissionCardProps) {
  const statusColors = {
    active: "bg-terracotta",
    paused: "bg-gray-400",
    complete: "bg-secondary",
  };

  return (
    <div className="bg-canvas border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-lg text-ink">{title}</h3>
        <span className={cn("w-3 h-3 rounded-full", statusColors[status])} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono text-muted">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full", statusColors[status])}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <p className="text-xs text-muted mt-4 font-mono">
        Updated: {lastUpdate}
      </p>
    </div>
  );
}