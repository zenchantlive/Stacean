"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { Task, ENERGY_BANDS, EnergyBand } from "@/lib/types/tracker-new";
import { Flame, Focus, Leaf } from "lucide-react";

const BAND_ICONS: Record<EnergyBand, React.ElementType> = {
  intense: Flame,
  focused: Focus,
  light: Leaf,
};

interface EnergyMapViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function EnergyMapView({ tasks, onTaskClick }: EnergyMapViewProps) {
  const activeTasks = tasks.filter((t) => t.status !== "tombstone");

  const bandTasks = (band: EnergyBand) => {
    const config = ENERGY_BANDS[band];
    return activeTasks.filter((t) => config.priorities.includes(t.priority));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {Object.entries(ENERGY_BANDS).map(([band, config]) => {
          const Icon = BAND_ICONS[band as EnergyBand];
          const items = bandTasks(band as EnergyBand);
          const isEmpty = items.length === 0;

          return (
            <motion.section
              key={band}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "rounded-2xl border border-white/5 p-4 md:p-5",
                "bg-[#1d1917]/60"
              )}
            >
              <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${config.color}22`, color: config.color }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f2efed]">{config.label}</h3>
                    <p className="text-xs text-[#9a8f86]">{config.description}</p>
                  </div>
                </div>
                <span className="text-xs text-[#9a8f86]">{items.length} tasks</span>
              </header>

              {isEmpty ? (
                <div className="text-sm text-[#6b615a]">Nothing here — go live your life.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {items.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className="px-3 py-2 rounded-xl border border-white/10 bg-[#141110] text-left hover:border-white/20 hover:bg-[#25201d]/60 transition-colors"
                    >
                      <p className="text-xs text-[#9a8f86] mb-1">{task.project || "Unassigned"}</p>
                      <p className="text-sm text-[#f2efed] leading-snug">{task.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
