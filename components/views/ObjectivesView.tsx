'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export function ObjectivesView() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tracker/tasks');
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle task move
  const handleTaskUpdate = async (taskId: string, updates: any) => {
    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
    ));

    // Persist to API
    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Handle task click
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  // Handle delete
  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      await fetch(`/api/tracker/tasks/${taskId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

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
    />
  );
}

export default ObjectivesView;