import { TaskStatus } from "@/lib/types/tracker-new";

export type LegacyTaskStatus = "todo" | "in-progress" | "review" | "done" | "tombstone";

export const LEGACY_TO_NEW_STATUS: Record<string, TaskStatus> = {
  todo: "open",
  "in-progress": "in_progress",
  review: "review",
  done: "done",
  tombstone: "tombstone",
  open: "open",
  in_progress: "in_progress",
};

export const NEW_TO_LEGACY_STATUS: Record<TaskStatus, LegacyTaskStatus> = {
  open: "todo",
  in_progress: "in-progress",
  review: "review",
  done: "done",
  tombstone: "tombstone",
};

export function normalizeStatus(status: string): TaskStatus {
  return LEGACY_TO_NEW_STATUS[status] || "open";
}
