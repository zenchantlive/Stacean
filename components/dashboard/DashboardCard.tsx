"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

/**
 * DashboardCard - Base component for all dashboard widgets
 * 
 * Features:
 * - Consistent header with icon and title
 * - Expandable (tap to see more)
 * - Minimum touch target (44px)
 * - Uses design tokens throughout
 */

interface DashboardCardProps {
  /** Card title */
  title: string;
  /** Icon to show in header */
  icon: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Footer content (actions, links) */
  footer?: ReactNode;
  /** Subtitle or description */
  subtitle?: string;
  /** Whether card can expand on click */
  expandable?: boolean;
  /** Handler for expand action */
  onExpand?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Whether content is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string;
}

export function DashboardCard({
  title,
  icon,
  children,
  footer,
  subtitle,
  expandable = false,
  onExpand,
  className = "",
  isLoading = false,
  error,
}: DashboardCardProps) {
  const handleClick = () => {
    if (expandable && onExpand) {
      onExpand();
    }
  };

  return (
    <div 
      className={`dashboard-card ${expandable ? "expandable" : ""} ${className}`}
      onClick={handleClick}
      role={expandable ? "button" : undefined}
      tabIndex={expandable ? 0 : undefined}
      onKeyDown={(e) => {
        if (expandable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onExpand?.();
        }
      }}
    >
      {/* Header */}
      <header className="dashboard-card-header">
        <div className="dashboard-card-icon">
          {icon}
        </div>
        <div className="dashboard-card-titles">
          <h3 className="dashboard-card-title">{title}</h3>
          {subtitle && (
            <p className="dashboard-card-subtitle">{subtitle}</p>
          )}
        </div>
        {expandable && (
          <ChevronRight size={18} className="dashboard-card-chevron" />
        )}
      </header>

      {/* Content */}
      <div className="dashboard-card-content">
        {isLoading ? (
          <div className="dashboard-card-loading">
            <div className="loading-skeleton" />
            <div className="loading-skeleton short" />
            <div className="loading-skeleton shorter" />
          </div>
        ) : error ? (
          <div className="dashboard-card-error">
            <p>{error}</p>
            <button className="retry-btn tap-target">Retry</button>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && !isLoading && !error && (
        <footer className="dashboard-card-footer">
          {footer}
        </footer>
      )}
    </div>
  );
}
