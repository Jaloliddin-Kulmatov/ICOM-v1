"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function token() { return typeof window !== "undefined" ? localStorage.getItem("icon_token") : null; }

type ChatMessage = { id: number; club_id: number; user_id: number; author_name: string; content: string; created_at: string };
type Club = { id: number; name: string };

export default function ClubChat({ club, onClose }: { club: Club; onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  const fetchMessages = useCallback(async (after = 0) => {
    const res = await fetch(`${API}/clubs/${club.id}/chat?after=${after}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) { setError("You must be a member to view the chat."); setLoading(false); return; }
    const d = await res.json();
    const msgs: ChatMessage[] = d.messages || [];
    if (msgs.length > 0) {
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        const newOnes = msgs.filter(m => !ids.has(m.id));
        return [...prev, ...newOnes];
      });
      lastIdRef.current = msgs[msgs.length - 1].id;
    }
    setLoading(false);
  }, [club.id]);

  // Initial load
  useEffect(() => { fetchMessages(0); }, [fetchMessages]);

  // Poll every 4 seconds for new messages
  useEffect(() => {
    const interval = setInterval(() => fetchMessages(lastIdRef.current), 4000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Save last-read message ID to localStorage when chat is closed/unmounted.
  // (Not on every message update — otherwise the badge gets cleared instantly
  // while the chat is still open, before the user notices new messages.)
  useEffect(() => {
    return () => {
      if (lastIdRef.current > 0) {
        localStorage.setItem(`chat_lid_${club.id}`, String(lastIdRef.current));
      }
    };
  }, [club.id]);

  // Also save when the user sends a message — clear signal that they've read up to that point
  useEffect(() => {
    if (lastIdRef.current > 0 && messages.length > 0) {
      const myLastSent = [...messages].reverse().find(m => m.user_id === user?.id);
      if (myLastSent) {
        localStorage.setItem(`chat_lid_${club.id}`, String(lastIdRef.current));
      }
    }
  }, [messages, club.id, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await fetch(`${API}/clubs/${club.id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ content: text }),
    });
    const d = await res.json();
    if (d.message) {
      setMessages(prev => [...prev, d.message]);
      lastIdRef.current = d.message.id;
      setInput("");
    }
    setSending(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" style={{ height: "420px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50 shrink-0">
        <MessageSquare size={15} className="text-indigo-500" />
        <span className="text-sm font-semibold text-foreground flex-1 truncate">{club.name}</span>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && <div className="flex justify-center pt-8"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>}
        {error && <p className="text-xs text-center text-red-400 pt-8">{error}</p>}
        {!loading && !error && messages.length === 0 && (
          <p className="text-xs text-center text-muted-foreground pt-8">No messages yet. Say hello! 👋</p>
        )}
        {messages.map(m => {
          const isMe = m.user_id === user?.id;
          return (
            <div key={m.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {m.author_name[0]?.toUpperCase()}
              </div>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMe && <span className="text-[10px] text-muted-foreground px-1">{m.author_name}</span>}
                <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? "bg-indigo-500 text-white rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}>
                  {m.content}
                </div>
                <span className="text-[9px] text-muted-foreground px-1">{formatRelativeTime(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        {!user ? (
          <p className="text-xs text-center text-muted-foreground">Sign in to chat</p>
        ) : error ? null : (
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="p-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
