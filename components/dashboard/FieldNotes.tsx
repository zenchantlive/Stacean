"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface Note {
  text: string;
  time: string;
}

export function FieldNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      setInput("");
      await fetchNotes();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      <div className="px-2 flex justify-between items-center">
        <p className="text-xs text-[#A1A1AA] font-mono">FIELD NOTES</p>
        <span className="text-[10px] text-[#71717A] font-mono">{notes.length} notes</span>
      </div>

      <form onSubmit={handleSubmit} className="px-2 flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Leave a note for Atlas..."
          className="flex-1 bg-[#18181B] border border-white/5 rounded-xl px-4 py-3 text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-[#F97316]/50 transition-colors"
        />
        <button 
          type="submit"
          disabled={!input.trim() || sending}
          className="bg-[#F97316] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#F97316]/20 active:scale-95 transition-all flex items-center gap-1"
        >
          <Send size={14} />
          {sending ? "..." : "Send"}
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-3 px-2 pr-4 no-scrollbar">
        {notes.length === 0 ? (
          <p className="text-[#52525B] text-sm text-center py-8">No notes yet. Leave one above!</p>
        ) : (
          notes.map((note, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 glass-card shadow-sm hover:border-[#F97316]/30 transition-colors"
            >
              <p className="text-sm text-[#E4E4E7] mb-2 leading-relaxed">{note.text}</p>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#71717A] font-mono">
                  {new Date(note.time).toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
