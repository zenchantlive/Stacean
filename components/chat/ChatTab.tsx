"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, Bot, AlertCircle } from "lucide-react";
import { ChatMessage } from "@/lib/integrations/kv/chat";

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/stacean/chat");
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
      setError(null);
    } catch (err) {
      console.error("Chat fetch error:", err);
      setError("Connection to gateway interrupted");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const text = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/stacean/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      fetchMessages();
    } catch (err) {
      console.error("Send error:", err);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin mb-4" />
        <p className="text-[#A1A1AA]">Initializing secure link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] bg-[#18181B] border border-[#27272A] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-white">Live Comms: Gateway Online</span>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <Bot className="w-12 h-12 text-[#52525B] mb-2" />
            <p className="text-[#71717A] text-sm">No transmissions yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-end gap-2 max-w-[80%] ${msg.direction === "outbound" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.direction === "outbound" ? "bg-[#F97316]/20 text-[#F97316]" : "bg-[#27272A] text-[#A1A1AA]"
                }`}>
                  {msg.direction === "outbound" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  msg.direction === "outbound" 
                    ? "bg-[#F97316] text-white rounded-br-none" 
                    : "bg-[#27272A] text-white rounded-bl-none"
                }`}>
                  {msg.text}
                  <div className={`text-[10px] mt-1 opacity-50 ${msg.direction === "outbound" ? "text-right" : "text-left"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-[#18181B] border-t border-[#27272A]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to Gateway..."
            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-[#F97316] transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
              input.trim() && !sending ? "bg-[#F97316] text-white hover:bg-[#EA580C]" : "bg-[#27272A] text-[#71717A]"
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
