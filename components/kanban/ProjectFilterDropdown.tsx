'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import type { Task } from '@/types/task';

interface ProjectFilterDropdownProps {
  tasks: Task[];
  selectedProject: string;
  onProjectChange: (project: string) => void;
}

const PROJECTS = [
  { value: 'all', label: 'All Projects' },
  { value: 'clawd', label: '🦞 Clawd' },
  { value: 'stacean-repo', label: '🎯 Stacean' },
  { value: 'personal-life', label: '🏠 Personal Life' },
];

export function ProjectFilterDropdown({
  tasks,
  selectedProject,
  onProjectChange,
}: ProjectFilterDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count tasks per project
  const projectCounts = PROJECTS.reduce(
    (acc, project) => {
      if (project.value === 'all') {
        acc[project.value] = tasks.length;
      } else {
        acc[project.value] = tasks.filter((t) => t.project === project.value).length;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const currentProject = PROJECTS.find((p) => p.value === selectedProject);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all duration-200 font-medium text-sm border border-transparent hover:border-[var(--accent)]/50"
        aria-label="Filter by project"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Filter
          size={16}
          className={selectedProject !== 'all' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}
        />
        <span className="hidden sm:inline">
          {currentProject?.label || 'All Projects'}
        </span>
        {selectedProject !== 'all' && projectCounts[selectedProject] > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded-full">
            {projectCounts[selectedProject]}
          </span>
        )}
        <ChevronDown
          size={14}
          className={`ml-1 opacity-50 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-[var(--bg-tertiary)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Filter by Project
            </p>
          </div>
          {PROJECTS.map((project) => (
            <button
              key={project.value}
              type="button"
              onClick={() => {
                onProjectChange(project.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--bg-tertiary)] ${
                selectedProject === project.value
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-[var(--text-secondary)]'
              }`}
              role="menuitem"
            >
              <span className="flex items-center gap-2">
                {project.label}
                {project.value !== 'all' && projectCounts[project.value] > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-xs rounded-full ${
                      selectedProject === project.value
                        ? 'bg-[var(--accent)]/20'
                        : 'bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {projectCounts[project.value]}
                  </span>
                )}
              </span>
              {selectedProject === project.value && (
                <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

ProjectFilterDropdown.displayName = 'ProjectFilterDropdown';
