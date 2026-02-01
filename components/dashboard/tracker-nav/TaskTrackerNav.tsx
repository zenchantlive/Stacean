"use client";

import { useState } from 'react';
import { ViewType, VIEWS } from '@/lib/types/tracker-new';
import { Layers, Bot, Zap, Search, Plus, X } from 'lucide-react';
import clsx from 'clsx';

// ============================================================================
// Navigation Props
// ============================================================================

interface TaskTrackerNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCreateTask: () => void;
}

// ============================================================================
// Icon Mapping
// ============================================================================

const VIEW_ICONS: Record<ViewType, React.ElementType> = {
  'objective-stack': Layers,
  'agent-lens': Bot,
  'energy-map': Zap,
  'search': Search,
};

// ============================================================================
// Component
// ============================================================================

export function TaskTrackerNav({ currentView, onViewChange, onCreateTask }: TaskTrackerNavProps) {
  const [fabExpanded, setFabExpanded] = useState(false);

  return (
    <>
      {/* Mobile Bottom Dock */}
      <nav className="md:hidden task-mobile-dock">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {Object.entries(VIEWS).map(([view, config]) => {
            const isActive = view === currentView;
            const Icon = VIEW_ICONS[view as ViewType];

            return (
              <button
                key={view}
                onClick={() => onViewChange(view as ViewType)}
                className={clsx(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-[#8ea89e] bg-[#8ea89e]/10"
                    : "text-[#9a8f86] hover:text-[#cfc7c1] hover:bg-[#1d1917]"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{config.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Left Rail */}
      <nav className="hidden md:flex task-desktop-rail">
        {/* App Logo/Brand */}
        <div className="flex-shrink-0 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8ea89e] to-[#6fa5a2] flex items-center justify-center">
            <Layers size={20} className="text-[#0f0d0c]" />
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex-1 flex flex-col gap-2 w-full px-2">
          {Object.entries(VIEWS).map(([view, config]) => {
            const isActive = view === currentView;
            const Icon = VIEW_ICONS[view as ViewType];

            return (
              <button
                key={view}
                onClick={() => onViewChange(view as ViewType)}
                title={config.description || config.label}
                className={clsx(
                  "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  isActive
                    ? "text-[#8ea89e] bg-[#8ea89e]/10 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-[#8ea89e] before:rounded-r"
                    : "text-[#9a8f86] hover:text-[#cfc7c1] hover:bg-[#1d1917]"
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 mt-auto flex flex-col gap-3 w-full px-2">
          {/* Create Task Button */}
          <button
            onClick={onCreateTask}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8ea89e] to-[#6fa5a2] text-[#0f0d0c] flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all"
            title="Create Task"
          >
            <Plus size={24} />
          </button>
        </div>
      </nav>

      {/* FAB (Mobile Only) */}
      <button
        onClick={onCreateTask}
        className="md:hidden task-fab"
        aria-label="Create Task"
      >
        <Plus size={28} />
      </button>
    </>
  );
}

// ============================================================================
// Desktop Header Component
// ============================================================================

interface TaskTrackerHeaderProps {
  currentView: ViewType;
  onSearchChange?: (query: string) => void;
  onCreateTask: () => void;
}

export function TaskTrackerHeader({ currentView, onSearchChange, onCreateTask }: TaskTrackerHeaderProps) {
  const viewConfig = VIEWS[currentView];
  const Icon = VIEW_ICONS[currentView];

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#141110]/50 backdrop-blur-sm">
      {/* View Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1d1917] border border-white/10 flex items-center justify-center text-[#8ea89e]">
          <Icon size={20} />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[#f2efed]">{viewConfig.label}</h1>
          {viewConfig.description && (
            <p className="text-xs text-[#9a8f86]">{viewConfig.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {onSearchChange && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8f86]" />
            <input
              type="text"
              placeholder="Search tasks..."
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-[#1d1917] border border-white/10 rounded-lg text-sm text-[#f2efed] placeholder:text-[#6b615a] focus:outline-none focus:border-[#8ea89e]/50 transition-colors"
            />
          </div>
        )}

        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8ea89e] to-[#6fa5a2] text-[#0f0d0c] rounded-lg font-medium text-sm hover:shadow-lg hover:scale-105 transition-all"
        >
          <Plus size={18} />
          <span>Create Task</span>
        </button>
      </div>
    </header>
  );
}
