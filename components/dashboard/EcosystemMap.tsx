"use client";

import { motion } from "framer-motion";

const projects = [
  { name: "Asset-Hatch", status: "Active", url: "https://asset-hatch.vercel.app", color: "#F97316" },
  { name: "Catwalk Live", status: "Active", url: "https://catwalk.live", color: "#10B981" },
  { name: "TheFeed", status: "Active", url: "https://the-feed.vercel.app", color: "#3B82F6" },
  { name: "Atlas Cockpit", status: "Building", url: "#", color: "#F97316" },
];

export function EcosystemMap() {
  return (
    <div className="w-full h-full flex flex-col space-y-6">
      <div className="px-2">
        <p className="text-xs text-[#A1A1AA] font-mono">PROJECT ECOSYSTEM</p>
      </div>

      <div className="grid grid-cols-2 gap-4 px-2">
        {projects.map((project, i) => (
          <motion.a
            key={project.name}
            href={project.url}
            target="_blank"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 glass-card flex flex-col justify-between aspect-square hover:bg-[#3F3F46]/60 transition-colors"
          >
            <div>
              <div 
                className="w-2 h-2 rounded-full mb-3" 
                style={{ backgroundColor: project.color, boxShadow: `0 0 10px ${project.color}40` }}
              />
              <h3 className="text-sm font-bold text-[#FAFAFA] leading-tight">{project.name}</h3>
            </div>
            <p className="text-[10px] text-[#A1A1AA] font-mono uppercase">{project.status}</p>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
