"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * TaskWidget - Summary card for dashboard
 * 
 * Shows:
 * - Active task count
 * - Top 3 tasks preview
 * - Quick add button
 * - Link to full task management at /tasks
 */

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
}

interface TaskWidgetProps {
  isActive?: boolean;
}

export function TaskWidget({ isActive = false }: TaskWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/tracker/tasks");
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeTasks = tasks.filter(t => 
    t.status !== "done" && t.status !== "closed" && t.status !== "completed"
  );
  const completedToday = tasks.filter(t => 
    t.status === "done" || t.status === "closed" || t.status === "completed"
  ).length;

  return (
    <div className="task-widget">
      {/* Header */}
      <div className="task-widget-header">
        <div className="task-widget-icon">
          <CheckSquare size={18} />
        </div>
        <h3 className="task-widget-title">Tasks</h3>
      </div>

      {/* Summary */}
      <div className="task-widget-summary">
        {isLoading ? (
          <p className="task-widget-loading">Loading tasks...</p>
        ) : (
          <p className="task-widget-count">
            <span className="count-active">{activeTasks.length} active</span>
            {completedToday > 0 && (
              <span className="count-completed"> • {completedToday} completed</span>
            )}
          </p>
        )}
      </div>

      {/* Task Preview */}
      {!isLoading && activeTasks.length > 0 && (
        <ul className="task-widget-preview">
          {activeTasks.slice(0, 3).map(task => (
            <li key={task.id} className="task-preview-item">
              <span className="task-checkbox">□</span>
              <span className="task-title">{task.title}</span>
            </li>
          ))}
          {activeTasks.length > 3 && (
            <li className="task-preview-more">
              +{activeTasks.length - 3} more
            </li>
          )}
        </ul>
      )}

      {/* Empty State */}
      {!isLoading && activeTasks.length === 0 && (
        <p className="task-widget-empty">No active tasks</p>
      )}

      {/* Actions */}
      <div className="task-widget-actions">
        <button className="task-add-btn tap-target">
          <Plus size={16} />
          <span>Add Task</span>
        </button>
        <Link href="/tasks" className="task-manage-link tap-target">
          <span>Manage</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
