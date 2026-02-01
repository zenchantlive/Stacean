"use client";

import { ChevronDown } from "lucide-react";
import clsx from "clsx";

// ============================================================================
// Project Configuration
// ============================================================================

export const PROJECTS = [
  { id: 'clawd', name: 'Atlas Cockpit', url: 'http://localhost:3000', status: 'active' },
  { id: 'asset-hatch', name: 'Asset-Hatch', url: 'https://asset-hatch.vercel.app', status: 'active' },
  { id: 'catwalk', name: 'Catwalk Live', url: 'https://catwalk.live', status: 'active' },
  { id: 'the-feed', name: 'TheFeed', url: 'https://the-feed.vercel.app', status: 'building' },
] as const;

export type Project = (typeof PROJECTS)[number];

// ============================================================================
// Component
// ============================================================================

interface ProjectSelectorProps {
  selectedProject: string | null;
  onSelect: (project: string | null) => void;
}

export function ProjectSelector({ selectedProject, onSelect }: ProjectSelectorProps) {
  return (
    <div className="flex items-center gap-2 px-1">
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
          selectedProject === null
            ? 'bg-white/10 border-white/20 text-white'
            : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/20'
        )}
      >
        <span className="text-[10px] font-medium">All Projects</span>
        <ChevronDown className={clsx("text-[10px]", selectedProject === null && "rotate-180")} size={14} />
      </button>

      <div className="h-6 w-px bg-white/10" />

      {PROJECTS.map(project => (
        <button
          key={project.id}
          onClick={() => onSelect(project.id)}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors",
            selectedProject === project.id
              ? 'bg-white/10 border-white/20 text-white'
              : 'border-white/10 text-zinc-500 hover:text-zinc-300 hover:border-white/20'
          )}
        >
          <span className="text-[10px] font-medium">{project.name}</span>
          {project.status === 'building' && (
            <span className="ml-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[8px]">BUILDING</span>
          )}
        </button>
      ))}
    </div>
  );
}
