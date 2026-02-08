'use client';

import { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ProjectFilterDropdown } from '@/components/kanban/ProjectFilterDropdown';
import { SSEStatusIndicator } from '@/components/common/SSEStatusIndicator';
import { Task, Project } from '@/types/task';

export function ObjectivesView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'stacean' | 'beads' | 'both'>('both');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch tasks from KV (multi-repo source)
  const fetchKVTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tracker/kv-tasks');
      const data = await res.json();
      return data.tasks || [];
    } catch (err) {
      console.error('Failed to fetch KV tasks:', err);
      return [];
    }
  }, []);

  // Fetch projects from KV registration
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/tracker/projects');
      const data = await res.json();
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  // Fetch all tasks
  const fetchTasks = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // Fetch tasks from KV (single source of truth)
      const kvTasks = await fetchKVTasks();

      // Tasks already come from KV with project filtering
      setTasks(kvTasks);

      // Update data source indicator
      if (kvTasks.length > 0) {
        setDataSource('stacean');
      } else {
        setDataSource('beads');
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchKVTasks]);

  // Initial fetch and polling
  useEffect(() => {
    fetchTasks();
    fetchProjects();
    const interval = setInterval(() => {
      fetchTasks();
      fetchProjects();
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [fetchTasks, fetchProjects]);

  // Handle task move
  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ));

    // Persist to API
    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      // Fetch updated tasks to confirm
      await fetchTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert on error
      await fetchTasks();
    }
  }, [fetchTasks]);

  // Handle task click
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  // Handle delete
  const handleTaskDelete = useCallback(async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: 'DELETE',
      });

      // Fetch updated tasks to confirm
      await fetchTasks(false);
    } catch (err) {
      console.error('Failed to delete task:', err);
      // Revert on error
      await fetchTasks(false);
    }
  }, [fetchTasks]);

  // Handle create task
  const handleCreateTask = useCallback(async () => {
    const title = prompt('Enter task title:');
    if (!title?.trim()) return;

    try {
      await fetch('/api/tracker/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority: 'medium',
        }),
      });

      // Fetch updated tasks
      await fetchTasks(false);
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task. Please try again.');
    }
  }, [fetchTasks]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    alert('Settings panel coming soon!');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#71717A] text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Project Filter */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--bg-tertiary)]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Objectives</h2>
          <ProjectFilterDropdown
            tasks={tasks}
            availableProjects={projects}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
          />
        </div>
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
          {tasks.length} tasks | {dataSource === 'both' ? 'Stacean + Beads' : dataSource === 'beads' ? 'Beads Only' : 'Stacean'}
        </span>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          initialTasks={tasks}
          selectedProject={selectedProject}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleTaskDelete}
          onTaskUpdate={handleTaskUpdate}
          onCreateTask={handleCreateTask}
          onSettingsClick={handleSettingsClick}
        />
      </div>
    </div>
  );
}

export default ObjectivesView;
