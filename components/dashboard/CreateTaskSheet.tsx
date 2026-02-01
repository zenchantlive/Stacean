"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import clsx from "clsx";
import { TaskPriority, PRIORITY_LABELS } from "@/lib/types/tracker-new";
import { PROJECTS } from "./ProjectSelector";

interface CreateTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
    title: string;
    description: string;
    priority: TaskPriority;
    project: string;
    parentId?: string;
  }) => Promise<void>;
}

const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low"];

export function CreateTaskSheet({ isOpen, onClose, onCreate }: CreateTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [project, setProject] = useState<string>(PROJECTS[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setProject(PROJECTS[0]?.id || "");
    setError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  const isValidTitle = title.trim().length >= 3;
  const isValidDescription = description.trim().length >= 10;
  const isValidProject = Boolean(project);
  const canSubmit = isValidTitle && isValidDescription && isValidProject && !isSubmitting;

  const handleGenerateDescription = () => {
    if (!title.trim()) {
      setError("Add a title first, then generate a description.");
      return;
    }
    const generated = `Objective: ${title.trim()}\n\nOutcome: Define the core deliverables, edge cases, and next actions for this task.`;
    setDescription(generated);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        priority,
        project,
      });
      reset();
      onClose();
    } catch (err) {
      setError("Failed to create task. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full md:max-w-xl bg-[#141110] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 shadow-2xl"
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1d1917] border border-white/10 flex items-center justify-center text-[#8ea89e]">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#f2efed]">Create Task</h3>
                  <p className="text-xs text-[#9a8f86]">Required: title, description, priority, project</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-[#9a8f86] hover:text-[#f2efed] hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="text-xs text-[#b46b4f] bg-[#b46b4f]/10 border border-[#b46b4f]/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase tracking-wide text-[#9a8f86]">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name the objective"
                  className="mt-2 w-full bg-[#1d1917] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f2efed] focus:outline-none focus:border-[#8ea89e]/40"
                />
                {!isValidTitle && title.length > 0 && (
                  <p className="text-[11px] text-[#b46b4f] mt-1">Title must be at least 3 characters.</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wide text-[#9a8f86]">Description</label>
                  <button
                    onClick={handleGenerateDescription}
                    className="text-[11px] text-[#8ea89e] flex items-center gap-1 hover:text-[#6fa5a2]"
                  >
                    <Sparkles size={12} /> Generate
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Define the outcome and success criteria"
                  className="mt-2 w-full bg-[#1d1917] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f2efed] focus:outline-none focus:border-[#8ea89e]/40"
                />
                {!isValidDescription && description.length > 0 && (
                  <p className="text-[11px] text-[#b46b4f] mt-1">Description must be at least 10 characters.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-[#9a8f86]">Priority</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PRIORITIES.map((option) => (
                      <button
                        key={option}
                        onClick={() => setPriority(option)}
                        className={clsx(
                          "px-3 py-2 rounded-xl border text-xs font-medium transition-colors",
                          priority === option
                            ? "border-[#8ea89e]/50 text-[#f2efed] bg-[#8ea89e]/10"
                            : "border-white/10 text-[#9a8f86] hover:text-[#f2efed] hover:border-white/20"
                        )}
                      >
                        {PRIORITY_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wide text-[#9a8f86]">Project</label>
                  <select
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    className="mt-2 w-full bg-[#1d1917] border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f2efed] focus:outline-none focus:border-[#8ea89e]/40"
                  >
                    {PROJECTS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <p className="text-[11px] text-[#9a8f86]">Tasks start in Open status.</p>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8ea89e] to-[#6fa5a2] text-[#0f0d0c] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
