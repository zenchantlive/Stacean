"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface WeatherWidgetProps {
  projects: {
    name: string;
    status: "sunny" | "cloudy" | "rainy" | "stormy";
    lastAction: string;
  }[];
}

const weatherIcons = {
  sunny: "☀️",
  cloudy: "🌥️",
  rainy: "🌧️",
  stormy: "⛈️",
};

const statusColors = {
  sunny: "text-secondary",
  cloudy: "text-muted",
  rainy: "text-primary",
  stormy: "text-red-500",
};

export function EcosystemWeather({ projects }: WeatherWidgetProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {projects.map((project, idx) => (
        <div key={project.name} className="border border-[#E5E5E5] rounded-lg p-3 bg-[#FDFBF7]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">{weatherIcons[project.status]}</span>
            <span className={cn("text-[10px] font-mono uppercase", statusColors[project.status])}>
              {project.status}
            </span>
          </div>
          <h4 className="font-medium text-[#2D2D2D] text-sm">{project.name}</h4>
          <p className="text-[10px] text-[#A8A29E] font-mono mt-1">{project.lastAction}</p>
        </div>
      ))}
    </div>
  );
}