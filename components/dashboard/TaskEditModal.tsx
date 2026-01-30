"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Task, TaskPriority, TaskStatus } from "@/lib/types/tracker";
import { X, Edit3, Eye, Trash2, Calendar, Tag, User, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface TaskEditModalProps {
  task: Task;
  mode: 'view' | 'edit';
  onModeChange: (mode: 'view' | 'edit') => void;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'text-zinc-400' },
  { value: 'in-progress', label: 'In Progress', color: 'text-blue-400' },
  { value: 'review', label: 'Review', color: 'text-purple-400' },
  { value: 'done', label: 'Done', color: 'text-green-400' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
  { value: 'high', label: 'High', color: 'text-orange-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'low', label: 'Low', color: 'text-blue-400' },
];

export function TaskEditModal({ task, mode, onModeChange, onClose, onUpdate }: TaskEditModalProps) {
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
  });

  // Handle click outside to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = () => {
    onUpdate(task.id, editData);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      onUpdate(task.id, { status: 'done' } as any); // Soft delete via API
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onModeChange('view')}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                mode === 'view' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => onModeChange('edit')}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                mode === 'edit' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Edit3 size={16} />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          {mode === 'edit' ? (
            <div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <Tag size={12} />
                Title
              </label>
              <input
                type="text"
                value={editData.title}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 transition-colors"
                placeholder="Task title..."
              />
            </div>
          ) : (
            <div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <Tag size={12} />
                Title
              </label>
              <p className="text-white text-lg font-medium">{task.title}</p>
            </div>
          )}

          {/* Description */}
          {mode === 'edit' ? (
            <div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <Calendar size={12} />
                Description
              </label>
              <textarea
                value={editData.description}
                onChange={e => setEditData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Add a description..."
              />
            </div>
          ) : task.description && (
            <div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <Calendar size={12} />
                Description
              </label>
              <p className="text-zinc-400 text-sm">{task.description}</p>
            </div>
          )}

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <User size={12} />
                Status
              </label>
              <div className="relative">
                {mode === 'edit' ? (
                  <select
                    value={editData.status}
                    onChange={e => setEditData(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className={clsx(
                    "px-4 py-3 rounded-xl bg-[#18181B] border border-white/10",
                    STATUS_OPTIONS.find(o => o.value === task.status)?.color
                  )}>
                    {STATUS_OPTIONS.find(o => o.value === task.status)?.label}
                  </div>
                )}
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">
                <Tag size={12} />
                Priority
              </label>
              <div className="relative">
                {mode === 'edit' ? (
                  <select
                    value={editData.priority}
                    onChange={e => setEditData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/20 appearance-none cursor-pointer"
                  >
                    {PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <div className={clsx(
                    "px-4 py-3 rounded-xl bg-[#18181B] border border-white/10",
                    PRIORITY_OPTIONS.find(o => o.value === task.priority)?.color
                  )}>
                    {PRIORITY_OPTIONS.find(o => o.value === task.priority)?.label}
                  </div>
                )}
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/5">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
          
          {mode === 'edit' && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Save Changes
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
