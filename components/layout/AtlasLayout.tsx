'use client';

import React from 'react';
import { LayoutGrid, CheckSquare, Layers, Zap, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AtlasLayoutProps {
  children: React.ReactNode;
  className?: string;
  currentView?: 'objectives' | 'agents' | 'energy' | 'live';
}

const navItems = [
  { id: 'objectives' as const, label: 'Objectives', icon: LayoutGrid },
  { id: 'agents' as const, label: 'Agents', icon: CheckSquare },
  { id: 'energy' as const, label: 'Energy', icon: Zap },
  { id: 'live' as const, label: 'Live', icon: Layers },
];

export function AtlasLayout({ children, className, currentView = 'objectives' }: AtlasLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-[var(--font-sans)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30">
              <LayoutGrid size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              Atlas
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  currentView === item.id
                    ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] animate-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-2 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    currentView === item.id
                      ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={cn("flex-1 w-full max-w-full mx-auto", className)}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden sticky bottom-0 z-40 w-full border-t border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]/80 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-0 p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "flex flex-col items-center justify-center py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 rounded-xl",
                currentView === item.id
                  ? "text-[var(--accent)] bg-[var(--accent)]/5"
                  : "hover:bg-[var(--bg-tertiary)]"
              )}
            >
              <item.icon
                size={20}
                className={currentView === item.id ? "stroke-[2px]" : ""}
              />
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
