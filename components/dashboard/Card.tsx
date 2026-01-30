import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const cardStyles = {
  base: "bg-canvas border border-border rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md",
  header: "flex items-center justify-between mb-4",
  title: "font-serif text-ink text-lg font-medium",
  subtle: "text-muted font-sans text-sm",
};