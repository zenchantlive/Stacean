"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LedgerItem {
  text: string;
  isHeader: boolean;
  time: string;
}

export function LedgerFeed() {
  const [items, setItems] = useState<LedgerItem[]>([]);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch("/api/ledger");
        const data = await res.json();
        // Handle both array and { entries: [...] } format
        const entries = Array.isArray(data) ? data : (data.entries || []);
        // Transform to ledger items
        const items = entries.map((entry: { message: string; timestamp: string; type?: string }) => ({
          text: entry.message,
          isHeader: entry.type === 'pulse',
          time: new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }));
        setItems(items);
      } catch (err) {
        console.error("Failed to fetch ledger:", err);
      }
    };

    fetchLedger();
    const interval = setInterval(fetchLedger, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div className="px-2 flex justify-between items-center">
        <p className="text-xs text-[#A1A1AA] font-mono">THE LEDGER</p>
        <span className="text-[10px] text-[#71717A] font-mono">Session Log</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-3 rounded-xl border ${
              item.isHeader 
                ? "bg-[#F97316]/5 border-[#F97316]/20" 
                : "glass-card"
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] font-mono ${item.isHeader ? "text-[#F97316]" : "text-[#71717A]"}`}>
                {item.time}
              </span>
              {item.isHeader && (
                <span className="text-[10px] text-[#F97316] font-bold uppercase tracking-tighter">Event</span>
              )}
            </div>
            <p className={`text-sm ${item.isHeader ? "text-[#FAFAFA] font-bold" : "text-[#E4E4E7] font-mono"}`}>
              {item.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
