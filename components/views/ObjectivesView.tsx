'use client';

import { useState, useEffect, useCallback } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { SSEStatusIndicator } from '@/components/common/SSEStatusIndicator';
import { Task } from '@/types/task';

export function ObjectivesView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tracker/tasks');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
      await fetchTasks();
    } catch (err) {
      console.error('Failed to delete task:', err);
      // Revert on error
      await fetchTasks();
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
      await fetchTasks();
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
    <KanbanBoard
      initialTasks={tasks}
      onTaskClick={handleTaskClick}
      onTaskDelete={handleTaskDelete}
      onTaskUpdate={handleTaskUpdate}
      onCreateTask={handleCreateTask}
      onSettingsClick={handleSettingsClick}
    />
  );
}

export default ObjectivesView;
