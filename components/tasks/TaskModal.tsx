'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Clock, User, Tag, MessageSquare, File, CheckCircle, ChevronDown, History, Bot } from 'lucide-react';
import type { Task, TaskActivity } from '@/types/task';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

type TabType = 'overview' | 'activity' | 'sub_agents' | 'deliverables';

const TABS: { id: TabType; label: string; icon: typeof Clock }[] = [
  { id: 'overview', label: 'Overview', icon: Tag },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'sub_agents', label: 'Sub-agents', icon: Bot },
  { id: 'deliverables', label: 'Deliverables', icon: File },
];

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'todo', label: 'TODO', color: '#71717A' },
  { value: 'in_progress', label: 'IN PROGRESS', color: '#F97316' },
  { value: 'needs-you', label: 'NEEDS YOU', color: '#F59E0B' },
  { value: 'review', label: 'REVIEW', color: '#8B5CF6' },
  { value: 'ready', label: 'READY', color: '#22C55E' },
  { value: 'shipped', label: 'SHIPPED', color: '#10B981' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#71717A' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
];

const PROJECT_OPTIONS = [
  { value: 'clawd', label: '🦞 Clawd', color: '#F97316' },
  { value: 'stacean-repo', label: '🎯 Stacean', color: '#8B5CF6' },
  { value: 'personal-life', label: '🏠 Personal Life', color: '#10B981' },
];

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
  });
}

export function TaskModal({ task: initialTask, onClose, onUpdate, onStatusChange }: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [localTask, setLocalTask] = useState<Task>(initialTask);
  const [newComment, setNewComment] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update local task when prop changes
  useEffect(() => {
    setLocalTask(initialTask);
  }, [initialTask]);

  // Scroll to bottom when activity tab opens
  useEffect(() => {
    if (activeTab === 'activity' && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [activeTab]);

  // Handle escape key - stable callback
  const handleEscape = useCallback((e: KeyboardEvent): void => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return (): void => window.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Track status change for activity log
  const handleStatusChange = (newStatus: string) => {
    const status = newStatus as import('@/types/task').TaskStatus;
    const taskId = localTask.id;  // ✅ FIXED: Capture ID before state update
    const oldStatus = STATUS_OPTIONS.find(s => s.value === localTask.status)?.label || localTask.status;
    const newStatusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
    
    const activity: import('@/types/task').TaskActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'status_changed',
      details: `Status changed from ${oldStatus} to ${newStatusLabel}`,
    };

    const updatedTask: import('@/types/task').Task = {
      ...localTask,
      status: status,
      updatedAt: new Date().toISOString(),
      activities: [activity, ...(localTask.activities || [])],
    };

    setLocalTask(updatedTask);
    onUpdate({ 
      status: status, 
      activities: updatedTask.activities,
    });
    
    // Also call onStatusChange for mobile parent component (use captured ID)
    if (onStatusChange) {
      onStatusChange(taskId, status);
    }
  };

  // Track priority change for activity log
  const handlePriorityChange = (newPriority: string) => {
    const priority = newPriority as import('@/types/task').TaskPriority;
    const oldPriority = PRIORITY_OPTIONS.find(p => p.value === localTask.priority)?.label || localTask.priority;
    const newPriorityLabel = PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority;
    
    const activity: import('@/types/task').TaskActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'priority_changed',
      details: `Priority changed from ${oldPriority} to ${newPriorityLabel}`,
    };

    const updatedTask: import('@/types/task').Task = {
      ...localTask,
      priority: priority,
      updatedAt: new Date().toISOString(),
      activities: [activity, ...(localTask.activities || [])],
    };

    setLocalTask(updatedTask);
    onUpdate({ 
      priority: priority,
      activities: updatedTask.activities,
    });
  };

  // Track description change
  const handleDescriptionChange = (newDescription: string) => {
    const oldDesc = localTask.description || '';
    const newDesc = newDescription.trim();
    
    // Only log if actually changed
    if (oldDesc !== newDesc && newDesc) {
      const activity: TaskActivity = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'description_updated',
        details: 'Description updated',
      };

      setLocalTask(prev => ({
        ...prev,
        description: newDesc,
        updatedAt: new Date().toISOString(),
        activities: [activity, ...(prev.activities || [])],
      }));
    } else {
      setLocalTask(prev => ({ ...prev, description: newDesc }));
    }
  };

  // Track assignee change
  const handleAssigneeChange = (newAssignee: string) => {
    const activity: TaskActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'assigned',
      details: newAssignee ? `Assigned to ${newAssignee}` : 'Assignment cleared',
    };

    const updatedTask = {
      ...localTask,
      agentCodeName: newAssignee,
      assignedTo: newAssignee,
      updatedAt: new Date().toISOString(),
      activities: [activity, ...(localTask.activities || [])],
    };

    setLocalTask(updatedTask);
    onUpdate({ 
      agentCodeName: newAssignee,
      assignedTo: newAssignee,
      activities: updatedTask.activities,
    });
  };

  // Add comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const activity: TaskActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'comment',
      details: newComment.trim(),
    };

    const updatedTask = {
      ...localTask,
      updatedAt: new Date().toISOString(),
      activities: [activity, ...(localTask.activities || [])],
    };

    setLocalTask(updatedTask);
    setNewComment('');
    onUpdate({ activities: updatedTask.activities });
  };

  // Save all changes
  const handleSave = () => {
    onUpdate(localTask);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#18181B] border border-[#27272A] rounded-t-2xl sm:rounded-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#27272A] flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-base sm:text-lg font-semibold text-white truncate">
              {localTask.title}
            </h2>
            <p className="text-[#71717A] text-xs sm:text-sm mt-1">
              Updated {formatTime(localTask.updatedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#27272A] rounded-lg transition-colors flex-shrink-0"
          >
            <X size={20} className="text-[#71717A]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b border-[#27272A] flex-shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex-shrink-0
                  ${activeTab === tab.id 
                    ? 'text-[#F97316] border-[#F97316]' 
                    : 'text-[#71717A] border-transparent hover:text-white'
                  }
                `}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status, Priority & Project */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={localTask.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-[#F97316]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={localTask.priority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-[#F97316]"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                    Project
                  </label>
                  <div className="relative">
                    <select
                      value={localTask.project || 'clawd'}
                      onChange={(e) => onUpdate({ project: e.target.value })}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-[#F97316]"
                    >
                      {PROJECT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={localTask.description || ''}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  onBlur={() => onUpdate({ description: localTask.description })}
                  placeholder="Add a description..."
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white text-sm placeholder-[#52525B] focus:outline-none focus:border-[#F97316] resize-none"
                  rows={4}
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                  Assignee
                </label>
                <input
                  type="text"
                  value={localTask.agentCodeName || localTask.assignedTo || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  onBlur={() => onUpdate({ 
                    agentCodeName: localTask.agentCodeName,
                    assignedTo: localTask.assignedTo,
                  })}
                  placeholder="Unassigned"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white text-sm placeholder-[#52525B] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              {/* Project */}
              {localTask.project && (
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                    Project
                  </label>
                  <div className="bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white text-sm">
                    {localTask.project}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4" ref={scrollRef}>
              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#52525B] focus:outline-none focus:border-[#F97316]"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2.5 bg-[#F97316] rounded-lg text-white text-sm font-medium hover:bg-[#EA580C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={16} />
                </button>
              </div>

              {/* Activity Timeline */}
              {localTask.activities && localTask.activities.length > 0 ? (
                <div className="space-y-3">
                  {localTask.activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#F97316] mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">{activity.details}</p>
                        <p className="text-[#71717A] text-xs mt-1">
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History size={32} className="mx-auto text-[#52525B] mb-3" />
                  <p className="text-[#71717A] text-sm">No activity yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sub_agents' && (
            <div className="text-center py-8">
              <Bot size={32} className="mx-auto text-[#52525B] mb-3" />
              <p className="text-[#71717A] text-sm">Sub-agent tracking coming soon</p>
              <p className="text-[#52525B] text-xs mt-1">This will show which agents are working on this task</p>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="text-center py-8">
              <File size={32} className="mx-auto text-[#52525B] mb-3" />
              <p className="text-[#71717A] text-sm">Deliverable tracking coming soon</p>
              <p className="text-[#52525B] text-xs mt-1">This will show files and artifacts related to this task</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-[#27272A] bg-[#09090B] flex-shrink-0">
          <div className="text-[#71717A] text-xs sm:text-sm">
            Task ID: {localTask.id}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#18181B] border border-[#27272A] rounded-lg text-white text-sm font-medium hover:bg-[#27272A] transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#F97316] rounded-lg text-white text-sm font-medium hover:bg-[#EA580C] transition-colors touch-manipulation"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
