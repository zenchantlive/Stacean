"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";

export default function TestHeaderPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTask, setCurrentTask] = useState("Researching 2D game tech stack options");
  const [showBreakpoints, setShowBreakpoints] = useState(true);

  const breakpoints = [
    { name: "Mobile (XS)", width: "375px" },
    { name: "Mobile (SM)", width: "640px" },
    { name: "Tablet (MD)", width: "1024px" },
    { name: "Desktop (LG)", width: "1280px" },
  ];

  return (
    <div className="min-h-screen bg-[#09090B] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Header Component Test</h1>

        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="px-4 py-2 bg-[#F97316] text-white rounded-lg hover:bg-[#EA580C] transition-colors"
          >
            Toggle Status ({isOnline ? "Online" : "Offline"})
          </button>

          <button
            onClick={() => setShowBreakpoints(!showBreakpoints)}
            className="px-4 py-2 bg-[#71717A] text-white rounded-lg hover:bg-[#52525B] transition-colors"
          >
            {showBreakpoints ? "Hide" : "Show"} Breakpoints
          </button>

          <button
            onClick={() => setCurrentTask("")}
            className="px-4 py-2 bg-[#52525B] text-white rounded-lg hover:bg-[#3F3F46] transition-colors"
          >
            Clear Task
          </button>

          <button
            onClick={() => setCurrentTask("Researching 2D game tech stack options")}
            className="px-4 py-2 bg-[#3F3F46] text-white rounded-lg hover:bg-[#27272A] transition-colors"
          >
            Set Task
          </button>
        </div>

        {/* Current state display */}
        <div className="mb-8 p-4 bg-[#18181B] rounded-lg border border-[#27272A]">
          <h2 className="text-xl font-semibold text-white mb-4">Current State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#71717A]">Status:</span>
              <span className={`ml-2 font-semibold ${isOnline ? "text-green-500" : "text-red-500"}`}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            <div>
              <span className="text-[#71717A]">Current Task:</span>
              <span className="ml-2 font-semibold text-white">
                {currentTask || "(none)"}
              </span>
            </div>
          </div>
        </div>

        {/* Live header preview (actual size) */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Live Preview (Actual Size)</h2>
          <div className="border border-[#27272A] rounded-lg overflow-hidden">
            <Header isOnline={isOnline} currentTask={currentTask} />
          </div>
        </div>

        {/* Breakpoint simulations */}
        {showBreakpoints && (
          <div className="space-y-12">
            <h2 className="text-xl font-semibold text-white mb-4">Breakpoint Simulations</h2>
            {breakpoints.map((bp) => (
              <div key={bp.width} className="breakpoint-test">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-white">{bp.name}</h3>
                  <span className="text-[#71717A] text-sm">({bp.width})</span>
                </div>
                <div
                  className="border border-[#27272A] rounded-lg overflow-hidden"
                  style={{ width: bp.width }}
                >
                  <Header isOnline={isOnline} currentTask={currentTask} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Checklist */}
        <div className="mt-12 p-6 bg-[#18181B] rounded-lg border border-[#27272A]">
          <h2 className="text-xl font-semibold text-white mb-4">Test Checklist</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Logo and title visible at all breakpoints</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Status indicator (dot + text) visible and correct color</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Current task displays correctly (hidden on mobile if too long)</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Fixed header stays at top when scrolling</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Backdrop blur works correctly</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Safe area padding works on mobile (notch)</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>No horizontal overflow</span>
            </li>
            <li className="flex items-start gap-2 text-[#A1A1AA]">
              <span className="mt-1">□</span>
              <span>Text doesn't overlap or wrap incorrectly</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
