"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ScreenshotStream() {
  const [screenshots, setScreenshots] = useState<string[]>([]);

  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        const res = await fetch("/state.json");
        const data = await res.json();
        setScreenshots(data.screenshots || []);
      } catch (err) {
        console.error("Failed to fetch screenshots:", err);
      }
    };

    fetchScreenshots();
    const interval = setInterval(fetchScreenshots, 5000);
    return () => clearInterval(interval);
  }, []);

  if (screenshots.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#A1A1AA] font-mono text-sm">
        No captures yet.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-[#A1A1AA] font-mono">VISUAL STREAM</p>
        <span className="text-[10px] bg-[#F97316]/10 text-[#F97316] px-2 py-0.5 rounded-full font-mono">LIVE</span>
      </div>
      
      <div className="flex-1 overflow-x-auto flex snap-x snap-mandatory space-x-4 pb-4 no-scrollbar">
        {screenshots.map((url, i) => (
          <motion.div 
            key={url}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-none w-[280px] aspect-[9/19.5] bg-[#18181B] rounded-2xl border border-white/5 overflow-hidden snap-center shadow-2xl"
          >
            <img 
              src={url} 
              alt={`Capture ${i}`} 
              className="w-full h-full object-cover"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
