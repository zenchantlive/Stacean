'use client';

import { useState, useEffect } from 'react';
import { X, Clock, User, Tag, MessageSquare, File, CheckCircle, ChevronDown } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  agentCodeName?: string;
  assignedTo?: string;
  createdAt: number | string;
  updatedAt: number | string;
}

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

type TabType = 'overview';

const TABS: { id: TabType; label: string; icon: typeof Clock }[] = [
  { id: 'overview', label: 'Overview', icon: Tag },
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'TODO', color: '#71717A' },
  { value: 'assigned', label: 'ASSIGNED', color: '#F59E0B' },
  { value: 'active', label: 'ACTIVE', color: '#3B82F6' },
  { value: 'needs-you', label: 'NEEDS YOU', color: '#8B5CF6' },
  { value: 'ready', label: 'READY', color: '#F97316' },
  { value: 'shipped', label: 'SHIPPED', color: '#22C55E' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#71717A' },
  { value: 'medium', label: 'Medium', color: '#3B82F6' },
  { value: 'high', label: 'High', color: '#F97316' },
  { value: 'urgent', label: 'Urgent', color: '#EF4444' },
];

function formatTime(timestamp: number | string) {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TaskModal({ task, onClose, onUpdate }: TaskModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Handle escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdate({ status: newStatus });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#18181B] border border-[#27272A] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#27272A]">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg font-semibold text-white truncate">
              {task.title}
            </h2>
            <p className="text-[#71717A] text-sm mt-1">
              Updated {formatTime(task.updatedAt)}
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
        <div className="flex gap-1 px-6 border-b border-[#27272A]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${activeTab === tab.id 
                    ? 'text-[#F97316] border-[#F97316]' 
                    : 'text-[#71717A] border-transparent hover:text-white'
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={task.status}
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
                      value={task.priority}
                      onChange={(e) => onUpdate({ priority: e.target.value })}
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
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-2 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={task.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
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
                  value={task.agentCodeName || task.assignedTo || ''}
                  onChange={(e) => onUpdate({ agentCodeName: e.target.value })}
                  placeholder="Unassigned"
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-3 text-white text-sm placeholder-[#52525B] focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#27272A] bg-[#09090B]">
          <div className="text-[#71717A] text-sm">
            Task ID: {task.id}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#18181B] border border-[#27272A] rounded-lg text-white text-sm font-medium hover:bg-[#27272A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onUpdate(task);
                onClose();
              }}
              className="px-6 py-2 bg-[#F97316] rounded-lg text-white text-sm font-medium hover:bg-[#EA580C] transition-colors"
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