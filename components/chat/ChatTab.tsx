"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User, Bot, AlertCircle, Loader2 } from "lucide-react";
import { ChatMessage } from "@/lib/integrations/kv/chat";

export default function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/stacean/messages?limit=50");
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
      setError(null);
    } catch (err) {
      console.error("Chat fetch error:", err);
      setError("Connection lost. Retrying...");
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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // Optimistic update
    const tempId = Math.random().toString(36).substring(7);
    const optimisticMsg: ChatMessage = {
      id: tempId,
      direction: "outbound",
      text,
      from: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/stacean/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      
      // Refresh to get the real ID and timestamp
      await fetchMessages();
    } catch (err) {
      console.error("Send error:", err);
      setError("Failed to send. Please try again.");
      // Remove optimistic msg on error? Or mark as failed?
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      setInputText(text); // Restore text
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-[#18181B] border border-[#27272A] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#27272A] flex items-center justify-between bg-[#1C1C1F]">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#F97316]" />
          <h2 className="text-sm font-semibold text-white">Live Comms</h2>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Loader2 className="w-6 h-6 text-[#71717A] animate-spin" />
            <p className="text-xs text-[#71717A]">Opening channel...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#71717A] text-sm">
            <p>No messages yet.</p>
            <p className="text-xs">Say hello to the gateway.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.direction === "outbound"
                    ? "bg-[#F97316] text-white rounded-tr-none"
                    : "bg-[#27272A] text-white rounded-tl-none"
                }`}
              >
                {msg.media && msg.media.length > 0 && (
                  <div className="mb-2 space-y-2">
                    {msg.media.map((url, i) => (
                      <img key={i} src={url} alt="Attachment" className="rounded-lg max-w-full h-auto border border-white/10" />
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 opacity-60 ${msg.direction === "outbound" ? "text-right" : "text-left"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSend}
        className="p-4 border-t border-[#27272A] bg-[#1C1C1F] flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message gateway..."
          className="flex-1 bg-[#09090B] border border-[#27272A] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#F97316] placeholder-[#71717A]"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="p-2 bg-[#F97316] text-white rounded-lg hover:bg-[#EA580C] disabled:opacity-50 disabled:hover:bg-[#F97316] transition-colors"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
